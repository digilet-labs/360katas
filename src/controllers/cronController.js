/* 
Copyright (C) 2020, Digilet Labs LLP.

This file is part of 360Katas.

360Katas is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

360Katas is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with 360Katas.  If not, see <https://www.gnu.org/licenses/>.
*/

const feedbackRequestController = require('./feedbackRequestController')
const teamController = require('./teamController')
const userController = require('./userController')

const messageController = require('./messageController')
const Constants = require('../Constants')
const messageView = require('../../features/views/messageView')
const feedbackReqActivityController = require('./feedbackReqActivityController')
const amplitudeService = require('../services/amplitudeService')
const startModalView = require('../../features/views/startModalView')
const Utils = require('../Utils')

let finishCompletedOngoingRequests = async function(botKitController){
    let result = await feedbackRequestController.finishCompletedOngoingRequests()
    if(result && result.feedbackRequests){
        result.feedbackRequests.forEach(async (feedbackReq) => {
            let selfAssessmentReqAct = await feedbackReqActivityController.getSelfAssessmentActivity(feedbackReq.id)
            let bot = await botKitController.spawn(feedbackReq.userId.slackTeamId)
            await bot.startPrivateConversation(feedbackReq.userId.slackId)
            let message = messageView.getFeedbackCompletedMessage(feedbackReq, selfAssessmentReqAct.status === Constants.FEEDBACK_REQ_STATUS.ONGOING)
            let data = await bot.say(message)
            let completeList = feedbackReq.peersList.concat(feedbackReq.managersList).concat(feedbackReq.reporteesList)
            completeList.forEach( userFor => {
                processExpiredRequestMessages(bot, {user: userFor, feedbackReq: feedbackReq})
            })
            if(feedbackReq.responsesReceived < 2){
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.RECEIVED_MESSAGE_FEEDBACK_REQ_NOT_COMPLETED, feedbackReq.userId)
            } else if(selfAssessmentReqAct.status === Constants.FEEDBACK_REQ_STATUS.ONGOING){
                await messageController.addMessage(feedbackReq.userId.id, Constants.MESSAGE_TYPE.FEEDBACK_REVIEW_SELF_CLARIF_MESSAGE, feedbackReq.id, data)
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.RECEIVED_MESSAGE_FEEDBACK_REQ_COMPLETED_CLARIFICATION_PENDING, feedbackReq.userId)
            } else {
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.RECEIVED_MESSAGE_FEEDBACK_REQUEST_COMPLETED, feedbackReq.userId)
            }
        })
    }
    console.log(result)
}

let processExpiredRequestMessages = async function(bot, result){
    let incomingFeedbackReqMessage = await messageController.getMessage(result.user.id, Constants.MESSAGE_TYPE.INCOMING_FEEDBACKREQ_MESSAGE,  result.feedbackReq.id)
        let incomingFeedbackReqMessageBlocks = messageView.getIncomingFeedbackRequestMessage(result.feedbackReq, result.user, false, true).blocks
        if(incomingFeedbackReqMessage){
            let data = {
                token: bot.api.token,
                ts: incomingFeedbackReqMessage.data.activityId,
                channel: incomingFeedbackReqMessage.data.conversation.id,
                text: "❌ Request expired",
                blocks: incomingFeedbackReqMessageBlocks
            }
            await bot.api.chat.update(data)
            await messageController.removeMessage(incomingFeedbackReqMessage.userId, incomingFeedbackReqMessage.type, incomingFeedbackReqMessage.refId)
        }
        let reminderMessages = await messageController.getMessages(result.user.id, Constants.MESSAGE_TYPE.FEEDBACK_REQ_REMINDER_MESSAGE, result.feedbackReq.id)
        if(reminderMessages){
            reminderMessages.forEach(async(reminderMessage) => {
                let data = {
                    token: bot.api.token,
                    ts: reminderMessage.data.activityId,
                    channel: reminderMessage.data.conversation.id,
                }
                await bot.api.chat.delete(data)
                await messageController.removeMessage(reminderMessage.userId, reminderMessage.type, reminderMessage.refId)
            })
        }
        let reqExtendedMessages = await messageController.getMessages(result.user.id, Constants.MESSAGE_TYPE.REQ_EXTENDED_MESSAGE, result.feedbackReq.id)
        if(reqExtendedMessages){
            reqExtendedMessages.forEach(async(reqExtendedMessage) => {
                let viewMessageBlocks = reqExtendedMessage.view.blocks
                let responseTime = Utils.formatDate(Date.now(), result.user.slackTimezoneOffset)
                viewMessageBlocks[2] =  {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `❌ Request expired on ${responseTime}`
                    }
                }
                let data = {
                    token: bot.api.token,
                    ts: reqExtendedMessage.data.activityId,
                    channel: reqExtendedMessage.data.conversation.id,
                    text: `❌ Request expired on ${responseTime}`,
                    blocks: viewMessageBlocks
                }
                await bot.api.chat.update(data)
                await messageController.removeMessage(reqExtendedMessage.userId, reqExtendedMessage.type, reqExtendedMessage.refId)
            })
        }
}

let concludeFinishedRequests = async function(){
    let result = await feedbackRequestController.concludeFinishedRequests()
    console.log(result)
}

let sendSoonExpiringRequestMessages = async function(botKitController){
    let requests = await feedbackRequestController.getSoonExpiringRequests()
    console.log(requests)
    requests.forEach( async (req) => {
        let bot = await botKitController.spawn(req.userId.slackTeamId)
        await bot.startPrivateConversation(req.userId.slackId)
        let message = messageView.getExtendMessage(req)
        let data = await bot.say(message)
        await messageController.addMessage(req.userId.id, Constants.MESSAGE_TYPE.EXTEND_MESSAGE, req.id, data, message)
        await feedbackRequestController.setIsExtendMessageSent(req.id)
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.RECEIVED_MESSAGE_EXTEND_REQUEST, req.userId)
    })
}

let processAllUsersForATeam = async function(botKitController, slackTeamId){
    let bot = await botKitController.spawn(slackTeamId)
    let team = await teamController.getTeamBySlackId(slackTeamId)
    try {
        if(team){
            let cursor = ''
            let users
            let newUsersAdded = 0
            do {
                users = await bot.api.users.list({cursor: cursor})
                let usersList = []
                for(let u in users.members){
                    let user = users.members[u]
                    if(user.deleted || user.is_bot || user.id === 'USLACKBOT')
                        continue
                    let userData = {
                        teamId: team.id,
                        slackId: user.id,
                        slackTeamId: slackTeamId,
                        slackUsername: user.name,
                        slackDisplayName: user.profile.real_name_normalized,  
                        slackTimezoneName: user.tz,
                        slackTimezoneOffset: user.tz_offset,
                        slackIsAdmin: user.is_admin,
                        slackIsOwner: user.is_owner,
                        slackProfileImage: user.profile.image_512
                    }
                    usersList.push(userData)
                }
                await userController.addListOfUsers(usersList)
                console.log('.')
                newUsersAdded += usersList.length
                cursor = users.response_metadata.next_cursor
            } while(cursor != '')
            await teamController.updateUserCount(team.id, newUsersAdded)
        } 
    } catch (error) {
        console.log(error)
    }
}

let processAllUsersForAllTeams = async function(botKitController){
    let teams = await teamController.getAllTeams()
    for(t in teams){
        let teamId = teams[t].slackId
        processAllUsersForATeam(botKitController, teamId)
        console.log('..')
    }
    console.log('DONE')
}

let sendFeedbackRequestsAutoReminders = async function(botKitController){
    let feedbackRequests = await feedbackRequestController.getAutoRemindersRequests()
    console.log(feedbackRequests)
    if(feedbackRequests && feedbackRequests.length > 0){
        feedbackRequests.forEach(async (feedbackReq) => {
            let bot = await botKitController.spawn(feedbackReq.userId.slackTeamId)
            let feedbackReqId = feedbackReq.id
            let feedbackRequestActivities = await feedbackReqActivityController.getPendingResponsesForRequest(feedbackReqId)
            let messageList = []
            for (let i =0;i < feedbackRequestActivities.length; i++){
                let feedbackRequestAct = feedbackRequestActivities[i]
                let message = messageView.getFeedbackRequestReminderMessage(feedbackRequestAct.feedbackRequest, feedbackRequestAct.userFor)
                await bot.startPrivateConversation(feedbackRequestAct.userFor.slackId)
                let data = await bot.say(message)
                messageList.push({
                    userId: feedbackRequestAct.userFor.id,
                    type: Constants.MESSAGE_TYPE.FEEDBACK_REQ_REMINDER_MESSAGE,
                    refId: feedbackRequestAct.feedbackRequest.id,
                    data: data
                })
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.RECEIVED_MESSAGE_SEND_REMINDERS, feedbackRequestAct.userFor)
            }
            await messageController.insertListOfMessages(messageList)
            await feedbackRequestController.addRemindersSentNow(feedbackReqId, {requestTimestamp: feedbackReq.requestTimestamp, requestCloseTimestamp: feedbackReq.closeReqTimestamp})
        })
    }
}

let repeatAutoRepeatingRequests = async function(botKitController){
    let requests = await feedbackRequestController.getNowAutoRepeatingRequests()
    requests.forEach( async(req) => {     
        let peersList = req.autoRepeatMetadata.peersList.map(u => u.slackId)
        let managersList = req.autoRepeatMetadata.managersList.map(u => u.slackId)
        let reporteesList = req.autoRepeatMetadata.reporteesList.map(u => u.slackId)
        let completeList = peersList.concat(managersList).concat(reporteesList)
        completeList = [ ...new Set(completeList) ]
        let requestCloseTimestamp = Date.now() + Constants.TIME.ONE_DAY * req.autoRepeatMetadata.nextDueDateDays
        let feedbackReqData = {
            userId: req.userId.slackId,
            teamId: req.userId.slackTeamId,
            peersList: peersList,
            managersList: managersList,
            reporteesList: reporteesList,
            usersList: completeList,
            questionsList: req.autoRepeatMetadata.questionsList,
            personalNote: req.autoRepeatMetadata.personalNote,
            requestCloseTimestamp: requestCloseTimestamp,
            autoRepeat: req.autoRepeatName
        }
        let result = await feedbackReqActivityController.addNewFeedbackRequest(feedbackReqData)
        await feedbackRequestController.removeAutoRepeat(req.id)
        let bot = await botKitController.spawn(req.userId.slackTeamId)
        startModalView.sendFeedbackRequestSent(bot, result.user, result.feedbackReq.id)
    })
    console.log("Repeating request: ", requests.length)
}

let sendScheduledMessages = async function(botKitController){
    let messages = await messageController.getScheduledMessages()
    if(messages && messages.length > 0){
        messages.forEach( async (m) => {
            let bot = await botKitController.spawn(m.userId.slackTeamId)
            await bot.startPrivateConversation(m.userId.slackId)
            let data = await bot.say(m.view)
            if (m.type === Constants.MESSAGE_TYPE.CLARIFICATION_MESSAGE_SCHEDULED){
                m.data = data
                m.type = Constants.MESSAGE_TYPE.CLARIFICATION_MESSAGE
                await messageController.updateMessage(m)
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.RECEIVED_MESSAGE_CLARIFICATION_REQUEST, m.userId)
            } else if (m.type === Constants.MESSAGE_TYPE.RESPOND_TO_CLARIFICATION_MESSAGE_SCHEDULED){
                await messageController.removeMessage(m.userId.id, Constants.MESSAGE_TYPE.RESPOND_TO_CLARIFICATION_MESSAGE_SCHEDULED, m.refId)
            }
        })
    }
}

module.exports = {
    finishCompletedOngoingRequests,
    concludeFinishedRequests,
    sendFeedbackRequestsAutoReminders,
    processAllUsersForATeam,
    processAllUsersForAllTeams,
    repeatAutoRepeatingRequests,
    sendSoonExpiringRequestMessages,
    sendScheduledMessages
}