const Constants = require("../../src/Constants")
const feedbackRequestController = require("../../src/controllers/feedbackRequestController")
const userController = require("../../src/controllers/userController")
const amplitudeService = require("../../src/services/amplitudeService")
const Utils = require("../../src/Utils")
const appHomeView = require("./appHomeView")

let getAutoRepeatEditModal = function(feedbackRequest, user){
    let questions = ''
    feedbackRequest.autoRepeatMetadata.questionsList.forEach((q) => {
        questions += `\n• ${q}`
    })
    let participants = feedbackRequest.autoRepeatMetadata.peersList.map(x => `@${x.slackDisplayName}`)
                        .concat(feedbackRequest.autoRepeatMetadata.managersList.map(x => `@${x.slackDisplayName}`))
                        .concat(feedbackRequest.autoRepeatMetadata.reporteesList.map(x => `@${x.slackDisplayName}`)).join(', ')
    return {
        "title": {
            "type": "plain_text",
            "text": "Upcoming Feedback",
            "emoji": true
        },
        "private_metadata": JSON.stringify({feedbackReqId: feedbackRequest.id}),
        "submit": {
            "type": "plain_text",
            "text": "Submit"
        },
        "type": "modal",
        "callback_id": "edit_auto_repeat",
        "notify_on_close": true,
        "close": {
            "type": "plain_text",
            "text": "Close",
            "emoji": true
        },
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*Personal message:*\n${feedbackRequest.autoRepeatMetadata.personalNote}`
                },
                "accessory": {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "✍️ Edit",
                        "emoji": true
                    },
                    "value": "edit_auto_repeat.edit_personal_msg",
                    "action_id": "edit_auto_repeat.edit_personal_msg",
                }
            },
            {
                "type": "section",
                "block_id": "edit_auto_repeat.edit_questions_title",
                "text": {
                    "type": "mrkdwn",
                    "text": `*Questions:*${questions}`
                },
                "accessory": {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": ":question: Edit",
                        "emoji": true
                    },
                    "value": "edit_auto_repeat.edit_questions",
                    "action_id": "edit_auto_repeat.edit_questions"
                }
            },
            {
                "type": "section",
                "block_id": "edit_auto_repeat.edit_participants_title",
                "text": {
                    "type": "mrkdwn",
                    "text": `*Participants:*\n${participants}`
                },
                "accessory": {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "👥 Edit",
                        "emoji": true
                    },
                    "value": "edit_auto_repeat.edit_participants",
                    "action_id": "edit_auto_repeat.edit_participants",
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*Scheduled date:* ${Utils.formatDate(feedbackRequest.autoRepeat, user.slackTimezoneOffset)}, _repeat every ${feedbackRequest.autoRepeatName}_\n\n*Due date:* ${Utils.formatDate(feedbackRequest.autoRepeat + feedbackRequest.autoRepeatMetadata.nextDueDateDays * Constants.TIME.ONE_DAY ,user.slackTimezoneOffset)}, _${feedbackRequest.autoRepeatMetadata.nextDueDateDays} days from scheduled date_`
                },
                "accessory": {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "🗓️ Edit",
                        "emoji": true
                    },
                    "value": "edit_auto_repeat.edit_dates",
                    "action_id": "edit_auto_repeat.edit_dates"
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "To cancel auto-repeat:"
                },
                "accessory": {
                    "type": "button",
                    "style": "danger",
                    "text": {
                        "type": "plain_text",
                        "text": "Delete",
                        "emoji": true
                    },
                    "confirm": {
                        "title": {
                            "type": "plain_text",
                            "text": "Are you sure?"
                        },
                        "text": {
                            "type": "mrkdwn",
                            "text": "Subsequent requests will not be automatically sent once you delete and you will need to manually configure the request again!"
                        },
                        "confirm": {
                            "type": "plain_text",
                            "text": "Yes"
                        },
                        "deny": {
                            "type": "plain_text",
                            "text": "Stop, I've changed my mind!"
                        },
                        "style": "danger"
                    },
                    "value": "edit_auto_repeat.delete_auto_repeat",
                    "action_id": "edit_auto_repeat.delete_auto_repeat"
                }
            }
        ]
    }    
}

let getUpdatedAutoRepeatModal = function(action, blocks, privateMetadata, feedbackRequest, user){
    if(blocks[0].block_id === 'error_message'){
        blocks.splice(0, 1)
    }
    if(action === 'edit_auto_repeat.edit_personal_msg'){
        blocks[0] = {
            "type": "input",
            "element": {
                "type": "plain_text_input",
                "multiline": true,
                "placeholder": {
                    "type": "plain_text",
                    "text": "Enter a personal message to the recipients to encourage them to share feedback!"
                },
                "initial_value": feedbackRequest.autoRepeatMetadata.personalNote,
                "action_id": "edit_auto_repeat.edit_personal_msg",
            },
            "label": {
                "type": "plain_text",
                "text": "✍️ Edit Personal Message:",
                "emoji": true
            },
            "block_id": "edit_auto_repeat.edit_personal_msg"
        }
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.AUTO_REPEAT_EDIT_PERSONAL_MSG, user)
    }
    if(action === 'edit_auto_repeat.edit_questions'){
        let questionBlocks = [{
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `:question: *Edit Questions:*`
            },
            "block_id": "edit_auto_repeat.edit_questions"
        }]
        feedbackRequest.autoRepeatMetadata.questionsList.forEach((q, i)=>{
            let number = i+1
            let random_id = Math.floor(Math.random() * 101)
            action_id = `edit_auto_repeat.question_editable_${random_id}`
            questionBlocks.push(...[
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `*Q ${number}:*`
                    },
                    "block_id": action_id+"_title"
                    // "accessory": {
                    //     "type": "button",
                    //     "text": {
                    //         "type": "plain_text",
                    //         "text": `Delete Question ${number}`,
                    //         "emoji": true
                    //     },
                    //     "action_id": 'start_dialog_1.dialog_action',
                    //     "value": `start_dialog_1.delete_question_${number}`
                    // }
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
                        "action_id": action_id,
                        "initial_value": q
                    },
                    "label": {
                        "type": "plain_text",
                        "text": " ",
                        "emoji": true
                    },
                    "block_id": action_id,
                }
            ])
        })
        blocks.splice(1, 1, ...questionBlocks)
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.AUTO_REPEAT_EDIT_QUESTIONS, user)
    }
    if(action === 'edit_auto_repeat.edit_participants'){
        let participantBlocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `👥 *Edit Participants:*`
                },
                "block_id": "edit_auto_repeat.edit_participants"
            },
            {
                "type": "input",
                "block_id": "edit_auto_repeat.selected_peers",
                "element": {
                    "type": "multi_conversations_select",
                    "placeholder": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "Select users"
                    },
                    "action_id": "edit_auto_repeat.selected_peers",
                    "filter": {
                        "include": [
                            "im"
                        ],
                        "exclude_bot_users": true
                    },
                    "initial_conversations": feedbackRequest.autoRepeatMetadata.peersList.map(u => u.slackId),
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
                "block_id": "edit_auto_repeat.selected_reportees",
                "element": {
                    "type": "multi_conversations_select",
                    "placeholder": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "Select users"
                    },
                    "action_id": "edit_auto_repeat.selected_reportees",
                    "filter": {
                        "include": [
                            "im"
                        ],
                        "exclude_bot_users": true
                    },
                    "initial_conversations": feedbackRequest.autoRepeatMetadata.reporteesList.map(u => u.slackId),
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
                "block_id": "edit_auto_repeat.selected_managers",
                "element": {
                    "type": "multi_conversations_select",
                    "placeholder": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "Select users"
                    },
                    "action_id": "edit_auto_repeat.selected_managers",
                    "filter": {
                        "include": [
                            "im"
                        ],
                        "exclude_bot_users": true
                    },
                    "initial_conversations": feedbackRequest.autoRepeatMetadata.managersList.map(u => u.slackId),
                },
                "label": {
                    "type": "plain_text",
                    "text": "Manager(s)",
                    "emoji": true
                },
                "optional": true
            }
        ]
        console.log(feedbackRequest.autoRepeatMetadata.peersList.map(u => u.slackId))
        let x = 2
        if(blocks[1].block_id === 'edit_auto_repeat.edit_questions'){
            x = feedbackRequest.autoRepeatMetadata.questionsList.length * 2 + 2
        }
        blocks.splice(x, 1, ...participantBlocks)
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.AUTO_REPEAT_EDIT_PARTICIPANTS, user)
    }
    if(action === 'edit_auto_repeat.edit_dates'){
        let initialOption
        if(feedbackRequest.autoRepeatName === 'week'){
            initialOption = {
                "text": {
                    "type": "plain_text",
                    "text": "Week",
                    "emoji": true
                },
                "value": "week"
            }
        } else if (feedbackRequest.autoRepeatName === 'fortnight'){
            initialOption = {
                "text": {
                    "type": "plain_text",
                    "text": "Fortnight",
                    "emoji": true
                },
                "value": "fortnight"
            }
        } else if(feedbackRequest.autoRepeatName === 'month'){
            initialOption = {
                "text": {
                    "type": "plain_text",
                    "text": "Month (default)",
                    "emoji": true
                },
                "value": "month"
            }
        } else if (feedbackRequest.autoRepeatName === 'quarter'){
            initialOption = {
                "text": {
                    "type": "plain_text",
                    "text": "Quarter",
                    "emoji": true
                },
                "value": "quarter"
            }
        } else {
            initialOption = {
                "text": {
                    "type": "plain_text",
                    "text": "Do not repeat",
                    "emoji": true
                },
                "value": "dnr"
            }
        }
        let dateBlocks = [
            {
                "type": "input",
                "element": {
                    "type": "static_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select an item",
                        "emoji": true
                    },
                    "action_id": "edit_auto_repeat.auto_repeat",
                    "initial_option": initialOption,
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
                "block_id": "edit_auto_repeat.auto_repeat"
            },
            {
                "type": "input",
                "element": {
                    "type": "datepicker",
                    "initial_date": Utils.timestampToSlackDateFormat(feedbackRequest.autoRepeat, user.slackTimezoneOffset),
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select a date",
                        "emoji": true
                    },
                    "action_id": "edit_auto_repeat.schedule_date"
                },
                "label": {
                    "type": "plain_text",
                    "text": "⏳ Next scheduled date:",
                    "emoji": true
                },
                "block_id": "edit_auto_repeat.schedule_date"
            },
            {
                "type": "input",
                "element": {
                    "type": "datepicker",
                    "initial_date": Utils.timestampToSlackDateFormat(feedbackRequest.autoRepeat + feedbackRequest.autoRepeatMetadata.nextDueDateDays * Constants.TIME.ONE_DAY ,user.slackTimezoneOffset),
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select a date",
                        "emoji": true
                    },
                    "action_id": "edit_auto_repeat.close_date"
                },
                "label": {
                    "type": "plain_text",
                    "text": "⏳ Feedback due date:",
                    "emoji": true
                },
                "block_id": "edit_auto_repeat.close_date"
            }
        ]
        let x = 1
        if(blocks[1].block_id === 'edit_auto_repeat.edit_questions'){
            x += feedbackRequest.autoRepeatMetadata.questionsList.length * 2 + 1
        } else {
            x += 1
        }
        if(blocks[x].block_id === 'edit_auto_repeat.edit_participants'){
            x += 4
        } else {
            x += 1   
        }
        blocks.splice(x, 1, ...dateBlocks)
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.AUTO_REPEAT_EDIT_DATES, user)
    }
    if(action === 'error'){
        blocks.splice(0, 0, {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": '⚠️ Select at least 2 people to maintain their anonymity!'
            },
            "block_id": "error_message"
        })
    }
    return {
        "title": {
            "type": "plain_text",
            "text": "Upcoming Feedback",
            "emoji": true
        },
        "submit": {
            "type": "plain_text",
            "text": "Submit"
        },
        "type": "modal",
        "callback_id": "edit_auto_repeat",
        "private_metadata": JSON.stringify(privateMetadata),
        "notify_on_close": true,
        "close": {
            "type": "plain_text",
            "text": "Close",
            "emoji": true
        },
        "blocks": blocks
    }
}



let showEditAutoRepeatModal = async function(bot, message){
    let feedbackReqId = message.actions[0].value
    let feedbackRequest = await feedbackRequestController.getFeedbackRequestById(feedbackReqId)
    let postData = { 
        token: bot.api.token,
        trigger_id: message.incoming_message.channelData.trigger_id,
        view: getAutoRepeatEditModal(feedbackRequest, message.internal_user)
    }
    await bot.api.views.open(postData)
    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.HOME_VIEW_AUTO_REPEAT, message.internal_user)
}

let updateEditAutoRepeatModal = async function(bot, message){
    let action = message.actions[0].value
    let privateMetadata = JSON.parse(message.view.private_metadata)
    let feedbackReqId = privateMetadata.feedbackReqId
    let feedbackRequest = await feedbackRequestController.getFeedbackRequestById(feedbackReqId)
    let modalView = getUpdatedAutoRepeatModal(action, message.view.blocks, privateMetadata, feedbackRequest, message.internal_user)
    let postData = { 
        token: bot.api.token,
        view_id: message.view.id,
        hash: message.view.hash,
        view: modalView
    }
    await bot.api.views.update(postData)
}

let processEditAutoRepeatModal = async function(bot, message){
    let messageStateValues = message.view.state.values
    let privateMetadata = JSON.parse(message.view.private_metadata)
    let feedbackReqId = privateMetadata.feedbackReqId
    let userId = message.user

    let peersList = []
    let managersList = []
    let reporteesList = []
    let completeList
    if(messageStateValues['edit_auto_repeat.selected_peers']){
        let selectedPeers = []
        let selectedManagers = []
        let selectedReportees = []
        if(messageStateValues.hasOwnProperty('edit_auto_repeat.selected_peers')){
            const values = messageStateValues['edit_auto_repeat.selected_peers']['edit_auto_repeat.selected_peers']
            if(values.type === 'multi_conversations_select'){
                if (values.selected_conversations)
                    selectedPeers = values.selected_conversations.filter(x => x!==userId)
            }
        }
        if(messageStateValues.hasOwnProperty('edit_auto_repeat.selected_managers')){
            const values = messageStateValues['edit_auto_repeat.selected_managers']['edit_auto_repeat.selected_managers']
            if(values.type === 'multi_conversations_select'){
                if (values.selected_conversations)
                    selectedManagers = values.selected_conversations.filter(x => x!==userId)
            }
        }
        if(messageStateValues.hasOwnProperty('edit_auto_repeat.selected_reportees')){
            const values = messageStateValues['edit_auto_repeat.selected_reportees']['edit_auto_repeat.selected_reportees']
            if(values.type === 'multi_conversations_select'){
                if (values.selected_conversations)
                    selectedReportees = values.selected_conversations.filter(x => x!==userId)
            }
        }
        completeList = selectedReportees.concat(selectedManagers).concat(selectedPeers)
        completeList = [ ...new Set(completeList) ]
        if(completeList.length >= 2){
            let usersList = await userController.getUsersBySlackIds(completeList)
            usersList.forEach(user => {
                if(selectedPeers.includes(user.slackId)){
                    peersList.push(user.id)
                } else if (selectedManagers.includes(user.slackId)){
                    managersList.push(user.id)
                } else if (selectedReportees.includes(user.slackId)){
                    reporteesList.push(user.id)
                }
            })
        } else {
            bot.httpBody({
                response_action: 'update',
                view: getUpdatedAutoRepeatModal('error', message.view.blocks, privateMetadata, null, null)
            })
        }
    }

    let scheduleDate
    if(messageStateValues['edit_auto_repeat.schedule_date']){
        scheduleDate = Utils.slackDateToTimestamp(messageStateValues['edit_auto_repeat.schedule_date']['edit_auto_repeat.schedule_date'].selected_date, message.internal_user.slackTimezoneOffset)
        if( scheduleDate < Date.now()){
            bot.httpBody({
                "response_action": "errors",
                "errors": {
                    "edit_auto_repeat.schedule_date": `Next scheduled date cannot be in past`
                }
            })
            return
        }
    }
    
    let dueDateTimestamp 
    if(messageStateValues['edit_auto_repeat.close_date']){
        dueDateTimestamp = Utils.slackDateToTimestamp(messageStateValues['edit_auto_repeat.close_date']['edit_auto_repeat.close_date'].selected_date, message.internal_user.slackTimezoneOffset, 86340000)
        if( dueDateTimestamp < scheduleDate + Constants.TIME.ONE_DAY ){
            bot.httpBody({
                "response_action": "errors",
                "errors": {
                    "edit_auto_repeat.close_date": `Due date should be atleast 1 day greater than scheduled date (${Utils.formatDate(scheduleDate, message.internal_user.slackTimezoneOffset)})`
                }
            })
            return
        }
    }

    let questions = []
    for(let i in messageStateValues){
        if (i.startsWith("edit_auto_repeat.question_editable_") && messageStateValues[i][i].value)
            questions.push(messageStateValues[i][i].value)
    }

        
    let feedbackRequest = await feedbackRequestController.getFeedbackRequestById(feedbackReqId)
    let autoRepeatMetadata = feedbackRequest.autoRepeatMetadata
    autoRepeatMetadata.peersList = autoRepeatMetadata.peersList.map( u => u.id )
    autoRepeatMetadata.managersList = autoRepeatMetadata.managersList.map( u => u.id )
    autoRepeatMetadata.reporteesList = autoRepeatMetadata.reporteesList.map( u => u.id )

    if(questions.length > 0)
        autoRepeatMetadata.questionsList = questions

    if(messageStateValues['edit_auto_repeat.edit_personal_msg'])
        autoRepeatMetadata.personalNote = messageStateValues['edit_auto_repeat.edit_personal_msg']['edit_auto_repeat.edit_personal_msg'].value

    if(completeList){
        autoRepeatMetadata.peersList = peersList
        autoRepeatMetadata.managersList = managersList
        autoRepeatMetadata.reporteesList = reporteesList
    }

    if(dueDateTimestamp)
        autoRepeatMetadata.nextDueDateDays = Math.floor( ( dueDateTimestamp - scheduleDate ) / Constants.TIME.ONE_DAY )

    let autoRepeatName
    if(messageStateValues['edit_auto_repeat.auto_repeat'])
        autoRepeatName = messageStateValues['edit_auto_repeat.auto_repeat']['edit_auto_repeat.auto_repeat'].selected_option.value

    await feedbackRequestController.setAutoRepeatMetadata(feedbackReqId, autoRepeatMetadata, autoRepeatName, scheduleDate)
    appHomeView.showAppHome(bot, message)
    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.AUTO_REPEAT_SUBMIT, message.internal_user)
}

let processDeleteAutoRepeatAction = async function(bot, message){
    let privateMetadata = JSON.parse(message.view.private_metadata)
    let feedbackReqId = privateMetadata.feedbackReqId
    await feedbackRequestController.removeAutoRepeat(feedbackReqId)
    let postData = { 
        token: bot.api.token,
        view_id: message.view.id,
        hash: message.view.hash,
        view: {
            "title": {
                "type": "plain_text",
                "text": "Upcoming Feedback",
                "emoji": true
            },
            "type": "modal",
            "close": {
                "type": "plain_text",
                "text": "Close",
                "emoji": true
            },
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "Auto-repeat request successfully deleted!"
                    }
                }
            ]
        }
    }
    await bot.api.views.update(postData)
    appHomeView.showAppHome(bot, message)
    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.AUTO_REPEAT_EDIT_DELETE, message.internal_user)
}

module.exports = {
    showEditAutoRepeatModal,
    updateEditAutoRepeatModal,
    processEditAutoRepeatModal,
    processDeleteAutoRepeatAction
}