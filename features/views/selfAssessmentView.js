const feedbackReqActController = require('../../src/controllers/feedbackReqActivityController')
const userController = require('../../src/controllers/userController')
const appHomeView = require('./appHomeView')
const amplitudeService = require('../../src/services/amplitudeService')
const messageController = require('../../src/controllers/messageController')
const Constants = require('../../src/Constants')
const messageView = require('./messageView')
const feedbackRequestController = require('../../src/controllers/feedbackRequestController')

var ObjectId = require('mongoose').Types.ObjectId;

let getSelfAssessmentModal = function(questions, privateMetadata){
    let modal = {
        "type": "modal",
        "callback_id": "self_assessment",
        "notify_on_close": true,
        "private_metadata": JSON.stringify(privateMetadata),
        "title": {
            "type": "plain_text",
            "text": "Self-Assessment",
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
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": "*Note:* List down without hesitation. It’s private and visible only to you."
                    }
                ]
            }
        ]
    }
    let questionNumber = 0
    questions.forEach((question) => {
        modal.blocks.splice(modal.blocks.length - 1, 0, {
            "type": "input",
            "element": {
                "type": "plain_text_input",
                "multiline": true,
                "min_length": 1,
                "action_id": `self_assessment.question_${questionNumber}`,
                "placeholder": {
                    "type": "plain_text",
                    "text": "Enter your Self-Assessment"
                },
            },
            "label": {
                "type": "plain_text",
                "text": `${questionNumber+1}. ${question.replace(/\*/g, '')}`,
                "emoji": true
            },
            "block_id": `self_assessment.question_${questionNumber}`
        })
        questionNumber++
    })
    return modal
}


let showSelfAssementModal = async function(bot, message, type){
    bot.httpBody({
        "response_action": "clear"
    })
    let privateMetadata = JSON.parse((!message.view || (message.view && message.view.private_metadata === '')) ? '{}' : message.view.private_metadata )
    let feedbackReqId = (message.actions) ? message.actions[0].value : privateMetadata.feedbackReqId
    let feedbackReq 
    if(ObjectId.isValid(feedbackReqId))
        feedbackReq = await feedbackRequestController.getFeedbackRequestById(feedbackReqId)
    else
        feedbackReq = await feedbackReqActController.getPendingFeedbackRequest(message.user)
    if(feedbackReq){
        let modalView = getSelfAssessmentModal(feedbackReq.questionsList, { feedbackReqId: feedbackReq.id })
        if(message.actions && message.actions[0].action_id === 'review_not_ready.self_assess'){
            let postData = { 
                token: bot.api.token,
                view_id: message.view.id,
                hash: message.view.hash,
                view: modalView
            }
            await bot.api.views.update(postData)
        } else {
            let postData = { 
                token: bot.api.token,
                trigger_id: message.incoming_message.channelData.trigger_id,
                view: modalView
            }
            await bot.api.views.open(postData)
        }
        if(type === 'home')
            amplitudeService.logEvent(amplitudeService.EVENT_NAMES.HOME_START_SELF_ASSESSMENT, message.internal_user)
        else if (type === 'message')
            amplitudeService.logEvent(amplitudeService.EVENT_NAMES.MESSAGE_START_SELF_ASSESSMENT, message.internal_user)
        else if (type === 'review_not_ready')
            amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REVIEW_FEEDBACK_SELF_ASSESS, message.internal_user)
        else
            amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REQUEST_FEEDBACK_START_SELF_ASSESSMENT, message.internal_user)
    }
}

let processSelfAssementModal = async function(bot, message){
    let messageStateValues = message.view.state.values
    let privateMetadata = JSON.parse(message.view.private_metadata)
    let answers = []
    let number = 0
    for(let i in messageStateValues){
        if(i === 'self_assessment.question_'+number)
            answers.push(messageStateValues[i][i].value)
        number++
    }
    let result = await feedbackReqActController.addResponses(message.user, privateMetadata.feedbackReqId, answers, true)
    if(result && result.user){
        sendSelfAssessmentSentMessage(bot, result.user, result.responses)
        let feedbackMessage = await messageController.getMessage(result.user.id, Constants.MESSAGE_TYPE.FEEDBACK_SENT_MESSAGE, privateMetadata.feedbackReqId)
        let feedbackSentMessageBlocks = messageView.getFeedbackRequestSentMessage(result.feedbackReq, true).blocks
        if(feedbackMessage){
            let data = {
                token: bot.api.token,
                ts: feedbackMessage.data.activityId,
                channel: feedbackMessage.data.conversation.id,
                text: "✅ Self-Assessment completed",
                blocks: feedbackSentMessageBlocks
            }
            await bot.api.chat.update(data)
            await messageController.removeMessage(feedbackMessage.userId, feedbackMessage.type, feedbackMessage.refId)
        }
        let reviewMessage = await messageController.getMessage(result.user.id, Constants.MESSAGE_TYPE.FEEDBACK_REVIEW_SELF_CLARIF_MESSAGE, privateMetadata.feedbackReqId)
        if(reviewMessage){
            let reviewMessageView = messageView.getFeedbackCompletedMessage(result.feedbackReq, false)
            let data = {
                token: bot.api.token,
                ts: reviewMessage.data.activityId,
                channel: reviewMessage.data.conversation.id,
                text: reviewMessageView.text,
                blocks: reviewMessageView.blocks
            }
            await bot.api.chat.update(data)
            await messageController.removeMessage(reviewMessage.userId, reviewMessage.type, reviewMessage.refId)
        }
    }
    if(result && result.error){
        appHomeView.showAppHome(bot, message, '', "⚠️ There was a problem recording your responses. If using an iPhone, please add an 'enter' at the end of each text box or complete this step on a desktop.")
    }
    if(result && result.user){
        appHomeView.showAppHome(bot, message)
    }
    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.SELF_ASSESSMENT_SUBMIT, message.internal_user)
}

let sendSelfAssessmentSentMessage = async function(bot, user, responses){
    let message = messageView.getSelfAssessmentSentMessage(responses)
    await bot.startPrivateConversation(user.slackId)
    await bot.say(message)
}


module.exports = {
    showSelfAssementModal,
    processSelfAssementModal
}