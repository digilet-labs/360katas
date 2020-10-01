const startModalView = require('./views/startModalView')
const appHomeView = require('./views/appHomeView')
const selfAssessmentView = require('./views/selfAssessmentView')
const respondModalView = require('./views/respondModalView')
const reviewModalView = require('./views/reviewModalView')
const amplitudeService = require('../src/services/amplitudeService')
const historyView = require('./views/historyView')
const internalFlowView = require('./views/internalFlowView')
const autoRepeatView = require('./views/autoRepeatView')

module.exports = function(controller) {

    controller.on('block_actions', async (bot, message) => {

        console.log('BLOCK ACTION')

        switch(message.actions[0].action_id) {
            case 'app_home.start':
                startModalView.showAppStartModal1(bot, message)
                break
            case 'app_home.refresh':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.HOME_REFRESH, message.internal_user)
                appHomeView.showAppHome(bot, message)
                break
            case 'app_home.self_assessment':
                selfAssessmentView.showSelfAssementModal(bot, message, 'home')
                break
            case 'app_home.start_respond':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.HOME_ANSWER_FEEDBACK_REQUEST, message.internal_user)
                respondModalView.showRespondModalView(bot, message, 'home')
                break
            // case 'app_home.options':
            //     if(message.actions[0].selected_option.value.startsWith('send_reminders'))
            //         appHomeView.sendFeedbackRequestReminders(bot, message)
            //     else if(message.actions[0].selected_option.value.startsWith('self_assessment'))
            //         selfAssessmentView.showSelfAssementModal(bot, message, 'home')
            //     else if(message.actions[0].selected_option.value === 'app_home.start')
            //         startModalView.showAppStartModal1(bot, message)
            //     break
            case 'review_not_ready.self_assess':
                selfAssessmentView.showSelfAssementModal(bot, message, 'review_not_ready')
                break
            case 'app_home.send_reminders':
                appHomeView.sendFeedbackRequestReminders(bot, message)
                break
            case 'app_home.review_not_ready':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.HOME_REVIEW_FEEDBACK, message.internal_user)
                reviewModalView.showReviewNotReadyModal(bot, message)
                break
            case 'app_home.clarification_respond':
                reviewModalView.showAnswerSeekClarificationModal(bot, message)
                break
            case 'app_home.review':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.HOME_REVIEW_FEEDBACK, message.internal_user)
                reviewModalView.showReviewModal(bot, message, 'home')
                break
            case 'app_home.past_feedback':
                historyView.showPastFeedbackModal(bot, message)
                break
            case 'app_home.open_tree_modal':
                appHomeView.showTeamTreeModal(bot, message)
                break
            case 'app_home.share_tree':
                appHomeView.showShareTeamTreeModal(bot, message)
                break
            case 'app_home.open_edit_autorepeat':
                autoRepeatView.showEditAutoRepeatModal(bot, message)
                break
            case 'start_dialog_1.dialog_action':
                startModalView.showAppStartModal1Update(bot, message)
                break
            case 'review_modal.seek_clarification':
                reviewModalView.showSeekClarificationModal(bot, message)
                break
            case 'seek_clarification.seek':
                reviewModalView.showQuestionSeekClarificationModal(bot, message)
                break
            case 'past_feedback_view.view':
                reviewModalView.showPastFeedbackReviewModal(bot, message)
                break
            case 'incoming_feedbackreq_message.respond':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.MESSAGE_RESPOND_TO_FEEDBACK, message.internal_user)
                respondModalView.showRespondModalView(bot, message)
                break
            case 'response_sent_message.start_feedback_req':
                startModalView.showAppStartModal1(bot, message)
                break
            case 'seek_clarification_message.respond':
                reviewModalView.showAnswerSeekClarificationModal(bot, message)
                break
            case 'closed_req_message.review':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.MESSAGE_REVIEW_FEEDBACK, message.internal_user)
                reviewModalView.showReviewModal(bot, message, 'message')
                break
            case 'reminder_feedbackreq_message.respond':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.MESSAGE_RESPOND_TO_FEEDBACK, message.internal_user)
                respondModalView.showRespondModalView(bot, message)
                break
            case 'feedback_sent_message.self_assessment':
                selfAssessmentView.showSelfAssementModal(bot, message, 'message')
                break
            case 'closed_req_message.self_assessment':
                selfAssessmentView.showSelfAssementModal(bot, message, 'message')
                break
            case 'closed_req_message.review_not_ready':
                reviewModalView.showReviewNotReadyModal(bot, message)
                break
            case 'past_feedback_view.not_ready_view':
                reviewModalView.showReviewNotReadyModal(bot, message)
                break
            case 'clarification_received_message.view_feedback':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.MESSAGE_REVIEW_FEEDBACK, message.internal_user)
                reviewModalView.showReviewModal(bot, message, 'message')
                break
            case 'start_dialog_1_question':
                startModalView.processSelectQuestionBlockAction(bot, message)
                break
            case 'edit_auto_repeat.edit_personal_msg':
            case 'edit_auto_repeat.edit_questions':
            case 'edit_auto_repeat.edit_participants':
            case 'edit_auto_repeat.edit_dates':
                autoRepeatView.updateEditAutoRepeatModal(bot, message)
                break
            case 'edit_auto_repeat.delete_auto_repeat':
                autoRepeatView.processDeleteAutoRepeatAction(bot, message)
                break        
            case 'extend_message.extend_req':
            case 'review_not_ready.extend_due_date':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REVIEW_FEEDBACK_CHANGE_DUE_DATE, message.internal_user)
                startModalView.showExtendFeedbackRequest(bot, message)
                break
            case 'review_not_ready.send_reminders':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REVIEW_FEEDBACK_SEND_REMINDERS, message.internal_user)
                appHomeView.sendFeedbackRequestReminders(bot, message)
                break
            case "share_tree_message.open_team_tree":
                appHomeView.showTeamTreeModal(bot, message)
                break
            case "review_modal.send_note":
                reviewModalView.showReviewThankYouNoteModal(bot, message)
                break
            //internal flow views
            case 'message.add_team_tree':
                internalFlowView.showAddTeamTreeModal(bot, message)
                break
        }
    })

    controller.on('view_submission', async (bot, message) => {
        console.log('VIEW SUBMIT')

        switch(message.view.callback_id) {
            case 'start_dialog_1':
                startModalView.processAppStartModal1(bot, message)
                break
            case 'start_dialog_2':
                startModalView.processAppStartModal2(bot, message)
                break
            case 'start_dialog_review':
                startModalView.processStartReviewModal(bot, message)
                break
            case 'start_dialog_3':
                selfAssessmentView.showSelfAssementModal(bot, message, 'start_dialog_3')
                break
            case 'self_assessment':
                selfAssessmentView.processSelfAssementModal(bot, message)
                break
            case 'respond_modal':
                respondModalView.processRespondModal(bot, message)
                break
            case 'review_feedback':
                reviewModalView.showReviewNextModal(bot, message)
                break
            case 'seek_clarification_question':
                reviewModalView.processQuestionSeekClarificationModal(bot, message)
                break
            case 'seek_clarification_answer':
                reviewModalView.processAnswerSeekClarificationModal(bot, message)
                break
            case 'edit_auto_repeat':
                autoRepeatView.processEditAutoRepeatModal(bot, message)
                break
            case 'extend_request':
                startModalView.processExtendFeedbackRequest(bot, message)
                break
            case 'share_team_tree':
                appHomeView.processShareTeamTreeModal(bot, message)
                break
            case "review_feedback_thank_you_note":
                reviewModalView.processReviewThankYouNoteModal(bot, message)
                break
            //internal flow views
            case 'internal_flow.add_team_tree':
                internalFlowView.processAddTeamTreeModal(bot, message)
                break
        }
    })

    controller.on('view_closed', async(bot, message) => {
        switch(message.view.callback_id) {
            case 'start_dialog_1':
                let incomingPrivateMetadata = JSON.parse(message.view.private_metadata === '' ? '{}' : message.view.private_metadata )
                if(incomingPrivateMetadata.default)
                    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REQUEST_FEEDBACK_QUESTIONS_CANCEL, message.internal_user)
                else if(incomingPrivateMetadata.choosequestion) 
                    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REQUEST_FEEDBACK_CHOOSE_QUESTIONS_CANCEL, message.internal_user)
                else
                    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REQUEST_FEEDBACK_EDIT_QUESTIONS_CANCEL, message.internal_user)
                break
            case 'start_dialog_2':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REQUEST_FEEDBACK_RESPONDENTS_BACK, message.internal_user)
                break
            case 'start_dialog_review':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REQUEST_FEEDBACK_REVIEW_BACK, message.internal_user)
                break
            case 'start_dialog_3':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REQUEST_FEEDBACK_START_SELF_ASSESSMENT_LATER, message.internal_user)
                break
            case 'self_assessment':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.SELF_ASSESSMENT_CANCEL, message.internal_user)
                break
            case 'review_feedback':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REVIEW_FEEDBACK_CLOSE, message.internal_user)
                break
            case 'seek_clarification':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.SEEK_CLARIFICATION_BACK, message.internal_user)
                break
            case 'seek_clarification_question':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.SEEK_CLARIFICATION_QUESTION_BACK, message.internal_user)
                break
            case 'respond_modal':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.RESPOND_TO_FEEDBACK_CANCEL, message.internal_user)
                break
            case 'seek_clarification_answer':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.RESPOND_TO_CLARIFICATION_CANCEL, message.internal_user)
                break
            case 'edit_auto_repeat':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.AUTO_REPEAT_EDIT_BACK, message.internal_user)
                break
            case 'share_team_tree':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.SHARE_TREE_BACK, message.internal_user)
                break
            case 'review_next_feedback':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.THANK_COMMENT_BACK, message.internal_user)
                break
            case 'review_feedback_thank_you_note':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.THANK_NOTE_BACK, message.internal_user)
                break
            case 'extend_request':
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.CHANGE_DUE_DATE_BACK, message.internal_user)
                break
        }

    })

}