const feedbackRequestController = require('../../src/controllers/feedbackRequestController')
const feedbackReqActivityController = require('../../src/controllers/feedbackReqActivityController')
const appHomeView = require('./appHomeView')
const amplitudeService = require('../../src/services/amplitudeService')
const Constants = require('../../src/Constants')
const userController = require('../../src/controllers/userController')
const Sentry = require('@sentry/node')
const messageController = require('../../src/controllers/messageController')
const messageView = require('./messageView')
const slackService = require('../../src/services/slackService')
const teamController = require('../../src/controllers/teamController')

let getRespondModal = function(feedbackReq, privateMetadata){
    let modal =  {
        "type": "modal",
        "callback_id": "respond_modal",
        "notify_on_close": true,
        "private_metadata": JSON.stringify(privateMetadata),
        "title": {
            "type": "plain_text",
            "text": 'Answer Feedback Request',
            "emoji": true
        },
        "submit": {
            "type": "plain_text",
            "text": "Submit",
            "emoji": true
        },
        "close": {
            "type": "plain_text",
            "text": "Cancel",
            "emoji": true
        },
        "blocks": [
        ]
    }
    let number = 0
    feedbackReq.questionsList.forEach((question) => {
        modal.blocks.push({
            "type": "input",
            "optional": true,
            "element": {
                "type": "plain_text_input",
                "multiline": true,
                "min_length": 1,
                "placeholder": {
                    "type": "plain_text",
                    "text": "Enter your response"
                },
                "action_id": `respond_modal.question_${number}`
            },
            "label": {
                "type": "plain_text",
                "text": question.replace(/\*/g, ''),
                "emoji": true
            },
            "block_id": `respond_modal.question_${number}`
        })
        number++
    })
    let randomImage = `${Constants.WEBSITE_HOST}images/quotes/respond/${Math.floor(Math.random() * 5)+1}.png`
    modal.blocks.push(...[
        {
            "type": "divider"
        },
        {
            "type": "image",
            "image_url": randomImage,
            "alt_text": "quotes"
        }
    ])
    return modal
}


let showRespondModalView = async function(bot, message, type = "message"){
    let feedbackReqId = message.actions[0].value
    let feedbackReq = await feedbackRequestController.getFeedbackRequestById(feedbackReqId)
    let modalView = getRespondModal(feedbackReq, { feedbackReqId: feedbackReq.id, type: type })
    let postData = { 
        token: bot.api.token,
        trigger_id: message.incoming_message.channelData.trigger_id,
        view: modalView
    }
    await bot.api.views.open(postData)
}

let processRespondModal = async function(bot, message){
    let messageStateValues = message.view.state.values
    let privateMetadata = JSON.parse(message.view.private_metadata)
    let answers = []
    for(let i in messageStateValues){
        if(i.startsWith('respond_modal.question_')){
            let num = parseInt(i.replace('respond_modal.question_', ''))
            answers[num] = messageStateValues[i][i].value
        }
    }
    let result = await feedbackReqActivityController.addResponses(message.user, privateMetadata.feedbackReqId, answers, false)
    if(result && result.responses){
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.RESPOND_TO_FEEDBACK_SUBMIT, message.internal_user)
        if(privateMetadata.type === 'home')
            appHomeView.showAppHome(bot, message, '', '✅ Your responses are recorded!')
        else
            appHomeView.showAppHome(bot, message)
        sendResponseSentMessage(bot, result.user, result.responses, result.feedbackReq)
        let incomingFeedbackReqMessage = await messageController.getMessage(result.user.id, Constants.MESSAGE_TYPE.INCOMING_FEEDBACKREQ_MESSAGE,  result.feedbackReq.id)
        let incomingFeedbackReqMessageBlocks = messageView.getIncomingFeedbackRequestMessage(result.feedbackReq, result.user, true).blocks
        if(incomingFeedbackReqMessage){
            let data = {
                token: bot.api.token,
                ts: incomingFeedbackReqMessage.data.activityId,
                channel: incomingFeedbackReqMessage.data.conversation.id,
                text: "✅ Response sent successfully",
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
        console.log(reqExtendedMessages)
        if(reqExtendedMessages){
            reqExtendedMessages.forEach(async(reqExtendedMessage) => {
                let viewMessageBlocks = reqExtendedMessage.view.blocks
                viewMessageBlocks[2] =  {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `✅ Response sent successfully`
                    }
                }
                let data = {
                    token: bot.api.token,
                    ts: reqExtendedMessage.data.activityId,
                    channel: reqExtendedMessage.data.conversation.id,
                    text: "✅ Response sent successfully",
                    blocks: viewMessageBlocks
                }
                await bot.api.chat.update(data)
                await messageController.removeMessage(reqExtendedMessage.userId, reqExtendedMessage.type, reqExtendedMessage.refId)
            })
        }
        if(result.feedbackReq.userId && (!result.feedbackReq.userId.userEvents || (result.feedbackReq.userId.userEvents && !result.feedbackReq.userId.userEvents.includes(Constants.USER_EVENTS.FEEDBACK_RECIEVED)))){
            await userController.addUserEvents(result.feedbackReq.userId.id, Constants.USER_EVENTS.FEEDBACK_RECIEVED)
        }
        let team = await teamController.getTeamBySlackId(result.user.slackTeamId)
        slackService.postNewResponseReceivedMessage(team.slackWorkspaceName, result.user.slackDisplayName, result.feedbackReq.userId.slackDisplayName, result.user.slackTimezoneName, team.numberOfUsers, result.feedbackReq.responsesReceived + 1, result.feedbackReq.totalResponses)
    } else {
        if(privateMetadata.type === 'home')
            appHomeView.showAppHome(bot, message, '', "⚠️ There was a problem in recording your responses. If using an iPhone, please add an 'enter' at the end of each text box or complete this step on a desktop.", {
                "type": "button",
                "style": "primary",
                "text": {
                    "type": "plain_text",
                    "emoji": true,
                    "text": "Try Again 🤾"
                },
                "action_id": "app_home.start_respond",
                "value": privateMetadata.feedbackReqId
            })
        Sentry.captureMessage(`Response Failed ${JSON.stringify(privateMetadata)},${JSON.stringify(messageStateValues)}`)
        sendErrorRecordingResponseMessage(bot, message, privateMetadata.feedbackReqId)
    }
}

let sendResponseSentMessage = async function(bot, user, responses, feedbackReq){
    let message = messageView.getResponseSentMessage(feedbackReq, responses, user)
    await bot.startPrivateConversation(user.slackId)
    let data = await bot.say(message)
    await messageController.addMessage(user.id, Constants.MESSAGE_TYPE.RESPOND_MESSAGE, feedbackReq.id, data, message)
    if(!user || (user && user.userEvents && !user.userEvents.includes(Constants.USER_EVENTS.FEEDBACK_SENT))){
        await userController.addUserEvents(user.id, Constants.USER_EVENTS.FEEDBACK_SENT)
    }
    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.RECEIVED_MESSAGE_RESPONSE_SENT, user)
}

let sendErrorRecordingResponseMessage = async function(bot, message, feedbackReqId){
    let errorMessage = {
        "text": `⚠️ There was a problem in recording your responses. If using an iPhone, please add an 'enter' at the end of each text box or complete this step on a desktop.`,
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `⚠️ There was a problem in recording your responses. If using an iPhone, please add an 'enter' at the end of each text box or complete this step on a desktop.`
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Try again!",
                            "emoji": true
                        },
                        "action_id": "app_home.start_respond",
                        "value": feedbackReqId
                    }
                ]
            }
        ]
    }
    await bot.startPrivateConversation(message.user)
    await bot.say(errorMessage)
}


module.exports = {
    showRespondModalView,
    processRespondModal
}