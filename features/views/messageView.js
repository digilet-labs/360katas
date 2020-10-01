const Utils = require("../../src/Utils")
const Constants = require("../../src/Constants")

let getFeedbackRequestSentMessage = function(feedbackReq, isFeedbackCompleted = false){
    let questions = ""
    feedbackReq.questionsList.forEach((question, index)=> {
        questions += `\n>${index+1}. ${question.replace(/\n/g, '\n>')}`
    })
    let time = Utils.formatDate(feedbackReq.closeReqTimestamp, feedbackReq.userId.slackTimezoneOffset)
    let peersList = "N/A"
    let managersList = "N/A"
    let reporteesList = "N/A"
    if(feedbackReq.peersList.length > 0){
        peersList = feedbackReq.peersList.map(x => x.slackDisplayName).join(', ')
    }
    if(feedbackReq.managersList.length > 0){
        managersList = feedbackReq.managersList.map(x => x.slackDisplayName).join(', ')
    }
    if(feedbackReq.reporteesList.length > 0){
        reporteesList = feedbackReq.reporteesList.map(x => x.slackDisplayName).join(', ')
    }
    let message = {
        "text": "Your request has been sent successfully. You can review the responses once the due date is reached and enough people have responded!",
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Your request has been sent successfully.* You can review the responses once the due date is reached and enough people have responded!"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `>Questions:${questions}\n>\n>Feedback Due Date: ${time}\n>\n>Feedback Requested From: \n${peersList == "N/A" ? '' : `>• Peers: ${peersList}\n`}${reporteesList == "N/A" ? '' : `>• Reportees: ${reporteesList}\n`}${managersList == "N/A" ? '' : `>• Managers: ${managersList}`}`
                }
            }
        ]
    }
    
    if(isFeedbackCompleted){
        message.blocks.push({
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "✅ Self-Assessment completed"
			}
		})
    } else {
        message.blocks.push({
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Complete Self Assessment",
                        "emoji": true
                    },
                    "value": feedbackReq.id,
                    "action_id": "feedback_sent_message.self_assessment"
                }
            ]
        })
    }
    return message
}

let getIncomingFeedbackRequestMessage = function(feedbackReq, userFor, isResponseSent = false, isExpired = false){
    let questions = ""
    feedbackReq.questionsList.forEach((question, index)=> {
        questions += `\n>${index+1}. ${question.replace(/\n/g, '\n>')}`
    })
    let usersList = feedbackReq.peersList.map(x => x.slackDisplayName)
                        .concat(feedbackReq.managersList.map(x => x.slackDisplayName))
                        .concat(feedbackReq.reporteesList.map(x => x.slackDisplayName)).join(', ')
    let time = Utils.formatDate(feedbackReq.closeReqTimestamp, userFor.slackTimezoneOffset)
    let message = {
        "text": `Message from ${feedbackReq.userId.slackDisplayName}: ${feedbackReq.personalNote}\n\n*Questions:*\n${questions}`,
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `Message from <@${feedbackReq.userId.slackId}>:\n\n${feedbackReq.personalNote}\n\n*Questions:*\n${questions}`
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "style": "primary",
                        "text": {
                            "type": "plain_text",
                            "emoji": true,
                            "text": "🔆 Respond"
                        },
                        "value": feedbackReq.id,
                        "action_id": "incoming_feedbackreq_message.respond"
                    }
                ]
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": `*Notes:*\n1. Feedback participants: ${usersList}\n2. Feedback deadline: ${time}\n3. Anonymity: Feedback will not be displayed to ${feedbackReq.userId.slackDisplayName} unless there are more than 2 replies. All replies are 100% anonymised.`
                    }
                ]
            }
        ]
    }
    if(isResponseSent){
        let responseTime = Utils.formatDate(Date.now(), userFor.slackTimezoneOffset)
        message.blocks.splice(1, 1 , {
            "type": "section",
			"text": {
				"type": "mrkdwn",
				"text": `✅ Response sent successfully on ${responseTime}`
			}
        })
    }
    if (isExpired){
        let responseTime = Utils.formatDate(Date.now(), userFor.slackTimezoneOffset)
        message.blocks.splice(1, 1 , {
            "type": "section",
			"text": {
				"type": "mrkdwn",
				"text": `❌ Request expired on ${responseTime}`
			}
        })
    }
    return message
}

let getFirstTimeMessage = function(name, isFeedbackSent = false){
    let message = {
        "text": `Hey ${name},\nWelcome to 360Katas!\n\nWith 360Katas, you can seek feedback from your co-workers and use it to plan your development goals.\n\n360Katas is designed for individuals and not for company's performance review. Everything here is visible only to you!\n\nGet started by tapping 'Seek Feedback'👇!`,
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `Hey ${name},\nWelcome to 360Katas!\n\nWith 360Katas, you can *seek feedback* from your co-workers and use it to *plan your development goals*.\n\n360Katas is *designed for individuals and not for company's performance review*. Everything here is visible only to you!\n\nGet started by tapping \`Seek Feedback\`👇`
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "text": {
                            "type": "plain_text",
                            "text": "Seek Feedback",
                            "emoji": true
                        },
                        "type": "button",
                        "value": "app_home.start",
                        "action_id": "app_home.start"
                    }
                ]
            }
        ]
    }
    if(isFeedbackSent){
        message.blocks.splice(1,1, {
            "type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "✅ Feedback request created successfully"
			}
        })
    }
    return message
}


let getResponseSentMessage = function(feedbackReq, responses, user){
    let responsesMessage =""
    responses.forEach((x) => {
        responsesMessage += `\n>\n>*${x.questionText.replace(/\*/g, '').replace(/\n/g, '\n>')}*\n>${x.responseText.split("\n").join("\n>")}`
    })
    let message = {
        "text": `Thanks for your response ${user.slackDisplayName}!\nYour responses are recorded. They will be clubbed with others’ responses and sent to ${feedbackReq.userId.slackDisplayName} once sufficient replies are received.`,
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `Thanks for your response ${user.slackDisplayName}!\nYour responses are recorded. They will be clubbed with others’ responses and sent to ${feedbackReq.userId.slackDisplayName} once sufficient replies are received.`
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `>*Your Responses*:${responsesMessage}`
                }
            }
        ]
    }
    if(!user || (user && user.userEvents && !user.userEvents.includes(Constants.USER_EVENTS.FEEDBACK_SENT))){
        message.blocks.push(...[
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Do you also want to get *authentic feedback* and start the journey towards being your *best self*? Get started 👇"
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "style": "primary",
                        "text": {
                            "type": "plain_text",
                            "emoji": true,
                            "text": "Start Now, Thank us Later! 🚀"
                        },
                        "value": "response_sent_message.start_feedback_req",
                        "action_id": "response_sent_message.start_feedback_req"
                    }
                ]
            },
            {
                "type": "image",
                "image_url": `${Constants.WEBSITE_HOST}images/quotes/home/7.png`,
                "alt_text": "quotes"
            }
        ])
    }
    return message
}


let getFeedbackCompletedMessage = function(feedbackReq, isSelfAssessmentOngoing){
    let date = Utils.formatDate(feedbackReq.closeReqTimestamp, feedbackReq.userId.slackTimezoneOffset)

    let message
    if(feedbackReq.responsesReceived < 2){
        message = {
            "text": `Dear ${feedbackReq.userId.slackDisplayName},\nYour feedback was due today. Unfortunately, there aren’t sufficient replies yet. We need at least replies from 2 respondents to anonymise and show the feedback.`,
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `Dear ${feedbackReq.userId.slackDisplayName},\nYour feedback was due today. Unfortunately, there aren’t sufficient replies yet. We need at least replies from 2 respondents to anonymise and show the feedback.`
                    }
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "style": "primary",
                            "text": {
                                "type": "plain_text",
                                "emoji": true,
                                "text": "Review"
                            },
                            "value": feedbackReq.id,
                            "action_id": "closed_req_message.review_not_ready"
                        }
                    ]
                }
            ]
        }
    } else if(isSelfAssessmentOngoing){
        message = {
            "text": `Dear ${feedbackReq.userId.slackDisplayName},\nYour feedback is ready for review! 🎉\nBefore you can review your feedback, you need to complete self-assessment.`,
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `Dear ${feedbackReq.userId.slackDisplayName},\n*Your feedback is ready for review!* 🎉\nBefore you can review your feedback, you need to complete self-assessment.`
                    }
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "style": "primary",
                            "text": {
                                "type": "plain_text",
                                "emoji": true,
                                "text": "Complete Self Assessment"
                            },
                            "value": feedbackReq.id,
                            "action_id": "closed_req_message.self_assessment"
                        }
                    ]
                }
            ]
        }
    } else if(feedbackReq.responsesReceived === feedbackReq.totalResponses){
        message = {
            "text": `Dear ${feedbackReq.userId.slackDisplayName},\nYour feedback is ready for review! 🎉\nAll the feedback respondents have replied to your feedback and hence we don’t have to wait till the feedback close date, ${date}.`,
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `Dear ${feedbackReq.userId.slackDisplayName},\n*Your feedback is ready for review!* 🎉\nAll the feedback respondents have replied to your feedback and hence we don’t have to wait till the feedback close date, ${date}.`
                    }
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "style": "primary",
                            "text": {
                                "type": "plain_text",
                                "emoji": true,
                                "text": "Review"
                            },
                            "value": feedbackReq.id,
                            "action_id": "closed_req_message.review"
                        }
                    ]
                }
            ]
        }
    } else {
        message = {
            "text": `Dear ${feedbackReq.userId.slackDisplayName},\nYour feedback is ready for review! 🎉\nResponses Received: ${feedbackReq.responsesReceived} / ${feedbackReq.totalResponses}`,
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `Dear ${feedbackReq.userId.slackDisplayName},\n*Your feedback is ready for review!* 🎉\nResponses Received: ${feedbackReq.responsesReceived} / ${feedbackReq.totalResponses}`
                    }
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "style": "primary",
                            "text": {
                                "type": "plain_text",
                                "emoji": true,
                                "text": "Review"
                            },
                            "value": feedbackReq.id,
                            "action_id": "closed_req_message.review"
                        }
                    ]
                }
            ]
        }
    }
    
    return message
}

let getFeedbackRequestReminderMessage = function(feedbackReq, userFor){
    let daysPassed = Math.floor( ( Date.now() - feedbackReq.requestTimestamp ) / Constants.TIME.ONE_DAY )
    let totalDays = Math.floor( ( feedbackReq.closeReqTimestamp - feedbackReq.requestTimestamp ) / Constants.TIME.ONE_DAY )
    let remainingDays = totalDays - daysPassed
    let message = {
        "text": `Dear ${userFor.slackDisplayName}, ${feedbackReq.userId.slackDisplayName} is waiting for your response to the feedback request. The due date, ${Utils.formatDate(feedbackReq.closeReqTimestamp, userFor.slackTimezoneOffset)}, is in ${ remainingDays } day${remainingDays === 1 ? '' : 's'}.`,
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `Dear ${userFor.slackDisplayName},\n${feedbackReq.userId.slackDisplayName} is waiting for your response to the feedback request.\nThe due date, ${Utils.formatDate(feedbackReq.closeReqTimestamp, userFor.slackTimezoneOffset)}, is in ${ remainingDays } day${remainingDays === 1 ? '' : 's'}.\nPlease respond at your earliest convenience. It takes less than 5 minutes, usually.`
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "style": "primary",
                        "text": {
                            "type": "plain_text",
                            "emoji": true,
                            "text": "🔆 Respond"
                        },
                        "action_id": "reminder_feedbackreq_message.respond",
                        "value": feedbackReq.id
                    }
                ]
            }
        ]
    }
    if(remainingDays === 0){
        message.text = `Hi ${userFor.slackDisplayName},\nToday is the last day to send your feedback to ${feedbackReq.userId.slackDisplayName} ! The feedback request will close today at ${Utils.formatTime(feedbackReq.closeReqTimestamp, userFor.slackTimezoneOffset)}`
        message.blocks[0].text.text = message.text
    }
    return message
}

let getExtendMessage = function(feedbackReq){
    let day = feedbackReq.closeReqTimestamp + Constants.TIME.ONE_DAY > Date.now() ? 'tonight' : 'tomorrow'
    return {
        "text": `Dear ${feedbackReq.userId.slackDisplayName},\nYour feedback is due ${day}. Unfortunately, there aren’t sufficient replies yet. We need at least 2 replies to to anonymise and show the feedback.\nYou can send reminders or choose to extend the due date!`,
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `Dear ${feedbackReq.userId.slackDisplayName},\nYour feedback is due ${day}. Unfortunately, there aren’t sufficient replies yet. We need at least 2 replies to anonymise and show the feedback.\nYou can send reminders or choose to extend the due date!`
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "text": {
                            "type": "plain_text",
                            "text": ":mailbox_with_mail: Send Reminders",
                            "emoji": true
                        },
                        "value": feedbackReq.id,
                        "action_id": "closed_req_message.send_reminders",
                        "type": "button"
                    },
                    {
                        "text": {
                            "type": "plain_text",
                            "text": ":spiral_calendar_pad: Extend Due Date",
                            "emoji": true
                        },
                        "value": feedbackReq.id,
                        "action_id": "extend_message.extend_req",
                        "type": "button"
                    }
                ]
            }
        ]
    }
}

let getFeedbackReqExtendedMessage = function(feedbackReq, userFor, closeReqTimestamp, personalNote, isChange){
    let days = Math.floor((feedbackReq.closeReqTimestamp - Date.now())/Constants.TIME.ONE_DAY)
    let hours = Math.floor((feedbackReq.closeReqTimestamp - Date.now())/Constants.TIME.ONE_HOUR)
    return {
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*Message from ${feedbackReq.userId.slackDisplayName}:*\n\n>${personalNote.replace(/\n/g, '\n>')}`
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `Feedback due date ${isChange ? 'changed' : 'extended'} to: *${Utils.formatDate(closeReqTimestamp, userFor.slackTimezoneOffset)}*, _${(days < 1) ? `${hours} hour${hours === 1 ? '' : 's'} away` : `${days} day${days === 1 ? '' : 's'} away`}_`
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "text": {
                            "type": "plain_text",
                            "text": ":high_brightness: Respond",
                            "emoji": true
                        },
                        "value": feedbackReq.id,
                        "action_id": "reminder_feedbackreq_message.respond",
                        "type": "button"
                    }
                ]
            }
        ]
    }
}

let getSelfAssessmentSentMessage = function(responses){
    let modal = {
        "text": "Your self-assessment responses are recorded! Sharing them for your reference below:",
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Your self-assessment responses are recorded! Sharing them for your reference below:"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": responses.map(res => `>*${res.questionText.replace(/\*/g, '').replace(/\n/g, '*\n>*')}*\n>${res.responseText.replace(/\n/g, '\n>')}`).join("\n>\n")
                }
            }
        ]
    }
    return modal
}

module.exports = {
    getFeedbackRequestSentMessage,
    getIncomingFeedbackRequestMessage,
    getFirstTimeMessage,
    getResponseSentMessage,
    getFeedbackCompletedMessage,
    getFeedbackRequestReminderMessage,
    getExtendMessage,
    getFeedbackReqExtendedMessage,
    getSelfAssessmentSentMessage
}