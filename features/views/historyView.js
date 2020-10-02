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

const feedbackRequestController = require("../../src/controllers/feedbackRequestController")
const Utils = require("../../src/Utils")
const Constants = require("../../src/Constants")

let getPastFeedbackModalView = function(feedbackRequests){
    if(feedbackRequests.length === 0){
        return {
            "type": "modal",
            "title": {
                "type": "plain_text",
                "text": "My Feedback Journal 📘",
                "emoji": true
            },
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
                        "text": "Much empty!"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "But this could be the kind of insightful feedback you receive. Get started now!"
                    },
                    "accessory": {
                        "type": "button",
                        "style": "primary",
                        "text": {
                            "type": "plain_text",
                            "emoji": true,
                            "text": "Seek Feedback 🚀"
                        },
                        "action_id": "app_home.start",
                        "value": "app_home.start_update"
                    }
                },
                {
                    "type": "image",
                    "image_url": `${Constants.WEBSITE_HOST}/images/feedback_journal.png`,
                    "alt_text": "Feedback Journal"
                }
            ]
        }
    }
    let getPastFeedbackView = function(feedbacReq){
        let questions = ''
        feedbacReq.questionsList.forEach((q,i) =>{
            questions +=  `\n${i+1}. ${q}`
        })
        let participants = ''
        let completeList = feedbacReq.reporteesList.concat(feedbacReq.managersList).concat(feedbacReq.peersList)
        completeList.forEach(p => {
            participants += `<@${p.slackId}>`
        })
        let action
        if (feedbacReq.responsesReceived >= 2){
            action = {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": `👀 ${Utils.formatDate(feedbacReq.requestTimestamp, feedbacReq.userId.slackTimezoneOffset)}`,
                            "emoji": true
                        },
                        "action_id": "past_feedback_view.view",
                        "value": feedbacReq.id
                    }
                ]
            }
        } else {
            action = {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": `👀 ${Utils.formatDate(feedbacReq.requestTimestamp, feedbacReq.userId.slackTimezoneOffset)}`,
                            "emoji": true
                        },
                        "action_id": "past_feedback_view.not_ready_view",
                        "value": feedbacReq.id
                    }
                ]
            }
        }
        return [
            action,
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*Questions:*\n${questions}\n\n*Feedback participants:*\n ${participants}`
                }
            },
            {
                "type": "divider"
            }
        ]
    }
    let blocks = []
    feedbackRequests.forEach((feedbackReq)=>{
        blocks.push(...getPastFeedbackView(feedbackReq))
    })
    blocks.splice(blocks.length-1, 1)
    let modal = {
        "type": "modal",
        "title": {
            "type": "plain_text",
            "text": "My Feedback Journal 📘",
            "emoji": true
        },
        "close": {
            "type": "plain_text",
            "text": "Close",
            "emoji": true
        },
        "blocks": blocks
    }
    return modal
}


let showPastFeedbackModal = async function(bot, message){
    let feedbackRequests = await feedbackRequestController.getConcludedRequests(message.internal_user.id)
    console.log(feedbackRequests)
    let modalView = getPastFeedbackModalView(feedbackRequests)
    let postData = { 
        token: bot.api.token,
        trigger_id: message.incoming_message.channelData.trigger_id,
        view: modalView
    }
    await bot.api.views.open(postData)
}


module.exports = {
    showPastFeedbackModal
}