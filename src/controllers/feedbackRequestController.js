const FeedbackRequest = require('../models/feedbackRequestModel')
const Constants = require('../Constants')

let addNewFeedbackRequest = async function(feedbackReq, usersList){
    if(usersList && usersList.length > 1){
        let peersList = []
        let managersList = []
        let reporteesList = []
        let isUserSet = false
        let autoRepeat
        usersList.forEach(user => {
            if(feedbackReq.peersList.includes(user.slackId)){
                peersList.push(user.id)
            } else if (feedbackReq.managersList.includes(user.slackId)){
                managersList.push(user.id)
            } else if (feedbackReq.reporteesList.includes(user.slackId)){
                reporteesList.push(user.id)
            } else {
                feedbackReq.userId = user.id
                feedbackReq.teamId = user.teamId
                isUserSet = true
            }
        })
        if(!isUserSet)
            return null
        switch(feedbackReq.autoRepeat){
            case 'week':
                autoRepeat = Date.now() + Constants.TIME.ONE_WEEK
                break
            case 'fortnight':
                autoRepeat = Date.now() + Constants.TIME.ONE_WEEK * 2
                break
            case 'month':
                autoRepeat = Date.now() + Constants.TIME.ONE_MONTH
                break
            case 'quarter':
                autoRepeat = Date.now() + Constants.TIME.ONE_MONTH * 4
                break
        }
        let autoRepeatMetadata
        if (feedbackReq.autoRepeat !== 'dnr')
        autoRepeatMetadata = {
            questionsList: feedbackReq.questionsList,
            personalNote: feedbackReq.personalNote,
            peersList: peersList,
            managersList: managersList,
            reporteesList: reporteesList,
            nextDueDateDays: Math.floor( ( feedbackReq.requestCloseTimestamp - Date.now() ) / Constants.TIME.ONE_DAY )
        }
        let feedbackReqData = {
            userId: feedbackReq.userId,
            teamId: feedbackReq.teamId,
            peersList: peersList,
            managersList: managersList,
            reporteesList: reporteesList,
            questionsList: feedbackReq.questionsList,
            totalResponses: usersList.length - 1,
            personalNote: feedbackReq.personalNote,
            nextAutoReminder: getNextAutoReminder(Date.now(), feedbackReq.requestCloseTimestamp),
            closeReqTimestamp: feedbackReq.requestCloseTimestamp,
            autoRepeat: autoRepeat,
            autoRepeatName: feedbackReq.autoRepeat,
            autoRepeatMetadata: autoRepeatMetadata
        }
        return await FeedbackRequest.addNewFeedbackRequest(feedbackReqData)
    } else {
        return null
    }
}

let getPendingFeedbackRequest = function(userId){
    return FeedbackRequest.getPendingFeedbackRequest(userId)
}

let getFeedbackRequestById = function(feedbackReqId){
    return FeedbackRequest.getFeedbackRequestById(feedbackReqId)
}

let incrementResponsesReceived = function(feedbackReqId){
    return FeedbackRequest.incrementResponsesReceived(feedbackReqId)
}

let finishCompletedOngoingRequests = async function(){
    let feedbackRequests = await FeedbackRequest.getCompletedOngoingRequests()
    if(feedbackRequests.length === 0){
        return {result: { n: 0, nModified: 0, ok: 1 }}
    }
    let result = await FeedbackRequest.finishCompletedOngoingRequests()
    return { feedbackRequests, result } 
}

let concludeFinishedRequests = function(){
    return FeedbackRequest.concludeFinishedRequests()
}

let getConcludedRequests = function(userId){
    return FeedbackRequest.getConcludedRequests(userId)
}

let getLastFeedbackRequest = function(userId){
    return FeedbackRequest.getLastFeedbackRequest(userId)
}

let getMyOngoingFeedbackRequests = function(userId){
    return FeedbackRequest.getMyOngoingFeedbackRequests(userId)
}

let concludeFeedbackRequest = function(feedbackReqId){
    return FeedbackRequest.concludeFeedbackRequest(feedbackReqId)
}

let getSoonExpiringRequests = function(){
    return FeedbackRequest.getSoonExpiringRequests()
}

let setIsExtendMessageSent = function(feedbackReqId){
    return FeedbackRequest.setIsExtendMessageSent(feedbackReqId)
}

let extendFeedbackRequest = function(feedbackReqId, closeReqTimestamp){
    return FeedbackRequest.extendFeedbackRequest(feedbackReqId, closeReqTimestamp) 
}

let addRemindersSentNow = function(feedbackReqId, setAutoReminder = null){
    let nextAutoReminder = null
    if(setAutoReminder){
        nextAutoReminder = getNextAutoReminder(setAutoReminder.requestTimestamp, setAutoReminder.requestCloseTimestamp)
    }
    return FeedbackRequest.addRemindersSentNow(feedbackReqId, nextAutoReminder)
} 

let getAutoRemindersRequests = function(){
    return FeedbackRequest.getAutoReminderRequests()
}

let setAutoRepeatMetadata = async function(feedbackReqId, autoRepeatMetadata, autoRepeatName, scheduleDate){
    let feedbackReq = await FeedbackRequest.setAutoRepeatMetaData(feedbackReqId, autoRepeatMetadata, autoRepeatName)
    if(autoRepeatName || scheduleDate){
        let autoRepeat = feedbackReq.getAutoRepeatScheduledTimestamp()
        if(scheduleDate) {
            autoRepeat = scheduleDate
        }
        await FeedbackRequest.setAutoRepeat(feedbackReq.id, autoRepeat, autoRepeatName)
    }
    return feedbackReq
}

let removeAutoRepeat = function(feedbackReqId){
    return FeedbackRequest.removeAutoRepeat(feedbackReqId)
}

let getNowAutoRepeatingRequests = function(){
    return FeedbackRequest.getNowAutoRepeatingRequests()
}

let getNextAutoReminder = function(requestTimestamp, requestCloseTimestamp, dateNow = Date.now()){
    let daysPassed = Math.round( ( dateNow - requestTimestamp ) / Constants.TIME.ONE_DAY )
    let totalDays = Math.round( ( requestCloseTimestamp - requestTimestamp ) / Constants.TIME.ONE_DAY )
    let remainingDays = totalDays - daysPassed
    let nextAutoReminder = requestTimestamp
    let DONT_SEND_REMINDER = requestCloseTimestamp + Constants.TIME.ONE_WEEK
    if(totalDays === 0){
        nextAutoReminder = DONT_SEND_REMINDER
    } else if(totalDays === 1){
        if(remainingDays === 0)
            nextAutoReminder = DONT_SEND_REMINDER
        else
            nextAutoReminder = requestCloseTimestamp - (Constants.TIME.ONE_DAY / 2)
    } else if (totalDays > 1 && totalDays <  6){
        if(remainingDays <= 1)
            nextAutoReminder = DONT_SEND_REMINDER
        else if(remainingDays === 2)
            nextAutoReminder = requestCloseTimestamp - Constants.TIME.ONE_DAY
        else
            nextAutoReminder = requestCloseTimestamp - Constants.TIME.ONE_DAY * 2
    } else if (totalDays > 5 && totalDays <  10){
        let firstReminderInDays = Math.round(totalDays / 2)
        if(remainingDays <= 1)
            nextAutoReminder = DONT_SEND_REMINDER
        else if(remainingDays === 2)
            nextAutoReminder = requestCloseTimestamp - Constants.TIME.ONE_DAY
        else if (daysPassed >= firstReminderInDays)
            nextAutoReminder = requestCloseTimestamp - Constants.TIME.ONE_DAY * 2
        else
            nextAutoReminder = requestTimestamp + Constants.TIME.ONE_DAY * firstReminderInDays
    } else if (totalDays > 9 && totalDays < 15) {
        let firstReminderInDays = Math.round(totalDays / 3)
        let secondReminderInDays = Math.round(2 * totalDays / 3)
        if(remainingDays <= 1)
            nextAutoReminder = DONT_SEND_REMINDER
        else if(remainingDays === 2)
            nextAutoReminder = requestCloseTimestamp - Constants.TIME.ONE_DAY
        else if (daysPassed >= secondReminderInDays)
            nextAutoReminder = requestCloseTimestamp - Constants.TIME.ONE_DAY * 2
        else if (daysPassed >= firstReminderInDays )
            nextAutoReminder = requestTimestamp + Constants.TIME.ONE_DAY * secondReminderInDays
        else
            nextAutoReminder = requestTimestamp + Constants.TIME.ONE_DAY * firstReminderInDays
    } else {
        let firstReminderInDays = Math.round(totalDays / 2)
        let secondReminderInDays = Math.round(4 * totalDays / 5)
        if(remainingDays <= 1)
            nextAutoReminder = DONT_SEND_REMINDER
        else if(remainingDays === 2)
            nextAutoReminder = requestCloseTimestamp - Constants.TIME.ONE_DAY
        else if (daysPassed >= secondReminderInDays)
            nextAutoReminder = requestCloseTimestamp - Constants.TIME.ONE_DAY * 2
        else if (daysPassed >= firstReminderInDays )
            nextAutoReminder = requestTimestamp + Constants.TIME.ONE_DAY * secondReminderInDays
        else
            nextAutoReminder = requestTimestamp + Constants.TIME.ONE_DAY * firstReminderInDays
    }
    return nextAutoReminder
}

let getLastQuestions = async function(userId){
    let result = await FeedbackRequest.getLastQuestions(userId)
    if(result && result[0] && result[0].questions){
        let questionsList = []
        result[0].questions.forEach(q => {
            if(questionsList.includes(q) || questionsList.length === 15)
                return
            questionsList.push(q)
        })
        return questionsList
    }
    return null
}

let setThankYouMessage = function(feedbackReqId, thankYouMessage){
    return FeedbackRequest.setThankYouMessage(feedbackReqId, thankYouMessage)
}

module.exports = {
    addNewFeedbackRequest,
    getPendingFeedbackRequest,
    getFeedbackRequestById,
    incrementResponsesReceived,
    finishCompletedOngoingRequests,
    concludeFinishedRequests,
    getConcludedRequests,
    getLastFeedbackRequest,
    concludeFeedbackRequest,
    addRemindersSentNow,
    getAutoRemindersRequests,
    setAutoRepeatMetadata,
    removeAutoRepeat,
    getNowAutoRepeatingRequests,
    getMyOngoingFeedbackRequests,
    getSoonExpiringRequests,
    setIsExtendMessageSent,
    extendFeedbackRequest,
    getLastQuestions,
    setThankYouMessage,
    getNextAutoReminder
}