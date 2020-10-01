const Amplitude = require('@amplitude/node')
const Constants = require('../Constants')
const needle = require('needle')

var client = Amplitude.init(Constants.AMPLITUDE_KEY)

let logEvent = function(eventName, internalUser, eventProperties = {}){

    if(!internalUser)
        return

    let userProperties = {
        "Workspace Name": internalUser.teamId.slackWorkspaceName,
        "Members in Workspace": internalUser.teamId.numberOfUsers,
        "Location": internalUser.slackTimezoneName,
        "Timezone Offset": internalUser.slackTimezoneOffset,
        "Is Admin": internalUser.slackIsAdmin,
        "Is Owner": internalUser.slackIsOwner,
        "Platform": "Slack"
    }
    eventProperties["Platform"] = "Slack"

    console.log("EVENT:", eventName)
    client.logEvent({
        event_type: eventName,
        user_id: internalUser.id,
        event_properties: eventProperties,
        user_properties: userProperties,
    })
    let email = `${internalUser.id}@${Constants.IS_LIVE ? '' : 'stage.'}360katas.com`
    needle.get(`https://msg.360katas.com/mtracking.gif?page_url=${eventName}&userid=${internalUser.id}&email=${email}&name=User&team=${internalUser.teamId.slackWorkspaceName}&is_live_user=${Constants.IS_LIVE}&timezone=${internalUser.slackTimezoneName}&is_admin=${internalUser.slackIsAdmin}&is_owner=${internalUser.slackIsOwner}`)
}

let logEventAddToWorkspace = function(eventProperties = {}, userId){
    eventProperties["Platform"] = "Slack"
    console.log("EVENT:", EVENT_NAMES.ADDED_TO_WORKSPACE)
    client.logEvent({
        user_id: userId,
        event_type: EVENT_NAMES.ADDED_TO_WORKSPACE,
        event_properties: eventProperties,
    })
}


let logEventRemovedFromWorkspace = function(eventProperties = {}, userId){
    eventProperties["Platform"] = "Slack"
    console.log("EVENT:", EVENT_NAMES.REMOVED_FROM_WORKSPACE)
    client.logEvent({
        user_id: userId,
        event_type: EVENT_NAMES.REMOVED_FROM_WORKSPACE,
        event_properties: eventProperties,
    })
}

let EVENT_NAMES = {
    HOME_OPENED: 'Opened Home',
    HOME_NEW_REQUEST: "Home - New Request",
    HOME_START_SELF_ASSESSMENT: "Home - Start Self Assessment",
    HOME_REVIEW_FEEDBACK: "Home - Review Feedback",
    HOME_SEEK_CLARIFICATION: "Home - Seek Clarification",
    HOME_HISTORICAL_FEEDBACK: "Home - Historical Feedback",
    HOME_ANSWER_FEEDBACK_REQUEST: "Home - Answer Feedback Request",
    HOME_ANSWER_CLARIFICATION: "Home - Answer Clarification",
    HOME_REFRESH: "Home - Refresh",
    HOME_VIEW_TREE: "Home - View Tree",
    HOME_VIEW_AUTO_REPEAT: "Home - View Auto-repeat",

    REQUEST_FEEDBACK_QUESTIONS_EDIT_QUESTIONS: "Request Feedback - Questions - Change Questions",
    REQUEST_FEEDBACK_QUESTIONS_CANCEL: "Request Feedback - Questions - Cancel",
    REQUEST_FEEDBACK_QUESTIONS_SUBMIT: "Request Feedback - Questions - Choose People",
    REQUEST_FEEDBACK_CHOOSE_QUESTIONS_CHOOSE_PEOPLE: "Request Feedback - Choose Questions - Choose People",
    REQUEST_FEEDBACK_CHOOSE_QUESTIONS_CANCEL: "Request Feedback - Choose Questions - Cancel",
    REQUEST_FEEDBACK_EDIT_QUESTIONS_CHOOSE_PEOPLE: "Request Feedback - Edit Questions - Choose People",
    REQUEST_FEEDBACK_EDIT_QUESTIONS_CANCEL: "Request Feedback - Edit Questions - Cancel",
    REQUEST_FEEDBACK_QUESTIONS_DELETE_QUESTION: "Request Feedback - Edit Questions - Delete Question",
    REQUEST_FEEDBACK_QUESTIONS_ADD_QUESTION: "Request Feedback - Edit Questions - Add Question",
    REQUEST_FEEDBACK_CHOOSE_QUESTIONS_ADD_CUSTOM_QUESTION: "Request Feedback - Choose Questions - Add custom question",
    REQUEST_FEEDBACK_CHOOSE_QUESTIONS_SELECTED_QUESTION: "Request Feedback - Choose Questions - Selected question",
    REQUEST_FEEDBACK_CHOOSE_QUESTIONS_DESELECTED_QUESTION: "Request Feedback - Choose Questions - De-selected question",
    REQUEST_FEEDBACK_RESPONDENTS_REVIEW: "Request Feedback - Respondents - Review",
    REQUEST_FEEDBACK_RESPONDENTS_BACK: "Request Feedback - Respondents - Back",
    REQUEST_FEEDBACK_REVIEW_SEND: "Request Feedback - Review - Send",
    REQUEST_FEEDBACK_REVIEW_BACK: "Request Feedback - Review - Back",
    REQUEST_FEEDBACK_START_SELF_ASSESSMENT: "Request Feedback - Start Self Assessment",
    REQUEST_FEEDBACK_START_SELF_ASSESSMENT_LATER: "Request Feedback - Later",

    SELF_ASSESSMENT_SUBMIT: "Self Assessment - Submit",
    SELF_ASSESSMENT_CANCEL: "Self Assessment - Cancel",

    REVIEW_FEEDBACK_SEEK_CLARIFICATION: "Thank/Comment - Seek Clarification",
    REVIEW_FEEDBACK_CLOSE: "Review Feedback - Close",

    SEEK_CLARIFICATION_QUESTION: "Seek Clarification - Question",
    SEEK_CLARIFICATION_BACK: "Seek Clarification - Back",
    SEEK_CLARIFICATION_QUESTION_BACK: "Seek Clarification - Question - Back",
    SEEK_CLARIFICATION_QUESTION_SUBMIT: "Seek Clarification - Question - Submit",

    HISTORICAL_FEEDBACK_CLOSE: "Historical Feedback - Close",


    AUTO_REPEAT_EDIT_PERSONAL_MSG: "Auto-repeat - Edit Personal Message",
    AUTO_REPEAT_EDIT_QUESTIONS: "Auto-repeat - Edit Questions",
    AUTO_REPEAT_EDIT_PARTICIPANTS: "Auto-repeat - Edit Participants",
    AUTO_REPEAT_EDIT_DATES: "Auto-repeat - Edit Dates",
    AUTO_REPEAT_EDIT_DELETE: "Auto-repeat - Delete",
    AUTO_REPEAT_EDIT_BACK: "Auto-repeat - Back",
    AUTO_REPEAT_SUBMIT: "Auto-repeat - Submit",

    TREE_SHARE_TREE: "Tree - Share Tree",
    SHARE_TREE_SUBMIT: "Share Tree - Submit",
    SHARE_TREE_BACK: "Share Tree - Back",

    REVIEW_FEEDBACK_SELF_ASSESS: "Review Feedback - Self-Assess",
    REVIEW_FEEDBACK_SEND_REMINDERS: "Review Feedback - Send Reminders",
    REVIEW_FEEDBACK_CHANGE_DUE_DATE: "Review Feedback - Change Due Date",
    REVIEW_FEEDBACK_SUBMIT: "Review Feedback - Thank/Seek Clarification",

    THANK_EDIT_NOTE: "Thank/Comment - Edit Thank You Note",
    THANK_COMMENT_BACK: "Thank/Comment - Back",
    THANK_NOTE_BACK: "Thank You Note - Back",
    THANK_NOTE_SEND: "Thank you Note - Send",
    CHANGE_DUE_DATE_SUBMIT: "Change Due Date - Submit",
    CHANGE_DUE_DATE_BACK: "Change Due Date - Back",

    MESSAGE_RESPOND_TO_FEEDBACK: "Message - Respond to Feedback",
    MESSAGE_REVIEW_FEEDBACK: "Message - Review Feedback",
    MESSAGE_RESPOND_TO_CLARIFICATION: "Message - Respond to Clarification", //not added

    RESPOND_TO_FEEDBACK_CANCEL: "Respond to Feedback - Cancel",
    RESPOND_TO_FEEDBACK_SUBMIT: "Respond to Feedback - Submit",

    RESPOND_TO_CLARIFICATION_CANCEL: "Respond to Clarification - Cancel",
    RESPOND_TO_CLARIFICATION_SUBMIT: "Respond to Clarification - Submit",

    MESSAGE_START_SELF_ASSESSMENT: "Message - Start Self Assessment",

    RECEIVED_MESSAGE_NEW_REQUEST: "Received Message - New Request",
    RECEIVED_MESSAGE_SEND_REMINDERS: "Received Message - Send Reminders",
    RECEIVED_MESSAGE_FIRST_MESSAGE: "Received Message - First Message",
    RECEIVED_MESSAGE_RESPONSE_SENT: "Received Message - Response Sent",
    RECEIVED_MESSAGE_CLARIFICATION_REQUEST: "Received Message - Clarification Request",
    RECEIVED_MESSAGE_CLARIFICATION_ANSWER_RECEIVED: "Received Message - Clarification Answer Received",
    RECEIVED_MESSAGE_FEEDBACK_REQUEST_COMPLETED: "Received Message - Feedback Request Completed",
    RECEIVED_MESSAGE_FEEDBACK_REQ_COMPLETED_CLARIFICATION_PENDING: "Received Message - Feedback Request Completed Clarification Pending",
    RECEIVED_MESSAGE_FEEDBACK_REQ_NOT_COMPLETED: "Received Message - Feedback Request Not Completed",
    RECEIVED_MESSAGE_EXTEND_REQUEST: "Received Message - Extend Request",

    SENT_MESSAGE: "Sent Message",
    ADDED_TO_WORKSPACE: "Added to Workspace",
    REMOVED_FROM_WORKSPACE: "Uninstall from Workspace",
    USER_ADDDED_TO_DB: "User Added to DB"
}


module.exports = {
    logEvent,
    logEventAddToWorkspace,
    logEventRemovedFromWorkspace,
    EVENT_NAMES
}