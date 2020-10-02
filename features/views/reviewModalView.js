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

const responseController = require("../../src/controllers/responseController")
const Utils = require("../../src/Utils")
const feedbackReqActivityController = require("../../src/controllers/feedbackReqActivityController")
const amplitudeService = require("../../src/services/amplitudeService")
const Constants = require('../../src/Constants')
const appHomeView = require("./appHomeView")
const messageController = require("../../src/controllers/messageController")
const teamController = require("../../src/controllers/teamController")
const slackService = require("../../src/services/slackService")
const feedbackRequestController = require("../../src/controllers/feedbackRequestController")
const _ = require('underscore')

let getReviewModal = function(responses, feedbackReq, type, showMessage = false){
    let getSectionTitleBlock = function(title){
        return {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": `*${title}*`
			}
		}
    }
    let getAnswersResponseBlock = function(array, isSelf, qindex, multiplyFactor, pmrindex){
        let body = ""
        array = _.shuffle(array)
        array.forEach((response, index) =>{
            let emojiIndex = qindex * multiplyFactor + pmrindex + index
            let text = `>${isSelf ? '' : Utils.getAnonymousEmoji(emojiIndex)+": "}${response.responseText.replace(/\n/g, '\n>')}`
            if(response.replies && response.replies.length > 0){
                response.replies.forEach((x, i) => {
                    if(i % 2 === 0)
                        text += `\n>*You:* ${x.replace(/\n/g, '\n>')}`
                    else
                        text += `\n>${Utils.getAnonymousEmoji(emojiIndex)}: ${x.replace(/\n/g, '\n>')}`
                })
            }
            text +=  (array.length-1 === index) ? '' : "\n\n"
            body += text 
        })
        let block = {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": body
			}
        }
        return block
    }
    let getQuestionResponseBlock = function(index, questionText, responses){
        let blocks = []
        if (questionText.length < 151) {
            blocks.push({
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": `${index}. ${questionText.replace(/\*/g, '')}`
                }
            })
        } else {
            blocks.push({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*${index}. ${questionText.replace(/\*/g, '')}*`
                }
            })
        }
        let pmr = 0
        let multiplyFactor = Object.keys(responses).length
        for(section in responses){
            let title = "Peers, Managers and Reportees"
            let array = responses.all
            if(section === 'peers'){
                title = 'Peers'
                array = responses.peers
            } else if(section === 'managers'){
                title = 'Managers'
                array = responses.managers
            } else if(section === 'reportees'){
                title = 'Reportees'
                array = responses.reportees
            } else if (section === 'others'){
                if(Object.keys(responses).includes('peers'))
                    title = "Managers and Reportees"
                else if(Object.keys(responses).includes('managers'))
                    title = "Peers and Reportees"
                else
                    title = "Reportees and Managers"
                array = responses.others
            } else if (section === 'self'){
                title = "Self Assessment"
                array = responses.self
            }
            blocks.push(getSectionTitleBlock(title))
            blocks.push(getAnswersResponseBlock(array, section === 'self', index-1, multiplyFactor, pmr))
            pmr++
            // array.forEach((x,i) => {
            //     blocks.push(...getAnswerResponseBlock(section === 'self' ? 0 : i+1, x))
            // })
        }
        blocks.push({
            "type": "divider"
        })
        return blocks
    }
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
    let modal = {
        "type": "modal",
        "callback_id": "review_feedback",
        "notify_on_close": true,
        "private_metadata": JSON.stringify({type: type, feedbackReqId: feedbackReq.id, sentThankYouNote: !!feedbackReq.thankYouMessage}),
        "title": {
            "type": "plain_text",
            "text": "Review Feedback",
            "emoji": true
        },
        "close": {
            "type": "plain_text",
            "text": "Back",
            "emoji": true
        },
        "blocks": [
        ]
    }
    var questionNumber = 1
    for(x in responses){
        let blocks = getQuestionResponseBlock(questionNumber, x, responses[x])
        modal.blocks.splice(modal.blocks.length, 0, ...blocks)
        questionNumber++
    }
    if(type === 'past')
        modal.blocks.splice(0, 2)
    else {
        modal.submit = {
            "type": "plain_text",
            "text": "Next: Thank / Comment",
            "emoji": true
        }
    }
    modal.blocks.push(...[
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `\`\`\`Feedback Request Information:\n-----------------------------\n\nRequested on: ${time}\n\nParticipants:\n${peersList == "N/A" ? '' : `- Peers: ${peersList}\n`}${reporteesList == "N/A" ? '' : `- Reportees: ${reporteesList}\n`}${managersList == "N/A" ? '' : `- Managers: ${managersList}\n`}\nResponses Received: ${feedbackReq.responsesReceived} / ${feedbackReq.totalResponses}\`\`\``
            }
        }
    ])
    let randomImage = `${Constants.WEBSITE_HOST}images/quotes/review/${Math.floor(Math.random() * 8)+1}.png`
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
    if (showMessage){
        modal.blocks.splice(0, 0, {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": showMessage
            }
        })
    }
    return modal
}

let getReviewNextModal = function(feedbackReqId, sentThankYouNote){
    let modal = {
        "type": "modal",
        "callback_id": "review_next_feedback",
        "notify_on_close": true,
        "private_metadata": JSON.stringify({feedbackReqId: feedbackReqId}),
        "title": {
            "type": "plain_text",
            "text": "Review Feedback",
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
                    "text": "To ask a follow on question or respond to any feedback:"
                },
                "accessory": {
                    "type": "button",
                    "style": "primary",
                    "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "Comment / Seek Clarification"
                    },
                    "value": feedbackReqId,
                    "action_id": "review_modal.seek_clarification"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "To send a thank you note for their time & energy:"
                },
                "accessory": {
                    "type": "button",
                    "style": "primary",
                    "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "Edit & Send"
                    },
                    "value": feedbackReqId,
                    "action_id": "review_modal.send_note"
                }
            },
        ]
    }
    if (sentThankYouNote){
        modal.blocks.splice(1,1,  {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "Thank you note sent successfully"
            }
        })   
    }
    return modal
}

let getReviewNotReadyModal = function(feedbackRequestActivity){
    let participants = feedbackRequestActivity.feedbackRequest.reporteesList.concat(feedbackRequestActivity.feedbackRequest.peersList).concat(feedbackRequestActivity.feedbackRequest.managersList)
    let selfAssementBlock = {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": `*1. Self Assessment is done*\n${feedbackRequestActivity.status === Constants.FEEDBACK_REQ_STATUS.ONGOING ? '⬜ Current Status: Pending' : '✅ Current Status: Completed'}`
        }
    }
    if( feedbackRequestActivity.status === Constants.FEEDBACK_REQ_STATUS.ONGOING ){
        selfAssementBlock.accessory = {
            "type": "button",
            "text": {
                "type": "plain_text",
                "text": "Self-Assess",
                "emoji": true
            },
            "value": feedbackRequestActivity.feedbackRequest.id,
            "action_id": "review_not_ready.self_assess"
        }
    }
    let currentStatusBlock = {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": `${feedbackRequestActivity.feedbackRequest.responsesReceived >= 2 ? '✅' : '⬜'} Current Status: ${feedbackRequestActivity.feedbackRequest.responsesReceived}/${feedbackRequestActivity.feedbackRequest.totalResponses} responses received.${feedbackRequestActivity.feedbackRequest.remindersSent.length > 0 ? `\nReminders sent on: ${feedbackRequestActivity.feedbackRequest.remindersSent.reverse().map(x => Utils.formatDate(x, feedbackRequestActivity.feedbackRequest.userId.slackTimezoneOffset )).join(", ")}`: ''}`
        }
    }
    if(feedbackRequestActivity.feedbackRequest.status === Constants.FEEDBACK_REQ_STATUS.ONGOING)
        currentStatusBlock.accessory = {
            "type": "button",
            "text": {
                "type": "plain_text",
                "text": "Send Reminders",
                "emoji": true
            },
            "value": feedbackRequestActivity.feedbackRequest.id,
            "action_id": "review_not_ready.send_reminders"
        }
    if((feedbackRequestActivity.feedbackRequest.status === Constants.FEEDBACK_REQ_STATUS.SUBMITTED || feedbackRequestActivity.feedbackRequest.status === Constants.FEEDBACK_REQ_STATUS.CONCLUDED) && feedbackRequestActivity.feedbackRequest.responsesReceived < 2){
        currentStatusBlock.accessory = {
            "type": "button",
            "text": {
                "type": "plain_text",
                "text": "Extend Due Date",
                "emoji": true
            },
            "value": feedbackRequestActivity.feedbackRequest.id,
            "action_id": "review_not_ready.extend_due_date"
        }
    }
    let days = Math.floor((feedbackRequestActivity.feedbackRequest.closeReqTimestamp - Date.now())/Constants.TIME.ONE_DAY)
    let hours 
    if (days === 0){
        hours = Math.floor((feedbackRequestActivity.feedbackRequest.closeReqTimestamp - Date.now())/Constants.TIME.ONE_HOUR)
    }
    let dueDateBlock
    if(feedbackRequestActivity.feedbackRequest.status === Constants.FEEDBACK_REQ_STATUS.ONGOING)
        dueDateBlock = {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `⬜ Due date: ${Utils.formatDate(feedbackRequestActivity.feedbackRequest.closeReqTimestamp, feedbackRequestActivity.feedbackRequest.userId.slackTimezoneOffset)}, ${ (days === 0) ? `${hours} hours away` : `${days} day${days === 1 ? '' : 's'} away`}`
            },
            "accessory": {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": days <= 1 ? "Extend Due Date" : 'Change Due Date',
                    "emoji": true
                },
                "value": feedbackRequestActivity.feedbackRequest.id,
                "action_id": "review_not_ready.extend_due_date"
            }
        }
    else
    dueDateBlock = {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": `✅ Closed at: ${Utils.formatDate(feedbackRequestActivity.feedbackRequest.closeReqTimestamp, feedbackRequestActivity.feedbackRequest.userId.slackTimezoneOffset)}, ${Utils.formatTime(feedbackRequestActivity.feedbackRequest.closeReqTimestamp, feedbackRequestActivity.feedbackRequest.userId.slackTimezoneOffset)}`
        }
    }
    let modal ={
        "title": {
            "type": "plain_text",
            "text": "Review Feedback",
            "emoji": true
        },
        "close": {
            "type": "plain_text",
            "text": "Back"
        },
        "type": "modal",
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "Your feedback will be ready for review when the below criteria is met"
                }
            },
            selfAssementBlock,
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*2. At least 2 participants reply*"
                }
            },
            currentStatusBlock,
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*3. Due Date is reached*"
                }
            },
            dueDateBlock,
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `\`\`\`Questions:${ feedbackRequestActivity.feedbackRequest.questionsList.map( (x,i) => `\n${i+1}. ${x.replace(/\*/g, '')}`).join(" ") }\n\nParticipants:\n${participants.map(x => `<@${x.slackId}>`).join(', ')}\`\`\``
                }
            }
        ]
    }
    return modal
}

let getReviewThankYouNoteModal = function(feedbackReqId){
    let modal = {
        "type": "modal",
        "callback_id": "review_feedback_thank_you_note",
        "notify_on_close": true,
        "private_metadata": JSON.stringify({feedbackReqId: feedbackReqId}),
        "title": {
            "type": "plain_text",
            "text": "Thank the Respondents",
            "emoji": true
        },
        "close": {
            "type": "plain_text",
            "text": "Close",
            "emoji": true
        },
        "submit": {
            "type": "plain_text",
            "text": "Send",
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
                        "text": "Enter your message",
                        "emoji": true
                    },
                    "action_id": "thank_you_note",
                    "initial_value": "Hey, thank your for your feedback. It was super helpful! I will be more mindful of what you shared moving forward 🙂"
                },
                "label": {
                    "type": "plain_text",
                    "text": "Thank You Note:",
                    "emoji": true
                },
                "block_id": "thank_you_note"
            }
        ]
    }
    return modal
}


let getSeekClarificationModal = function(responses, feedbackReq, privateMetadata){
    let getResponseBlock = function(qindex, questionText, responses){
        let blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text":  `${qindex}. ${questionText}`
                }
            }
        ]
        let pmr = 0
        let multiplyFactor = Object.keys(responses).length
        for(section in responses){
            let title = "Peers, Managers and Reportees"
            let array = responses.all
            if(section === 'peers'){
                title = 'Peers'
                array = responses.peers
            } else if(section === 'managers'){
                title = 'Managers'
                array = responses.managers
            } else if(section === 'reportees'){
                title = 'Reportees'
                array = responses.reportees
            } else if (section === 'others'){
                if(Object.keys(responses).includes('peers'))
                    title = "Managers and Reportees"
                else if(Object.keys(responses).includes('managers'))
                    title = "Peers and Reportees"
                else
                    title = "Reportees and Managers"
                array = responses.others
            } else if (section === 'self'){
                continue
            }
            blocks.push({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": title+":"
                }
            })
            array = _.shuffle(array)
            array.forEach((response, index) =>  {
                let emojiIndex = (qindex - 1) * multiplyFactor + pmr + index
                let block = {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `>${Utils.getAnonymousEmoji(emojiIndex)}: ${response.responseText.replace(/\n/g, '\n>')}`
                    }
                }
                response.replies.forEach((x, i) => {
                    if(i % 2 === 0)
                        block.text.text += `\n>*You:* ${x.replace(/\n/g, '\n>')}`
                    else
                        block.text.text += `\n>${Utils.getAnonymousEmoji(emojiIndex)}: ${x.replace(/\n/g, '\n>')}`
                })
                if(response.replies.length % 2 === 0){
                    block.accessory = {
                        "type": "button",
                        "style": "primary",
                        "text": {
                            "type": "plain_text",
                            "emoji": true,
                            "text": "Select"
                        },
                        "value": response.id,
                        "action_id": "seek_clarification.seek"
                    }
                }
                blocks.push(block)
            })
            pmr++
        }
        blocks.push({
            "type": "divider"
        })
        return blocks
    }
    let modal = {
        "type": "modal",
        "callback_id": "seek_clarification",
        "notify_on_close": true,
        "private_metadata": JSON.stringify(privateMetadata),
        "title": {
            "type": "plain_text",
            "text": "Respond to Feedback",
            "emoji": true
        },
        "close": {
            "type": "plain_text",
            "text": "Back",
            "emoji": true
        },
        "blocks": []
    }
    var questionNumber = 1
    for(x in responses){
        let blocks = getResponseBlock(questionNumber, x, responses[x])
        modal.blocks.push(...blocks)
        questionNumber++
    }
    return modal
}

let getQuestionSeekClarificationModal = function(response, privateMetadata){
    privateMetadata.responseId = response.id
    let replies = ''
    if(response.replies && response.replies.length > 0)
        response.replies.forEach((x,i) =>{
            if(i % 2 === 0)
                replies += `\nYou: ${x}`
            else
                replies += `\nRespondent: ${x}`
        })
    let modal = {
        "type": "modal",
        "callback_id": "seek_clarification_question",
        "notify_on_close": true,
        "private_metadata": JSON.stringify(privateMetadata),
        "title": {
            "type": "plain_text",
            "text": "Respond to Feedback",
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
                        "text": "Enter your question / comment"
                    },
                    "action_id": "seek_clarification_question.question"
                },
                "label": {
                    "type": "plain_text",
                    "text": "Please enter the question you have / comment you want to share:",
                    "emoji": true
                },
                "block_id": "seek_clarification_question.question"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `\`\`\`Q. ${response.questionText}\nA. ${response.responseText}${replies}\`\`\``
                }
            }
        ]
    }
    return modal
}

let getClarificationAnswerModal = function(response){
    let replies = ''
    if(response.replies && response.replies.length > 0)
        response.replies.forEach((x,i) =>{
            if(i % 2 === 0)
                replies += `\n${response.feedbackId.userId.slackDisplayName}: ${x}`
            else
                replies += `\nYou: ${x}`
        })
    let modal = {
        "type": "modal",
        "callback_id": "seek_clarification_answer",
        "notify_on_close": true,
        "private_metadata": JSON.stringify({responseId: response.id}),
        "title": {
            "type": "plain_text",
            "text": "Respond to Comment",
            "emoji": true
        },
        "submit": {
            "type": "plain_text",
            "text": "Send",
            "emoji": true
        },
        "close": {
            "type": "plain_text",
            "text": "Close",
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
                        "text": "Enter your response"
                    },
                    "action_id": "seek_clarification_answer.answer"
                },
                "label": {
                    "type": "plain_text",
                    "text": `Please enter the comment you want to share:`,
                    "emoji": true
                },
                "block_id": "seek_clarification_answer.answer"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `\`\`\`Q. ${response.questionText}\nA. ${response.responseText}${replies}\`\`\``
                }
            }
        ]
    }
    return modal
}


let getClarificationQuestionMessage = function(response){
    let comments = ''
    response.replies.slice(-2).forEach((x,i) => {
        comments += `\n>${((response.replies.length - i) % 2 === 0) ? `${response.feedbackId.userId.slackDisplayName}:` : 'You:'} ${x.replace(/\n/g, '\n>')}`
    })
    let message = {
        "text": `Hey, ${response.feedbackId.userId.slackDisplayName} has commented on the feedback you shared. You can respond by tapping the button below; your identify will still be anonymous to ${response.feedbackId.userId.slackDisplayName}.`,
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `Hey, ${response.feedbackId.userId.slackDisplayName} has commented on the feedback you shared. You can respond by tapping the button below; *your identify will still be anonymous* to ${response.feedbackId.userId.slackDisplayName}.`
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `>Comments:\n>${comments}\n> \`\`\`Q. ${response.questionText}\nA. ${response.responseText}\`\`\``
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
                            "text": "Respond!"
                        },
                        "value": response.id,
                        "action_id": "seek_clarification_message.respond"
                    }
                ]
            }
        ]
    }
    return message
}

let getClarificationQuestionSentMessage = function(response){
    let comments = ''
    response.replies.slice(-2).forEach((x,i) => {
        comments += `\n>${((response.replies.length - i) % 2 === 0) ? `You:` : 'Respondent:'} ${x.replace(/\n/g, '\n>')}`
    })
    return {
        "text": `Your comment has been sent successfully. We will notify you here once you receive a response!`,
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*Your comment has been sent successfully.* We will notify you here once you receive a response!`
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text":`>*Comments:*${comments}\n> \`\`\`Q. ${response.questionText}\nA. ${response.responseText}\`\`\``
                }
            }
        ]
    }
}

let getClarificationAnswerSentMessage = function(response){
    let comments = ''
    response.replies.slice(-2).forEach((x,i) => {
        comments += `\n>${((response.replies.length - i) % 2 === 0) ? `${response.feedbackId.userId.slackDisplayName}:` : 'You:'} ${x.replace(/\n/g, '\n>')}`
    })
    return {
        "text": `Your response has been sent to ${response.feedbackId.userId.slackDisplayName} anonymously.`,
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `Your response has been *sent to ${response.feedbackId.userId.slackDisplayName} anonymously.*`
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `>*Comments:*${comments}\n>\`\`\`\nQ. ${response.questionText}\nA. ${response.responseText}\`\`\``
                }
            }
        ]
    }
}

let getClarificationAnswerReceivedMessage = function(response){
    let comments = ''
    response.replies.slice(-2).forEach((x,i) => {
        comments += `\n>${((response.replies.length - i) % 2 === 0) ? `You:` : 'Respondent:'} ${x.replace(/\n/g, '\n>')}`
    })
    return {
        "text": `You've received a response to your comment!`,
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*You've received a response* to your comment!"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `>*Comments:* ${comments}\n>\`\`\`\nQ. ${response.questionText.replace(/\n/g, '\n>')}\nA. ${response.responseText.replace(/\n/g, '\n>')}\`\`\``
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "emoji": true,
                            "text": "Review Feedback"
                        },
                        "value": response.feedbackId.id,
                        "action_id": "clarification_received_message.view_feedback"
                    }
                ]
            }
        ]
    }
}

let getThankYouMessage = function(user, note){
    return {
        "text": `You've received a message from ${user.slackDisplayName}!`,
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*Message from <@${user.slackId}>:*`
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": note
                }
            }
        ]
    }
}

let getThankYouSentMessage = function(note){
    return {
        "text": `Your thank you note was sent to all those who responded!`,
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `Your thank you note was sent to all those who responded!`
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Your note:*\n"+note
                }
            }
        ]
    }
}

let showReviewNotReadyModal = async function(bot, message){
    let feedbackReqId = message.actions[0].value
    let feedbackRequestActivity = await feedbackReqActivityController.getSelfAssessmentActivity(feedbackReqId)
    let modalView = getReviewNotReadyModal(feedbackRequestActivity)
    if (message.actions[0].action_id !== 'past_feedback_view.not_ready_view'){
        let postData = { 
            token: bot.api.token,
            trigger_id: message.incoming_message.channelData.trigger_id,
            view: modalView
        }
        await bot.api.views.open(postData)
    } else {
        let postData = { 
            token: bot.api.token,
            trigger_id: message.incoming_message.channelData.trigger_id,
            view: modalView
        }
        await bot.api.views.push(postData)
    }
}

let showReviewModal = async function(bot, message, type){
    let feedbackReqId = message.actions[0].value
    let result = await responseController.getResponsesForRequest(feedbackReqId)
    if(!result.feedbackRequest)
        return
    let modalView = getReviewModal(result.responses, result.feedbackRequest, type)
    let postData = { 
        token: bot.api.token,
        trigger_id: message.incoming_message.channelData.trigger_id,
        view: modalView
    }
    await bot.api.views.open(postData)
    let team = await teamController.getTeamBySlackId(message.internal_user.slackTeamId)
    slackService.postRequestReviewedMessage(team.slackWorkspaceName, message.internal_user.slackDisplayName, message.internal_user.slackTimezoneName, team.numberOfUsers, result.feedbackRequest.responsesReceived, result.feedbackRequest.totalResponses)
}

let showReviewNextModal = async function(bot, message){
    let privateMetadata = JSON.parse(message.view.private_metadata)
    let feedbackReqId = privateMetadata.feedbackReqId
    let sentThankYouNote = privateMetadata.sentThankYouNote
    let modalView = getReviewNextModal(feedbackReqId, sentThankYouNote)
    bot.httpBody({
        response_action: 'push',
        view: modalView
    })
    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REVIEW_FEEDBACK_SUBMIT, message.internal_user)
}

let showReviewThankYouNoteModal = async function(bot, message){
    let privateMetadata = JSON.parse(message.view.private_metadata)
    let feedbackReqId = privateMetadata.feedbackReqId
    let modalView = getReviewThankYouNoteModal(feedbackReqId)
    let postData = { 
        token: bot.api.token,
        trigger_id: message.incoming_message.channelData.trigger_id,
        view: modalView
    }
    await bot.api.views.push(postData)
    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.THANK_EDIT_NOTE, message.internal_user)
}

let processReviewThankYouNoteModal = async function(bot, message){
    let messageStateValues = message.view.state.values
    let privateMetadata = JSON.parse(message.view.private_metadata)
    let feedbackReqId = privateMetadata.feedbackReqId
    let note = messageStateValues["thank_you_note"]["thank_you_note"].value
    bot.httpBody({
        "response_action": "clear"
    })
    let feedbackRequest = await feedbackRequestController.setThankYouMessage(feedbackReqId, note)
    let completeList = feedbackRequest.peersList.concat(feedbackRequest.managersList).concat(feedbackRequest.reporteesList)
    completeList.forEach( async (userFor) => {
        let viewMessage = getThankYouMessage(feedbackRequest.userId, note)
        await bot.startPrivateConversation(userFor.slackId)
        await bot.say(viewMessage)
    })
    let viewMessage = getThankYouSentMessage(note)
    await bot.startPrivateConversation(feedbackRequest.userId.slackId)
    await bot.say(viewMessage)
    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.THANK_NOTE_SEND, message.internal_user)
}

let showPastFeedbackReviewModal = async function(bot, message){
    let feedbackReqId = message.actions[0].value
    let result = await responseController.getResponsesForRequest(feedbackReqId)
    let modalView = getReviewModal(result.responses, result.feedbackRequest, 'past')
    let postData = { 
        token: bot.api.token,
        trigger_id: message.incoming_message.channelData.trigger_id,
        view: modalView
    }
    await bot.api.views.push(postData)
}

let showSeekClarificationModal = async function(bot, message){
    let privateMetadata = JSON.parse(message.view.private_metadata)
    let feedbackReqId = message.actions[0].value 
    let result = await responseController.getResponsesForRequest(feedbackReqId)
    let modalView = getSeekClarificationModal(result.responses, result.feedbackRequest, privateMetadata)
    let postData = { 
        token: bot.api.token,
        view_id: message.view.id,
        hash: message.view.hash,
        view: modalView
    }
    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.REVIEW_FEEDBACK_SEEK_CLARIFICATION, message.internal_user)
    await bot.api.views.update(postData)
}

let showQuestionSeekClarificationModal = async function(bot, message){
    let privateMetadata = JSON.parse(message.view.private_metadata)
    let responseId = message.actions[0].value 
    let response = await responseController.getResponseById(responseId)
    let modalView = getQuestionSeekClarificationModal(response, privateMetadata)
    let postData = { 
        token: bot.api.token,
        view_id: message.view.id,
        hash: message.view.hash,
        view: modalView
    }
    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.SEEK_CLARIFICATION_QUESTION_BACK, message.internal_user)
    await bot.api.views.update(postData)
}

let processQuestionSeekClarificationModal = async function(bot, message){
    bot.httpBody({
        "response_action": "clear"
    })
    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.SEEK_CLARIFICATION_QUESTION_SUBMIT, message.internal_user)
    let messageStateValues = message.view.state.values
    let privateMetadata = JSON.parse(message.view.private_metadata)
    let question = messageStateValues['seek_clarification_question.question']['seek_clarification_question.question'].value
    let responseId = privateMetadata.responseId
    let response = await responseController.setClarificationQuestion(responseId, question)
    await feedbackReqActivityController.setStatusClarification(response.feedbackId.id, response.responseById.id, false)
    let messageView = getClarificationQuestionMessage(response)
    let scheduledTime = Utils.randomScheduledTime()
    await messageController.addMessage(response.responseById.id, Constants.MESSAGE_TYPE.CLARIFICATION_MESSAGE_SCHEDULED, response.id, {}, messageView, scheduledTime)
    let selfMessage = getClarificationQuestionSentMessage(response)
    await bot.startPrivateConversation(message.user)
    await bot.say(selfMessage)
    if(privateMetadata.type === 'home')
        appHomeView.showAppHome(bot, message, '', "✅ Comment sent successfully")
    //open review modal
    let feedbackReqId = response.feedbackId.id
    let result = await responseController.getResponsesForRequest(feedbackReqId)
    let modalView = getReviewModal(result.responses, result.feedbackRequest, "home", "✅ Comment sent successfully")
    let postData = { 
        token: bot.api.token,
        trigger_id: message.incoming_message.channelData.trigger_id,
        view: modalView
    }
    await bot.api.views.open(postData)
}

let showAnswerSeekClarificationModal = async function(bot, message){
    let feedbackReqId = message.actions[0].value 
    let response = await responseController.getResponseById(feedbackReqId)
    console.log(response)
    let modalView = getClarificationAnswerModal(response)
    let postData = { 
        token: bot.api.token,
        trigger_id: message.incoming_message.channelData.trigger_id,
        view: modalView
    }
    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.HOME_ANSWER_CLARIFICATION, message.internal_user)
    await bot.api.views.open(postData)
}

let processAnswerSeekClarificationModal = async function(bot, message){
    let messageStateValues = message.view.state.values
    let privateMetadata = JSON.parse(message.view.private_metadata)
    let responseId = privateMetadata.responseId
    let answer = messageStateValues['seek_clarification_answer.answer']['seek_clarification_answer.answer'].value
    let response = await responseController.setClarificationAnswer(responseId, answer)
    await feedbackReqActivityController.setStatusClarification(response.feedbackId.id, response.responseById.id, true)
    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.RESPOND_TO_CLARIFICATION_SUBMIT, message.internal_user)
    let selfMessage = getClarificationAnswerSentMessage(response)
    await bot.startPrivateConversation(message.user)
    await bot.say(selfMessage)
    let clarificationReceivedMessage = getClarificationAnswerReceivedMessage(response)
    let schedultedTime = Utils.randomScheduledTime()
    await messageController.addMessage(response.feedbackId.userId.id, Constants.MESSAGE_TYPE.RESPOND_TO_CLARIFICATION_MESSAGE_SCHEDULED, response.id, {}, clarificationReceivedMessage, schedultedTime)
    let clarificationMessage = await messageController.getMessage(response.responseById.id, Constants.MESSAGE_TYPE.CLARIFICATION_MESSAGE, response.id)
    if(clarificationMessage){
        clarificationMessage.view.blocks.splice(2, 1, {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "✅ Response sent successfully"
            }
        })
        let data = {
            token: bot.api.token,
            ts: clarificationMessage.data.activityId,
            channel: clarificationMessage.data.conversation.id,
            text: "✅ Response sent successfully",
            blocks: clarificationMessage.view.blocks
        }
        await bot.api.chat.update(data)
        await messageController.removeMessage(clarificationMessage.userId, clarificationMessage.type, clarificationMessage.refId)
    }
    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.RECEIVED_MESSAGE_CLARIFICATION_ANSWER_RECEIVED, response.feedbackId.userId)
    appHomeView.showAppHome(bot, message)
}

module.exports = {
    showReviewModal,
    showReviewNextModal,
    showPastFeedbackReviewModal,
    showSeekClarificationModal,
    showQuestionSeekClarificationModal,
    processQuestionSeekClarificationModal,
    showAnswerSeekClarificationModal,
    processAnswerSeekClarificationModal,
    showReviewNotReadyModal,
    getReviewNotReadyModal,
    showReviewThankYouNoteModal,
    processReviewThankYouNoteModal
}