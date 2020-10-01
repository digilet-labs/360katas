const FeedbackReqActivity = require('../models/feedbackRequestActivityModel')
const feedbackReqController = require('./feedbackRequestController')
const userController = require('./userController')
const responseController = require('./responseController')
const Constants = require('../Constants')

let addFeedbackReqActivity = function(feedbackReqActData){
    return FeedbackReqActivity.addFeedbackReqActivity(feedbackReqActData)
}


let addNewFeedbackRequest = async function(feedbackReq){
    feedbackReq.usersList.push(feedbackReq.userId)
    let selfUser
    let usersList = await userController.getUsersBySlackIds(feedbackReq.usersList)
    let feedbackReqObj = await feedbackReqController.addNewFeedbackRequest(feedbackReq, usersList)
    if(feedbackReqObj && feedbackReqObj.id){
        for(let i in usersList){
            let user = usersList[i]
            let fbReqActData = {
                feedbackRequest: feedbackReqObj.id,
                userFor: user.id
            }
            if(feedbackReq.userId === user.id){
                fbReqActData.isSelfAssessment = true
                selfUser = user
            }
            await addFeedbackReqActivity(fbReqActData)
        }
    }
    await userController.setActiveNow(selfUser.id)
    return { feedbackReq: feedbackReqObj, user: selfUser}
}


let getPendingFeedbackRequest = async function(slackUserId){
    let user = await userController.getUserBySlackId(slackUserId)
    if(!user){
        return null
    }
    let feedbackRequest = await feedbackReqController.getPendingFeedbackRequest(user.id)
    return feedbackRequest
}

let getPendingActionsForUser = async function(user){
    let lastFeedbackRequest = await feedbackReqController.getLastFeedbackRequest(user.id)
    let responses = await responseController.getPendingClarificationResponses(user.id)
    let pendingActions 
    if(lastFeedbackRequest && lastFeedbackRequest.status !== Constants.FEEDBACK_REQ_STATUS.CONCLUDED)
        pendingActions = await FeedbackReqActivity.getPendingActionsForUser(user.id, lastFeedbackRequest.id)
    else
        pendingActions = await FeedbackReqActivity.getPendingActionsForUser(user.id, null)
    pendingActions = pendingActions.filter((paction) => {
        if (lastFeedbackRequest && lastFeedbackRequest.status !== Constants.FEEDBACK_REQ_STATUS.CONCLUDED && paction.feedbackRequest.id === lastFeedbackRequest.id)
            return true
        if(paction.isSelfAssessment === true && (paction.feedbackRequest.status === Constants.FEEDBACK_REQ_STATUS.CONCLUDED || paction.feedbackRequest.status === Constants.FEEDBACK_REQ_STATUS.SUBMITTED))
            return false
        return true
    })
    return { pendingActions: pendingActions, pendingClarifications: responses, lastFeedbackRequest: lastFeedbackRequest} 
}

let getHomeFeedbackRequests = async function(user){
    let myOngoingRequests = await feedbackReqController.getMyOngoingFeedbackRequests(user.id)
    let lastFeedbackRequest = await feedbackReqController.getLastFeedbackRequest(user.id)
    let reqIds = myOngoingRequests.map(req => req.id)
    let activities = await FeedbackReqActivity.getOngoingActionsForUser(user.id, reqIds)
    let responses = await responseController.getPendingClarificationResponses(user.id)
    let pendingActions = []
    let feedbackRequests = []
    activities.forEach((act => {
        if (reqIds.includes(act.feedbackRequest.id))
            feedbackRequests.push(act)
        else
            pendingActions.push(act)
    }))
    return { pendingActions: pendingActions, feedbackRequests: feedbackRequests, pendingClarifications: responses, lastFeedbackRequest: lastFeedbackRequest}
}

let addResponses = async function(slackUserId, feedbackReqId, responses, isSelfAssessment){
    let user = await userController.getUserBySlackId(slackUserId)
    let feedbackReq = await feedbackReqController.getFeedbackRequestById(feedbackReqId)
    if(!user || !feedbackReq){
        return null
    }
    if(feedbackReq.questionsList.length !== responses.length)
        return { error: "responses are not present" }
    console.log("responses",responses)
    let result = await responseController.addResponses(user.id, feedbackReq.id, feedbackReq.questionsList, responses)
    console.log("result", result)
    let updateActivity = await FeedbackReqActivity.updateStatus(feedbackReq.id, user.id, Constants.FEEDBACK_REQ_STATUS.SUBMITTED)
    console.log("updateActivity",updateActivity)
    if(!isSelfAssessment)
        await feedbackReqController.incrementResponsesReceived(feedbackReq.id)
    return { user: user, responses: result, feedbackReq: feedbackReq } 
}

let getPendingResponsesForRequest = function(feedbackReqId){
    return FeedbackReqActivity.getPendingResponsesForRequest(feedbackReqId)
}

let setStatusClarification = function(feedbackReqId, userForId, isCompleted){
    if(isCompleted)
        return FeedbackReqActivity.updateStatus(feedbackReqId, userForId, Constants.FEEDBACK_REQ_STATUS.SUBMITTED)
    return FeedbackReqActivity.updateStatus(feedbackReqId, userForId, Constants.FEEDBACK_REQ_STATUS.CLARIFICATION)
}

let getSelfAssessmentActivity = function(feedbackReqId){
    return FeedbackReqActivity.getSelfAssessmentActivity(feedbackReqId)
}

module.exports = {
    addNewFeedbackRequest,
    getPendingFeedbackRequest,
    getPendingActionsForUser,
    addResponses,
    getPendingResponsesForRequest,
    setStatusClarification,
    getSelfAssessmentActivity,
    getHomeFeedbackRequests
}