const feedbackReqActivityController = require('../../src/controllers/feedbackReqActivityController')
const appHomeView = require('./appHomeView')
const feedbackRequestController = require('../../src/controllers/feedbackRequestController')
const Utils = require('../../src/Utils')
const amplitudeService = require('../../src/services/amplitudeService')
const Constants = require('../../src/Constants')
const userController = require('../../src/controllers/userController')
const messageController = require('../../src/controllers/messageController')
const messageView = require('./messageView')
const slackService = require('../../src/services/slackService')
const teamController = require('../../src/controllers/teamController')

let getStartModal1 = function(questions){
    let isPopular = false
    if(!questions){
        questions = [Constants.QUESTIONS.QUESTION1, Constants.QUESTIONS.QUESTION2, Constants.QUESTIONS.QUESTION3]
        isPopular = true
    }
    let modal = {
        "type": "modal",
        "callback_id": "start_dialog_1",
        "notify_on_close": true,
        "private_metadata": JSON.stringify({default: true, questions: questions}),
        "title": {
            "type": "plain_text",
            "text": "Feedback Questions",
            "emoji": true
        },
        "submit": {
            "type": "plain_text",
            "text": "Next: Participants",
            "emoji": true
        },
        "close": {
            "type": "plain_text",
            "text": "Cancel",
            "emoji": true
        },
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": isPopular ? "*Popular Questions:*" : "*Last Used Questions:*",
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": questions.map((q,i) => `${i+1}. ${q}`).join('\n\n')
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": " "
                },
                "accessory": {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "🔄 Change Questions"
                    },
                    "action_id": "start_dialog_1.dialog_action",
                    "value": "start_dialog_1.edit_questions"
                },
                "block_id": "start_dialog_1.edit_questions"
            }
        ]
    }    
    return modal    
}


let getStartModal1UpdateOnAction = function(blocks, action, internal_user, questions, lastQuestions, lastReqQuestions){
    let getEditableBlocks = function(question, number, action_id = null){
        if(!action_id){
            let random_id = Math.floor(Math.random() * 101)
            action_id = `start_dialog_1.question_editable_${random_id}`
        }
        let blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*Q ${number}:*`
                },
                "accessory": {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": `Delete Question ${number}`,
                        "emoji": true
                    },
                    "action_id": 'start_dialog_1.dialog_action',
                    "value": `start_dialog_1.delete_question_${number}`
                }
            },
            {
                "type": "input",
                "element": {
                    "type": "plain_text_input",
                    "multiline": true,
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Type your question"
                    },
                    "action_id": action_id
                },
                "label": {
                    "type": "plain_text",
                    "text": " ",
                    "emoji": true
                },
                "block_id": action_id,
            },
            {
                "type": "divider"
            }
        ]
        if(question){
            blocks[1]['element']['initial_value'] = question
        }
        return blocks
    }
    let getAddQuestionBlocks = function(){
        let blocks = [
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "✨ Add new question",
                            "emoji": true
                        },
                    "action_id": "start_dialog_1.dialog_action",
                    "value": "start_dialog_1.add_question"
                }],
                "block_id": "start_dialog_1.add_question"
            }
        ]
        return blocks
    }
    let getStartModalSelectQuestionsBlocks = function(){
        let blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Custom Questions:*"
                },
                "accessory": {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "〽️ Add Custom Question(s)",
                        "emoji": true
                    },
                    "action_id": "start_dialog_1.dialog_action",
                    "value": "start_dialog_1.custom_questions"
                },
                "block_id": "start_dialog_1_custom_question"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Personal Brand:*"
                },
                "accessory": {
                    "type": "checkboxes",
                    "options": [
                        {
                            "text": {
                                "type": "mrkdwn",
                                "text": Constants.QUESTIONS.PERSONAL.QUESTION1
                            },
                            "value": "p1"
                        },
                        {
                            "text": {
                                "type": "mrkdwn",
                                "text": Constants.QUESTIONS.PERSONAL.QUESTION2
                            },
                            "value": "p3"
                        },
                        {
                            "text": {
                                "type": "mrkdwn",
                                "text": Constants.QUESTIONS.PERSONAL.QUESTION3
                            },
                            "value": "p2"
                        }
                    ],
                    "action_id": "start_dialog_1_question"
                },
                "block_id": "start_dialog_1_question_personal"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Skills:*"
                },
                "accessory": {
                    "type": "checkboxes",
                    "options": [
                        {
                            "text": {
                                "type": "mrkdwn",
                                "text": Constants.QUESTIONS.SKILLS.QUESTION1
                            },
                            "value": "s1"
                        },
                        {
                            "text": {
                                "type": "mrkdwn",
                                "text": Constants.QUESTIONS.SKILLS.QUESTION2
                            },
                            "value": "s2"
                        }
                    ],
                    "action_id": "start_dialog_1_question"
                },
                "block_id": "start_dialog_1_question_skills"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Work:*"
                },
                "accessory": {
                    "type": "checkboxes",
                    "options": [
                        {
                            "text": {
                                "type": "mrkdwn",
                                "text": Constants.QUESTIONS.WORK.QUESTION1
                            },
                            "value": "w1"
                        },
                        {
                            "text": {
                                "type": "mrkdwn",
                                "text": Constants.QUESTIONS.WORK.QUESTION2
                            },
                            "value": "w2"
                        },
                        {
                            "text": {
                                "type": "mrkdwn",
                                "text": Constants.QUESTIONS.WORK.QUESTION3
                            },
                            "value": "w3"
                        }
                    ],
                    "action_id": "start_dialog_1_question"
                },
                "block_id": "start_dialog_1_question_work"
            }
        ]
        if(lastQuestions){
            let options = []
            lastQuestions.forEach((q,i) => {
                if (q.length >= 75)
                    return
                options.push({
                    "text": {
                        "type": "mrkdwn",
                        "text": q
                    },
                    "value": `l${i+1}`
                })
            })
            let initialOptions = []
            options.forEach( op => {
                if( lastReqQuestions.includes(op.text.text) ){
                    initialOptions.push(op)
                }
            })
            blocks.splice(1, 0, {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Previously Used Questions:*"
                },
                "accessory": {
                    "type": "checkboxes",
                    "options": options,
                    "action_id": "start_dialog_1_question",
                },
                "block_id": "start_dialog_1_question_last"
            })
            if(initialOptions.length > 0){
                blocks[1].accessory.initial_options = initialOptions
            }
        } else {
            let intialOptions = [
                {
                    "text": {
                        "type": "mrkdwn",
                        "text": Constants.QUESTIONS.WORK.QUESTION1
                    },
                    "value": "w1"
                },
                {
                    "text": {
                        "type": "mrkdwn",
                        "text": Constants.QUESTIONS.WORK.QUESTION2
                    },
                    "value": "w2"
                },
                {
                    "text": {
                        "type": "mrkdwn",
                        "text": Constants.QUESTIONS.WORK.QUESTION3
                    },
                    "value": "w3"
                }
            ]
            blocks[3].accessory.initial_options = intialOptions
        }
        return blocks
    }
    if(action === 'start_dialog_1.edit_questions'){
        blocks = getStartModalSelectQuestionsBlocks()
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REQUEST_FEEDBACK_QUESTIONS_EDIT_QUESTIONS, internal_user)
    }
    if(action === 'start_dialog_1.add_question'){
        let addPosition = blocks.length - 1
        let questionNumber = (addPosition / 3) + 1
        let block = getEditableBlocks(null, questionNumber)
        blocks.splice(addPosition, 0, ...block)
        if(!blocks[0].accessory){
            blocks[0].accessory = {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": `Delete Question 1`,
                    "emoji": true
                },
                "action_id": 'start_dialog_1.dialog_action',
                "value": `start_dialog_1.delete_question_1`
            }
        }
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REQUEST_FEEDBACK_QUESTIONS_ADD_QUESTION, internal_user)
    }
    if(action.startsWith('start_dialog_1.delete_question')){
        let delPosition = parseInt(action.replace('start_dialog_1.delete_question_', '')) * 3 - 3
        let questionNumber = (delPosition / 3) + 1
        blocks.splice(delPosition, 3)
        for(let i = delPosition; i< blocks.length - 1; i+=3){
            let block = getEditableBlocks(null, questionNumber, blocks[i+1].block_id)
            blocks.splice(i, 3, ...block)
            questionNumber++
        }
        if(blocks.length === 4){
            delete blocks[0].accessory
        }
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REQUEST_FEEDBACK_QUESTIONS_DELETE_QUESTION, internal_user)
    }
    if(action === 'start_dialog_1.custom_questions'){
        blocks = []
        let number = 1
        questions.forEach((question) => {
            blocks.push(...getEditableBlocks(question, number))
            number++
        })
        blocks.push(...getEditableBlocks(null, number))
        blocks.push(...getAddQuestionBlocks())
    }
    let modal = {
        "type": "modal",
        "callback_id": "start_dialog_1",
        "notify_on_close": true,
        "title": {
            "type": "plain_text",
            "text": "Choose / Add Questions",
            "emoji": true
        },
        "submit": {
            "type": "plain_text",
            "text": "Next: Select People",
            "emoji": true
        },
        "close": {
            "type": "plain_text",
            "text": "Cancel",
            "emoji": true
        },
        blocks: blocks
    }
    if(action === 'start_dialog_1.edit_questions'){
        modal.private_metadata = JSON.stringify({choosequestion: true})
    }
    return modal
}

let getStartModal2 = function(privateMetadata,  errorMessage = false){
    let questionsText = ''
    privateMetadata.questions.forEach((q,i) => {
        questionsText += `${i+1}. ${q.replace(/\*/g, '')}\n`
    })
    let modal = {
        "title": {
            "type": "plain_text",
            "text": "Select Participants",
            "emoji": true
        },
        "submit": {
            "type": "plain_text",
            "text": "Next: Review",
            "emoji": true
        },
        "type": "modal",
        "callback_id": "start_dialog_2",
        "private_metadata": JSON.stringify(privateMetadata),
        "notify_on_close": true,
        "close": {
            "type": "plain_text",
            "text": "Back",
            "emoji": true
        },
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `\`\`\`${questionsText}\`\`\``
                }
            },
            {
                "type": "input",
                "block_id": "start_dialog_2.selected_peers",
                "element": {
                    "type": "multi_conversations_select",
                    "placeholder": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "Select users"
                    },
                    "action_id": "start_dialog_2.selected_peers",
                    "filter": {
                        "include": [
                            "im"
                        ],
                        "exclude_bot_users": true
                    }
                },
                "label": {
                    "type": "plain_text",
                    "text": "Peers",
                    "emoji": true
                },
                "optional": true
            },
            {
                "type": "input",
                "block_id": "start_dialog_2.selected_reportees",
                "element": {
                    "type": "multi_conversations_select",
                    "placeholder": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "Select users"
                    },
                    "action_id": "start_dialog_2.selected_reportees",
                    "filter": {
                        "include": [
                            "im"
                        ],
                        "exclude_bot_users": true
                    }
                },
                "label": {
                    "type": "plain_text",
                    "text": "Reportees",
                    "emoji": true
                },
                "optional": true
            },
            {
                "type": "input",
                "block_id": "start_dialog_2.selected_managers",
                "element": {
                    "type": "multi_conversations_select",
                    "placeholder": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "Select users"
                    },
                    "action_id": "start_dialog_2.selected_managers",
                    "filter": {
                        "include": [
                            "im"
                        ],
                        "exclude_bot_users": true
                    }
                },
                "label": {
                    "type": "plain_text",
                    "text": "Manager(s)",
                    "emoji": true
                },
                "optional": true
            },
            {
                "type": "divider"
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": "*Note:*\n1. Everyone around us (peers, reportees, or managers) has useful feedback for us.\n2. Grouping participants in different categories helps in showing their feedback category wise. If there are less than 2 responses in any of the categories, that feedback will be clubbed with that of the others to maintain their anonymity."
                    }
                ]
            }
        ]
    }
    if(errorMessage){
        let errorMessageBlock = {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `⚠️ \`${errorMessage}\``
            },
            "block_id": "start_dialog_2.error_message"
        }
        if(modal.blocks[0].block_id && modal.blocks[0].block_id === 'start_dialog_2.error_message')
            modal.blocks.splice(0, 1, errorMessageBlock)
        else
            modal.blocks.splice(0, 0, errorMessageBlock)
    }
    return modal
}

let getStartReviewModal = function(privateMetadata, participants, user){
    let questions = ''
    privateMetadata.questions.forEach( (q) => {
        questions += `\n• ${q.replace(/\*/g, '')}`
    })
    let modal = {
        "type": "modal",
        "callback_id": "start_dialog_review",
        "notify_on_close": true,
        "private_metadata": JSON.stringify(privateMetadata),
        "title": {
            "type": "plain_text",
            "text": "Review & Send",
            "emoji": true
        },
        "submit": {
            "type": "plain_text",
            "text": "Send",
            "emoji": true
        },
        "close": {
            "type": "plain_text",
            "text": "Back",
            "emoji": true
        },
        "blocks": [
            {
                "type": "input",
                "element": {
                    "type": "plain_text_input",
                    "multiline": true,
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Enter a personal message to the recipients to encourage them to share feedback!"
                    },
                    "initial_value": "Hi, I would love to get your advice in planning my development goals!",
                    "action_id": "start_dialog_review.personal_note",
                },
                "label": {
                    "type": "plain_text",
                    "text": ":writing_hand: Personalise your message:",
                    "emoji": true
                },
                "block_id": "start_dialog_review.personal_note"
            },
            {
                "type": "input",
                "element": {
                    "type": "datepicker",
                    "initial_date": Utils.timestampToSlackDateFormat(Date.now() + Constants.TIME.ONE_WEEK, user.slackTimezoneOffset),
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select a date",
                        "emoji": true
                    },
                    "action_id": "start_dialog_review.close_date"
                },
                "label": {
                    "type": "plain_text",
                    "text": "⏳ Feedback due date:",
                    "emoji": true
                },
                "block_id": "start_dialog_review.close_date"
            },
            {
                "type": "input",
                "element": {
                    "type": "static_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select an item",
                        "emoji": true
                    },
                    "action_id": "start_dialog_review.auto_repeat",
                    "initial_option": {
                        "text": {
                            "type": "plain_text",
                            "text": "Month (default)",
                            "emoji": true
                        },
                        "value": "month"
                    },
                    "options": [
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "Do not repeat",
                                "emoji": true
                            },
                            "value": "dnr"
                        },
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "Week",
                                "emoji": true
                            },
                            "value": "week"
                        },
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "Fortnight",
                                "emoji": true
                            },
                            "value": "fortnight"
                        },
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "Month (default)",
                                "emoji": true
                            },
                            "value": "month"
                        },
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "Quarter",
                                "emoji": true
                            },
                            "value": "quarter"
                        }
                    ]
                },
                "label": {
                    "type": "plain_text",
                    "text": "🔁 Auto-repeat schedule:",
                    "emoji": true
                },
                "block_id": "start_dialog_review.auto_repeat"
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": "*Tip:* Auto-repeat serves as a reminder to seek feedback; You can cancel it anytime."
                    }
                ]
            },
            {
                "type": "section",
                "block_id": "questions_participants",
                "text": {
                    "type": "mrkdwn",
                    "text": `\`\`\`Questions:${questions}\n\nParticipants:\n${participants}\`\`\``
                }
            }
        ]
    }
    return modal
}

let getStartModal3 = function(privateMetadata){
    let modal = {
        "type": "modal",
        "callback_id": "start_dialog_3",
        "notify_on_close": true,
        "clear_on_close": true,
        "private_metadata": JSON.stringify(privateMetadata),
        "title": {
            "type": "plain_text",
            "text": "Congratulations! 🎉",
            "emoji": true
        },
        "submit": {
            "type": "plain_text",
            "text": "Next: Self-Assess",
            "emoji": true
        },
        "close": {
            "type": "plain_text",
            "text": "Do Later",
            "emoji": true
        },
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Your feedback request has been sent!\n\n*Next Up:* Self Assessment :hugging_face:"
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "plain_text",
                        "text": "Write your Self-Assessment so that you can compare it with the feedback you receive.",
                        "emoji": true
                    }
                ]
            }
        ]
    }
    return modal
}

let getExtendFeedbackRequest = function(feedbackReq, isTitleChange){
    let personalNote
    if(isTitleChange){
        personalNote = `Hey there, I am changing the due date for the feedback request. The feedback you share will really help me be more self-aware. So please do take a look at the new date below and try to share your thoughts by then! It usually doesn't take more than a few minutes!`
    } else {
        if(feedbackReq.responsesReceived === 0)
            personalNote = `Hey there, I am extending the due date for the feedback request to enable you to respond. The feedback you share will really help me be more self-aware. Please do share your thoughts whenever you have a few minutes!`
        else
            personalNote = `Hey there, I am extending the due date for the feedback request to enable you to respond. I've already received ${feedbackReq.responsesReceived} responses out of ${feedbackReq.totalResponses} and the feedback you share will really help me be more self-aware. Please do share your thoughts whenever you have a few minutes!`
    }
    let modal = {
        "type": "modal",
        "callback_id": "extend_request",
        "notify_on_close": true,
        "clear_on_close": true,
        "private_metadata": JSON.stringify({feedbackReqId: feedbackReq.id, isChange: isTitleChange, initialDate: Utils.timestampToSlackDateFormat(feedbackReq.closeReqTimestamp, feedbackReq.userId.slackTimezoneOffset)}),
        "title": {
            "type": "plain_text",
            "text": isTitleChange ? "Change Due Date" : "Extend Due Date",
            "emoji": true
        },
        "submit": {
            "type": "plain_text",
            "text": "Submit",
            "emoji": true
        },
        "close": {
            "type": "plain_text",
            "text": "Back",
            "emoji": true
        },
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*Responses Received:* ${feedbackReq.responsesReceived}/${feedbackReq.totalResponses}\n*Current Due Date:* ${Utils.formatDate(feedbackReq.closeReqTimestamp, feedbackReq.userId.slackTimezoneOffset)}`
                }
            },
            {
                "type": "input",
                "element": {
                    "type": "datepicker",
                    "initial_date": Utils.timestampToSlackDateFormat(feedbackReq.closeReqTimestamp, feedbackReq.userId.slackTimezoneOffset),
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select a date",
                        "emoji": true
                    },
                    "action_id": "extend_request.due_date"
                },
                "label": {
                    "type": "plain_text",
                    "text": "Select a new due date:",
                    "emoji": true
                },
                "block_id": "extend_request.due_date"
            },
            {
                "type": "input",
                "element": {
                    "type": "plain_text_input",
                    "multiline": true,
                    "action_id": "extend_request.personal_note",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Enter a note to send along with the notification that due date has extended",
                        "emoji": true
                    },
                    "initial_value": personalNote
                },
                "label": {
                    "type": "plain_text",
                    "text": "Personal note:",
                    "emoji": true
                },
                "block_id": "extend_request.personal_note"
            }
        ]
    }
    return modal    
}

let showAppStartModal1 = async function(bot, message){
    let lastQuestions
    let lastReq = await feedbackRequestController.getLastFeedbackRequest(message.internal_user.id)
    if(lastReq){
        lastQuestions = lastReq.questionsList
    }
    if(message.actions[0].value === 'app_home.start_update'){
        let postData = { 
            token: bot.api.token,
            view_id: message.view.id,
            view: getStartModal1(lastQuestions)
        }
        await bot.api.views.update(postData)
    } else {
        let postData = { 
            token: bot.api.token,
            trigger_id: message.incoming_message.channelData.trigger_id,
            view: getStartModal1(lastQuestions)
        }
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.HOME_NEW_REQUEST, message.internal_user)
        await bot.api.views.open(postData)
    }
    let tempContext = message.internal_user.tempContext 
    tempContext.options = {}
    await userController.setTempContext(message.internal_user.id, tempContext)
}

let processSelectQuestionBlockAction = async function(bot, message){
    let blockId = message.actions[0].block_id
    let selectedQuestions = message.actions[0].selected_options.map( x => x.text.text )
    let data = message.internal_user.tempContext
    let isSelected = true
    switch(blockId){
        case 'start_dialog_1_question_work':
            if(data.options.work > selectedQuestions)
                isSelected = false
            data.options.work = selectedQuestions
            break
        case 'start_dialog_1_question_personal':
            if(data.options.personal > selectedQuestions)
                isSelected = false
            data.options.personal = selectedQuestions
            break
        case 'start_dialog_1_question_skills':
            if(data.options.skills > selectedQuestions)
                isSelected = false
            data.options.skills = selectedQuestions
            break
        case 'start_dialog_1_question_last':
            if(data.options.skills > selectedQuestions)
                isSelected = false
            data.options.last = selectedQuestions

    }
    if(isSelected)
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REQUEST_FEEDBACK_CHOOSE_QUESTIONS_SELECTED_QUESTION, message.internal_user)
    else
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REQUEST_FEEDBACK_CHOOSE_QUESTIONS_DESELECTED_QUESTION, message.internal_user)
    await userController.setTempContext(message.internal_user.id, data)
}


let showAppStartModal1Update = async function(bot, message){
    let action = ''
    let questions = []
    let lastQuestions
    let lastReqQuestions
    if(message.actions)
        action = message.actions[0].value
    if(action === 'start_dialog_1.edit_questions'){
        lastQuestions = await feedbackRequestController.getLastQuestions(message.internal_user.id)
        let tempContext = message.internal_user.tempContext
        let lastReq = await feedbackRequestController.getLastFeedbackRequest(message.internal_user.id)
        if(lastReq){
            lastReqQuestions = lastReq.questionsList
        }
        if(lastReqQuestions){
            tempContext.options = { 
                last: lastReqQuestions   
            }
        } else {
            tempContext.options = { 
                work: [ 
                    Constants.QUESTIONS.WORK.QUESTION1,
                    Constants.QUESTIONS.WORK.QUESTION2,
                    Constants.QUESTIONS.WORK.QUESTION3,
                ]   
            }
        }
        await userController.setTempContext(message.internal_user.id, tempContext)
    } else if (action === 'start_dialog_1.custom_questions'){
        let data = message.internal_user.tempContext
        for(i in data.options){
            questions.push(...data.options[i])
        }
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REQUEST_FEEDBACK_CHOOSE_QUESTIONS_ADD_CUSTOM_QUESTION, message.internal_user)
    }
    let modalView = getStartModal1UpdateOnAction(message.view.blocks, action, message.internal_user, questions, lastQuestions, lastReqQuestions)
    
    // if(action === 'start_dialog_1.edit_questions'){
    //     let postData = { 
    //         token: bot.api.token,
    //         trigger_id: message.incoming_message.channelData.trigger_id,
    //         view: modalView
    //     }
    //     await bot.api.views.push(postData)
    // } else {
        let postData = { 
            token: bot.api.token,
            view_id: message.view.id,
            hash: message.view.hash,
            view: modalView
        }
        try{
            await bot.api.views.update(postData)
        } catch(err){
            if(err.data && err.data.error === 'hash_conflict')
            return
            console.log(err)
        }
    // }
}

let processAppStartModal1 = async function(bot, message){
    let incomingPrivateMetadata = JSON.parse(message.view.private_metadata === '' ? '{}' : message.view.private_metadata )
    let messageStateValues = message.view.state.values
    let questions = []
    let x = 0
    for(let i in messageStateValues){
        if (i.startsWith("start_dialog_1.question_editable_") && messageStateValues[i][i].value)
            questions[x] = messageStateValues[i][i].value
        x++
    }
    if(questions.length === 0){
        let data = message.internal_user.tempContext
        for(i in data.options){
            questions.push(...data.options[i])
        }
    }
    if(questions.length === 0 && incomingPrivateMetadata.default){
        if(incomingPrivateMetadata.questions){
            questions = incomingPrivateMetadata.questions
        } else {
            questions[0] = Constants.QUESTIONS.QUESTION1
            questions[1] = Constants.QUESTIONS.QUESTION2
            questions[2] = Constants.QUESTIONS.QUESTION3
        }
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REQUEST_FEEDBACK_QUESTIONS_SUBMIT, message.internal_user)
    } else if (incomingPrivateMetadata.choosequestion) {
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REQUEST_FEEDBACK_CHOOSE_QUESTIONS_CHOOSE_PEOPLE, message.internal_user)
    } else {
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REQUEST_FEEDBACK_EDIT_QUESTIONS_CHOOSE_PEOPLE, message.internal_user)
    }
    // if(removeAstricks)
    //     questions = questions.map( q => q.replace(/\*/g, ''))
    let privateMetadata = { "questions": questions }
    if(questions.length === 0) {
        let tempContext = message.internal_user.tempContext
        tempContext.options = { 
            skills: [ 
                Constants.QUESTIONS.SKILLS.QUESTION1,
                Constants.QUESTIONS.SKILLS.QUESTION2,
            ]   
        }
        let modalView = getStartModal1UpdateOnAction(message.view.blocks, 'start_dialog_1.custom_questions', message.internal_user, questions, null)
        bot.httpBody({
            response_action: 'update',
            view: modalView
        })
        await userController.setTempContext(message.internal_user.id, tempContext)
        return
    }
    let modalView = getStartModal2(privateMetadata)
    bot.httpBody({
        response_action: 'push',
        view: modalView
    })
}

let processAppStartModal2 = async function(bot, message){
    let privateMetadata = JSON.parse(message.view.private_metadata)
    let messageStateValues = message.view.state.values
    let userId = message.user
    let selectedPeers = []
    let selectedManagers = []
    let selectedReportees = []
    if(messageStateValues.hasOwnProperty('start_dialog_2.selected_peers')){
        const values = messageStateValues['start_dialog_2.selected_peers']['start_dialog_2.selected_peers']
        if(values.type === 'multi_conversations_select'){
            if (values.selected_conversations)
                selectedPeers = values.selected_conversations.filter(x => x!==userId)
        }
    }
    if(messageStateValues.hasOwnProperty('start_dialog_2.selected_managers')){
        const values = messageStateValues['start_dialog_2.selected_managers']['start_dialog_2.selected_managers']
        if(values.type === 'multi_conversations_select'){
            if (values.selected_conversations)
                selectedManagers = values.selected_conversations.filter(x => x!==userId)
        }
    }
    if(messageStateValues.hasOwnProperty('start_dialog_2.selected_reportees')){
        const values = messageStateValues['start_dialog_2.selected_reportees']['start_dialog_2.selected_reportees']
        if(values.type === 'multi_conversations_select'){
            if (values.selected_conversations)
                selectedReportees = values.selected_conversations.filter(x => x!==userId)
                
        }
    }
    let completeList = selectedReportees.concat(selectedManagers).concat(selectedPeers)
    completeList = [ ...new Set(completeList) ]
    if(completeList.length >= 2){
        privateMetadata['selected_reportees'] = selectedReportees
        privateMetadata['selected_managers'] = selectedManagers
        privateMetadata['selected_peers'] = selectedPeers
        showAppStartReviewModal(bot, message, privateMetadata)
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REQUEST_FEEDBACK_RESPONDENTS_REVIEW, message.internal_user)    
    } else {
        let errorView = getStartModal2(privateMetadata, 'Select at least 2 people to maintain their anonymity!')
        bot.httpBody({
            response_action: 'update',
            view: errorView
        })
    }
}

let showAppStartReviewModal = async function(bot, message, privateMetadata){
    let selectedPeers = privateMetadata['selected_peers']
    let selectedManagers = privateMetadata['selected_managers']
    let selectedReportees = privateMetadata['selected_reportees']
    let completeList = selectedReportees.concat(selectedManagers).concat(selectedPeers)
    completeList = [ ...new Set(completeList) ]
    completeList = completeList.map(user => `<@${user}>`).join(', ')
    let modalView = getStartReviewModal(privateMetadata, `${completeList}`, message.internal_user)
    bot.httpBody({
        response_action: 'push',
        view: modalView
    })
}

let processStartReviewModal = async function(bot, message){
    let privateMetadata = JSON.parse(message.view.private_metadata)
    let messageStateValues = message.view.state.values
    let now = new Date()
    let oneDayAhead = now.getTime() + now.getTimezoneOffset() * 60 * 1000 + message.internal_user.slackTimezoneOffset * 1000 + Constants.TIME.ONE_DAY
    let requestCloseTimestamp = Utils.slackDateToTimestamp(messageStateValues['start_dialog_review.close_date']['start_dialog_review.close_date'].selected_date, message.internal_user.slackTimezoneOffset, 86340000)
    if(requestCloseTimestamp < oneDayAhead){
        bot.httpBody({
            "response_action": "errors",
            "errors": {
                "start_dialog_review.close_date": "Please select a date atleast one day next"
            }
        })
        return
    }
    privateMetadata.personalNote = messageStateValues['start_dialog_review.personal_note']['start_dialog_review.personal_note'].value
    privateMetadata.autoRepeat = messageStateValues['start_dialog_review.auto_repeat']['start_dialog_review.auto_repeat'].selected_option.value
    privateMetadata.requestCloseTimestamp = requestCloseTimestamp
    bot.httpBody({
        response_action: 'update',
        view: {
            "type": "modal",
            "callback_id": "start_dialog_review.processing",
            "title": {
                "type": "plain_text",
                "text": "Review Feedback Request",
                "emoji": true
            },
            "submit": {
                "type": "plain_text",
                "text": "Next",
                "emoji": true
            },
            "close": {
                "type": "plain_text",
                "text": "Cancel",
                "emoji": true
            },
            blocks: [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "*Sending feedback request*"
                    }
                }
            ]
        }
    })
    let selectedPeers = privateMetadata['selected_peers']
    let selectedManagers = privateMetadata['selected_managers']
    let selectedReportees = privateMetadata['selected_reportees']
    let completeList = selectedReportees.concat(selectedManagers).concat(selectedPeers)
    completeList = [ ...new Set(completeList) ]
    let result = await processFeedbackRequest(message, privateMetadata, completeList)
    let feedbackReq = result.feedbackReq
    let setOnboardingFlag = false
    if(feedbackReq){
        showAppStartModal3(bot, message, { feedbackReqId: feedbackReq.id})
        setOnboardingFlag = !message.internal_user.isOnboardingDone
        message.internal_user.isOnboardingDone = true
        appHomeView.showAppHome(bot, message )
        sendFeedbackRequestSent(bot, message.internal_user, feedbackReq.id)
        let welcomeMessage = await messageController.getMessage(feedbackReq.userId, Constants.MESSAGE_TYPE.FIRST_MESSAGE, '')
        let responseMessages = await messageController.getMessagesByType(feedbackReq.userId, Constants.MESSAGE_TYPE.RESPOND_MESSAGE)
        if(welcomeMessage){
            let welcomeMessageBlocks = messageView.getFirstTimeMessage(result.user.slackDisplayName, true).blocks
            let data = {
                token: bot.api.token,
                ts: welcomeMessage.data.activityId,
                channel: welcomeMessage.data.conversation.id,
                text: "✅ Feedback request created successfully",
                blocks: welcomeMessageBlocks
            }
            await bot.api.chat.update(data)
            await messageController.removeMessage(welcomeMessage.userId, welcomeMessage.type, welcomeMessage.refId)
        }
        if(responseMessages){
            responseMessages.forEach(async(responseMessage) => {
                responseMessage.view.blocks.splice(4, 1, {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "✅ Feedback request created successfully"
                    }
                })
                let data = {
                    token: bot.api.token,
                    ts: responseMessage.data.activityId,
                    channel: responseMessage.data.conversation.id,
                    text: "✅ Feedback request created successfully",
                    blocks: responseMessage.view.blocks
                }
                await bot.api.chat.update(data)
                await messageController.removeMessage(responseMessage.userId, welcomeMessage.type, welcomeMessage.refId)
            })
        }
        if(setOnboardingFlag){
            await userController.updateUserOnboardingDone(message.internal_user.id)
        }
        let team = await teamController.getTeamBySlackId(result.user.slackTeamId)
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REQUEST_FEEDBACK_REVIEW_SEND, message.internal_user)
        slackService.postNewFeedbackRequestMessage(team.slackWorkspaceName, result.user.slackDisplayName, result.user.slackTimezoneName, team.numberOfUsers, completeList.length - 1)
    } else {
        //show error processing request.
    }
}

let sendFeedbackRequestSent = async function(bot, user, feedbackReqId){
    let feedbackReq = await feedbackRequestController.getFeedbackRequestById(feedbackReqId)
    let usersList = feedbackReq.peersList.concat(feedbackReq.managersList).concat(feedbackReq.reporteesList)
    let messagesList = []
    usersList.forEach(async (user) => {
        let incomingRequestMessage = messageView.getIncomingFeedbackRequestMessage(feedbackReq, user)
        await bot.startPrivateConversation(user.slackId)
        let messageData = await bot.say(incomingRequestMessage)
        messagesList.push({
            userId: user.id,
            refId: feedbackReqId,
            type: Constants.MESSAGE_TYPE.INCOMING_FEEDBACKREQ_MESSAGE,
            data: messageData
        })
        if((!user.userEvents || (user.userEvents && !user.userEvents.includes(Constants.USER_EVENTS.REQUEST_RECIEVED)))){
            await userController.addUserEvents(user.id, Constants.USER_EVENTS.REQUEST_RECIEVED)
        }
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.RECEIVED_MESSAGE_NEW_REQUEST, user)
    })
    await bot.startPrivateConversation(user.slackId)
    let feedbackReqSentMessage = messageView.getFeedbackRequestSentMessage(feedbackReq)
    let messageData = await bot.say(feedbackReqSentMessage)
    messagesList.push({
        userId: feedbackReq.userId.id,
        refId: feedbackReqId,
        type: Constants.MESSAGE_TYPE.FEEDBACK_SENT_MESSAGE,
        data: messageData
    })
    await messageController.addListOfMessages(messagesList)
    if(user && (!user.userEvents || (user.userEvents && !user.userEvents.includes(Constants.USER_EVENTS.FEEDBACK_SENT)))){
        await userController.addUserEvents(user.id, Constants.USER_EVENTS.FEEDBACK_SENT)
    }
}

let showAppStartModal3 = async function(bot, message, privateMetadata){
    let postData = { 
        token: bot.api.token,
        view_id: message.view.id,
        view: getStartModal3(privateMetadata)
    }
    await bot.api.views.update(postData)
}

let processFeedbackRequest = async function(message, privateMetadata, completeList){
    let feedbackReqData = {
        userId: message.user,
        teamId: message.team.id,
        peersList: privateMetadata.selected_peers,
        managersList: privateMetadata.selected_managers,
        reporteesList: privateMetadata.selected_reportees,
        usersList: completeList,
        questionsList: privateMetadata.questions,
        personalNote: privateMetadata.personalNote,
        requestCloseTimestamp: privateMetadata.requestCloseTimestamp,
        autoRepeat: privateMetadata.autoRepeat
    }
    return await feedbackReqActivityController.addNewFeedbackRequest(feedbackReqData)
}

let showExtendFeedbackRequest = async function(bot, message){
    let feedbackReqId = message.actions[0].value
    let feedbackReq = await feedbackRequestController.getFeedbackRequestById(feedbackReqId)
    let days = Math.floor((feedbackReq.closeReqTimestamp - Date.now())/Constants.TIME.ONE_DAY)
    let modalView = getExtendFeedbackRequest(feedbackReq, message.actions[0].action_id === 'review_not_ready.extend_due_date' && days > 1)
    if(message.actions[0].action_id === 'review_not_ready.extend_due_date'){
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
    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.CHANGE_DUE_DATE_SUBMIT, message.internal_user) 
}

let processExtendFeedbackRequest = async function(bot, message){
    let privateMetadata = JSON.parse(message.view.private_metadata)
    let messageStateValues = message.view.state.values
    let feedbackReqId = privateMetadata.feedbackReqId
    let initialDate = privateMetadata.initialDate
    let isChange = privateMetadata.isChange
    let selectedDate = messageStateValues['extend_request.due_date']['extend_request.due_date'].selected_date
    let personalNote =  messageStateValues['extend_request.personal_note']['extend_request.personal_note'].value
    let closeRequestTimestamp = Utils.slackDateToTimestamp(selectedDate, message.internal_user.slackTimezoneOffset, 86340000)
    if(closeRequestTimestamp < Date.now()){
        bot.httpBody({
            "response_action": "errors",
            "errors": {
                "extend_request.due_date": `Due date cannot be in past`
            }
        })
    }
    if(initialDate === selectedDate){
        bot.httpBody({
            "response_action": "errors",
            "errors": {
                "extend_request.due_date": `Due date cannot be same as current due date`
            }
        })
    }
    let feedbackRequest = await feedbackRequestController.extendFeedbackRequest(feedbackReqId, closeRequestTimestamp)
    let autoExtendMessage = await messageController.getMessage(message.internal_user.id, Constants.MESSAGE_TYPE.EXTEND_MESSAGE, feedbackRequest.id)
    if(autoExtendMessage){
        let messageViewBlocks = autoExtendMessage.view.blocks
        messageViewBlocks[1] = {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `✅ Due date extended until ${Utils.formatDate(closeRequestTimestamp, message.internal_user.slackTimezoneOffset)}`
            }
        }
        let data = {
            token: bot.api.token,
            ts: autoExtendMessage.data.activityId,
            channel: autoExtendMessage.data.conversation.id,
            text: `✅ Due date extended until ${Utils.formatDate(closeRequestTimestamp, message.internal_user.slackTimezoneOffset)}`,
            blocks: messageViewBlocks
        }
        await bot.api.chat.update(data)
        await messageController.removeMessage(message.internal_user.id, Constants.MESSAGE_TYPE.EXTEND_MESSAGE, feedbackRequest.id)
    }
    let feedbackRequestActivities = await feedbackReqActivityController.getPendingResponsesForRequest(feedbackReqId)
    feedbackRequestActivities.forEach( async(req) => {
        let viewMessage = messageView.getFeedbackReqExtendedMessage(req.feedbackRequest, req.userFor, closeRequestTimestamp, personalNote, isChange)
        await bot.startPrivateConversation(req.userFor.slackId)
        let data = await bot.say(viewMessage)
        let messageObj = {
            userId: req.userFor.id,
            type:  Constants.MESSAGE_TYPE.REQ_EXTENDED_MESSAGE,
            refId:  req.feedbackRequest.id,
            data: data,
            view: viewMessage
        }
        await messageController.insertListOfMessages([messageObj])
    })
    appHomeView.showAppHome(bot, message, '', '✅ Due date changed')
}

module.exports = {
    showAppStartModal1,
    showAppStartModal1Update,
    processAppStartModal1,
    processSelectQuestionBlockAction,
    processAppStartModal2,
    processStartReviewModal,
    sendFeedbackRequestSent,
    processExtendFeedbackRequest,
    showExtendFeedbackRequest
}