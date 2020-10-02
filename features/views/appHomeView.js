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

const userController = require('../../src/controllers/userController')
const teamController = require('../../src/controllers/teamController')
const feedbackReqActController = require('../../src/controllers/feedbackReqActivityController')
const Constants = require('../../src/Constants')
const Utils = require('../../src/Utils')
const feedbackReqActivityController = require('../../src/controllers/feedbackReqActivityController')
const amplitudeService = require('../../src/services/amplitudeService')
const messageView = require('./messageView')
const messageController = require('../../src/controllers/messageController')
const feedbackRequestController = require('../../src/controllers/feedbackRequestController')
const slackService = require('../../src/services/slackService')
const reviewModalView = require('./reviewModalView')
const needle = require('needle')

let getHomeContent = function(name, user, pendingActions, responses, feedbackRequests, lastFeedbackRequest, hideReminders, showMessage, showMessageAccessory, recentUsers){

    let isShowingQuote = false
    let randomImage = `${Constants.WEBSITE_HOST}images/quotes/home/${Math.floor(Math.random() * 3)+1}.png`
    if(!user){
        return {
            "type": "home",
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `Hey ${name}!\nWelcome to 360Katas.`
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "*Hit the 🚀 Start* button below to seek feedback from your team!"
                    },
                    "accessory": {
                        "type": "button",
                        "style": "primary",
                        "text": {
                            "type": "plain_text",
                            "text": "🚀 Start"
                        },
                        "value": "app_home.start",
                        "action_id": "app_home.start"
                    }
                },
                {
                    "type": "divider"
                },
                {
                    "type": "image",
                    "image_url": randomImage,
                    "alt_text": "quotes"
                },
                {
                    "type": "divider"
                },
                {
                    "type": "actions",
                    "elements": [
                                {
                                    "type": "button",
                                    "text": {
                                        "type": "plain_text",
                                        "emoji": true,
                                        "text": "📘 My Feedback Journal"
                                    },
                                    "action_id": "app_home.past_feedback",
                                    "value": "app_home.past_feedback"
                                },
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "ℹ️ Live Chat",
                                "emoji": true
                            },
                            "url": `https://360katas.com/faqs?uid=dschqoij23099jcnksdncio1enf1oilksdcn1oi3neon`
                        }
                    ]
                }
            ]
        }
    }
    let recentUsersBlock = {
        "type": "context",
        "elements": [
            {
                "type": "mrkdwn",
                "text": `*Feedback lovers @ ${user.teamId.slackWorkspaceName}:*`
            }
        ]
    }
    recentUsers.forEach(user => {
        recentUsersBlock.elements.push({
            "type": "image",
            "image_url": user.slackProfileImage === '' ? 'https://i0.wp.com/a.slack-edge.com/df10d/img/avatars/ava_0018-512.png?ssl=1' : user.slackProfileImage,
            "alt_text": user.slackDisplayName
        })
    })
    if(user.teamId.numberOfUsers > 5)
        recentUsersBlock.elements.push({
            "type": "mrkdwn",
            "text": `+ ${user.teamId.numberOfUsers - 5} Other${ user.teamId.numberOfUsers === 6 ? '' : 's'}`
        })
    let getYourOngoingFeeback = function(feedbackReqAct, number){
        let hideReminder = hideReminders === feedbackReqAct.feedbackRequest.id 
        let days = Math.floor((feedbackReqAct.feedbackRequest.closeReqTimestamp - Date.now())/Constants.TIME.ONE_DAY)
        let hours 
        if (days === 0){
            hours = Math.floor((feedbackReqAct.feedbackRequest.closeReqTimestamp - Date.now())/Constants.TIME.ONE_HOUR)
        }
        let feedbackReqParticipants = feedbackReqAct.feedbackRequest.peersList.concat(feedbackReqAct.feedbackRequest.managersList).concat(feedbackReqAct.feedbackRequest.reporteesList)
        let status = `*${number}. Created on ${Utils.formatDate(feedbackReqAct.feedbackRequest.requestTimestamp, user.slackTimezoneOffset)}*\n`
        status += (feedbackReqAct.feedbackRequest.status === Constants.FEEDBACK_REQ_STATUS.ONGOING) ? `Due on ${Utils.formatDate(feedbackReqAct.feedbackRequest.closeReqTimestamp, user.slackTimezoneOffset)}, ${(days === 0) ? `in ${hours} Hours` : `in ${days} Days`}` : (feedbackReqAct.feedbackRequest.responsesReceived < 2) ? `Discarded on ${Utils.formatDate(feedbackReqAct.feedbackRequest.closeReqTimestamp, user.slackTimezoneOffset)} as we didn't receive enough responses 😞` : `Completed on ${Utils.formatDate(feedbackReqAct.feedbackRequest.closeReqTimestamp, user.slackTimezoneOffset)} 🎉`
        let responsesReceivedText = 'Participants: ' + feedbackReqParticipants.map(u => `<@${u.slackId}>`).join(', ') + `\nResponses: ${feedbackReqAct.feedbackRequest.responsesReceived} / ${feedbackReqAct.feedbackRequest.totalResponses}`
        let accessory = {
            "type": "button",
            "text": {
                "type": "plain_text",
                "text": "Review"
            },
            "value": feedbackReqAct.feedbackRequest.id ,
            "action_id": "app_home.review_not_ready"
        }
        if(feedbackReqAct.feedbackRequest.remindersSent && feedbackReqAct.feedbackRequest.remindersSent.length > 0){
            let remindersList = []
            feedbackReqAct.feedbackRequest.remindersSent.reverse().slice(0, 10).forEach((reminderTimestamp) => {
                remindersList.push(Utils.formatDate(reminderTimestamp, user.slackTimezoneOffset))
            })
            if (remindersList.length > 0){
                if (feedbackReqAct.feedbackRequest.remindersSent.length > 10) {
                    remindersList.push('...')
                }
                responsesReceivedText = `${responsesReceivedText} | ${hideReminder ? '✅ ' : ''}Reminders sent on ${remindersList.join(", ")}`
            }
        }
        let secondBlock 
        if (feedbackReqAct.status === Constants.FEEDBACK_REQ_STATUS.ONGOING) {
            if(feedbackReqAct.feedbackRequest.status !== Constants.FEEDBACK_REQ_STATUS.ONGOING){
                status = status.concat('\n`Complete Self-Assessment` to view the received feedback ⚠️')
            }
            else {
                status = status.concat('\nSelf-Assessment not completed ⚠️')
            }
            status += '\n'+responsesReceivedText
            secondBlock = {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": status
                },
                "block_id": "app_home.latest_feedback"+feedbackReqAct.feedbackRequest.id,
            }
            secondBlock.accessory = accessory
        }
        else if (feedbackReqAct.feedbackRequest.status === Constants.FEEDBACK_REQ_STATUS.ONGOING){
            status += '\n'+responsesReceivedText
            secondBlock = {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": status
                },
                "block_id": "app_home.latest_feedback"+feedbackReqAct.feedbackRequest.id,
            }
            secondBlock.accessory = accessory
        } else{
            status += '\n'+responsesReceivedText 
            secondBlock = {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": status
                }
            }
            accessory = {
                "type": "button",
                "style": "primary",
                "text": {
                    "type": "plain_text",
                    "emoji": true,
                    "text": "Review"
                },
                "value": feedbackReqAct.feedbackRequest.id,
                "action_id": "app_home.review"
            }
            if(feedbackReqAct.feedbackRequest.responsesReceived >= 2)
                secondBlock.accessory = accessory
            else
                secondBlock.accessory =  {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Review"
                    },
                    "value": feedbackReqAct.feedbackRequest.id ,
                    "action_id": "app_home.review_not_ready"
                }
        }

        let blocks = [
            secondBlock
        ]
        
        return blocks
    }
    let getUpcomingFeedbackRequest = function(feedbackReqAct, number){
        let feedbackReqParticipants = feedbackReqAct.feedbackRequest.autoRepeatMetadata.peersList.concat(feedbackReqAct.feedbackRequest.autoRepeatMetadata.managersList).concat(feedbackReqAct.feedbackRequest.autoRepeatMetadata.reporteesList)
        let fourthBlock = {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": `${number}. ${feedbackReqAct.feedbackRequest.autoRepeat ? 'Scheduled for: '+Utils.formatDate(feedbackReqAct.feedbackRequest.autoRepeat, user.slackTimezoneOffset)+', ' : ''}_Repeat ${feedbackReqAct.feedbackRequest.autoRepeat ?  "every "+feedbackReqAct.feedbackRequest.autoRepeatName : "not set up!"}_${feedbackReqParticipants ? '\nParticipants: ' + feedbackReqParticipants.map(u => `<@${u.slackId}>`).join(', ') : ''}`
            }
        }
        
        if(feedbackReqAct.feedbackRequest.autoRepeat){
            fourthBlock.accessory = {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "emoji": true,
                    "text": "👀 View"
                },
                "value": feedbackReqAct.feedbackRequest.id,
                "action_id": "app_home.open_edit_autorepeat"
            }
        }
        let blocks = [
            fourthBlock
        ]
        return blocks
    }
    let getPendingFeedbackReqBlock = function(feedbackRequest, actionNumber, user){
        let questions = ""
        feedbackRequest.questionsList.forEach((question) => {
            questions += `>• ${question.replace(/\n/g, '\n>')}\n`
        })
        let time = Utils.formatDate(feedbackRequest.closeReqTimestamp, user.slackTimezoneOffset)
        let days = Math.floor((feedbackRequest.closeReqTimestamp - Date.now())/Constants.TIME.ONE_DAY)
        let hours = Math.floor((feedbackRequest.closeReqTimestamp - Date.now())/Constants.TIME.ONE_HOUR)
        let timeStatus
        if (days < 1)
            timeStatus = `\`expiring in ${hours} hours\``
        else if(days < 3)
            timeStatus = `\`expiring in ${days} days\``
        else 
            timeStatus = `in ${days} days`
        return {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `*${actionNumber}. Feedback Request from ${feedbackRequest.userId.slackDisplayName}*\n>*Questions:*\n${questions}\nLast Date: ${time}, ${timeStatus}. _Takes only 2 minutes!_`
            },
            "accessory": {
                "type": "button",
                "style": "primary",
                "text": {
                    "type": "plain_text",
                    "emoji": true,
                    "text": "🔆 Answer"
                },
                "action_id": "app_home.start_respond",
                "value": feedbackRequest.id
            }
        }
    }
    let getPendingClarificationBlock = function(feedbackRequest, response, actionNumber){
        return [{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": `*${actionNumber}. ${feedbackRequest.userId.slackDisplayName} has commented on the feedback you shared*`
			},
			"accessory": {
				"type": "button",
				"style": "primary",
				"text": {
					"type": "plain_text",
					"emoji": true,
					"text": "👀 View"
				},
                "value": response.id,
                "action_id": "app_home.clarification_respond"
			}
		},
		{
			"type": "context",
			"elements": [
				{
					"type": "mrkdwn",
					"text": `*Note:* You can choose to reply to this comment and your reply will be kept anonymous, like the original answer`
				}
			]
		}]
    }
    let modal = {
        "type": "home",
        "blocks": [
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "emoji": true,
                            "text": "📘 My Feedback Journal"
                        },
                        "action_id": "app_home.past_feedback",
                        "value": "app_home.past_feedback"
                    },
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "ℹ️ Live Chat",
                            "emoji": true
                        },
                        "url": `https://360katas.com/faqs?uid=dschqoij23099jcnksdncio1enf1oilksdcn1oi3neon`
                    }
                ]
            }
        ]
    }
    if(user.teamId.teamTree){
        let element = {
            "type": "button",
            "text": {
                "type": "plain_text",
                "text": `🌱 ${user.teamId.slackWorkspaceName}'${user.teamId.slackWorkspaceName.slice(-1) === 's' ? '' : 's'} Tree`,
                "emoji": true
            },
            "value": "app_home.open_tree_modal",
            "action_id": "app_home.open_tree_modal"
        }
        modal.blocks[0].elements.splice(1, 0, element)
    }
    let onboarding = []
    if(user && !user.isOnboardingDone){
        if(feedbackRequests.length === 0){
            onboarding.push({
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `Hey ${name}!\nWelcome to 360Katas.`
                        }
            })
            onboarding.push({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Hit the Start 🚀* button to seek feedback from your team!"
                },
                "accessory": {
                    "type": "button",
                    "style": "primary",
                    "text": {
                        "type": "plain_text",
                        "text": "Start 🚀"
                    },
                    "value": "app_home.start",
                    "action_id": "app_home.start"
                }
            })
            onboarding.push(recentUsersBlock)
            onboarding.push(...[
                {
                    "type": "divider"
                },
                {
                    "type": "image",
                    "image_url": randomImage,
                    "alt_text": "inspiration"
                },
                {
                    "type": "divider"
                }
            ])
        } else if(feedbackRequests[0].status === Constants.FEEDBACK_REQ_STATUS.ONGOING){
            onboarding.push({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `Congratulations ${name} 🎉\n\nYour feedback request has been sent. You will be able to view the responses *once all participants reply or on the due date (1 week from now)*, whichever is earlier.` 
                }
            })
            onboarding.push({
                "type": "divider"
            })
            onboarding.push({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Next Up:* Complete your self-assessment\n\nMany of our users have found it valuable to compare their feedback responses with self-assessment. This is a *mandatory step* for you to view others' responses."
                },
                "accessory": {
                    "type": "button",
                    "style": "primary",
                    "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "✍️ Self-Assess"
                    },
                    "value": "app_home.self_assessment",
                    "action_id": "app_home.self_assessment"
                }
            })
            onboarding.push({
			"type": "context",
			"elements": [
                    {
                        "type": "mrkdwn",
                        "text": "*Note:* Self-Assessment response is visible only to you"
                    }
			    ]
		    })
            onboarding.push({
                "type": "divider"
            })
        } 
    } else if(feedbackRequests.length > 0){
        onboarding.push(...[
            {
            	"type": "header",
			    "text": {
                    "type": "plain_text",
                    "text": "Your feedback",
                    "emoji": true
			    }
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "⚡ *Latest Feedback*"
                }
            }
        ])
        feedbackRequests.forEach( (feedbackRequestAct, index) => {
            onboarding.push(...getYourOngoingFeeback(feedbackRequestAct, index+1))
        })
        onboarding.push(...[{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": " "
			}
        },
        {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "⏰ *Upcoming Feedback*"
			}
        }])
        let autoRepeatRequests = feedbackRequests.filter(x => x.feedbackRequest.autoRepeat)
        if(autoRepeatRequests.length > 0)
            autoRepeatRequests.forEach( (feedbackRequestAct, index) => {
                onboarding.push(...getUpcomingFeedbackRequest(feedbackRequestAct, index+1))
            })
        else
            onboarding.push(...[
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "_Repeat not set up!_"
                    }
                }
            ])
        onboarding.push(...[
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "✨ *Fresh feedback*"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Create a new feedback request"
                },
                "accessory": {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "🚀 Start"
                    },
                    "action_id": "app_home.start",
                    "value": "app_home.start"
                }
            }
        ])

        if(feedbackRequests.filter(x => x.feedbackRequest.status !== Constants.FEEDBACK_REQ_STATUS.SUBMITTED).length === 0){
            onboarding.push(...[
                {
                    "type": "divider"
                },
                {
                    "type": "image",
                    "image_url": randomImage,
                    "alt_text": "inspiration"
                },
                {
                    "type": "divider"
                }
            ])
            isShowingQuote = true
        } else {
            onboarding.push(...[
                {
                    "type": "divider"
                }
            ])
        }
    } else {
        onboarding.push(...[
            {
            	"type": "header",
			    "text": {
                    "type": "plain_text",
                    "text": "Your feedback",
                    "emoji": true
			    }
            },
            {
                "type": "divider"
            }
        ])
        onboarding.push({
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "⏰ *Upcoming Feedback*"
			}
        })
        let autoRepeatRequests = feedbackRequests.filter(x => x.feedbackRequest.autoRepeat)
        if(autoRepeatRequests.length > 0)
            autoRepeatRequests.forEach( (feedbackRequestAct, index) => {
                onboarding.push(...getUpcomingFeedbackRequest(feedbackRequestAct, index+1))
            })
        else
            onboarding.push(...[
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "_Repeat not set up!_"
                    }
                }
            ])
        onboarding.push(...[
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "✨ *Fresh feedback*"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Create a new feedback request"
                },
                "accessory": {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "🚀 Start"
                    },
                    "action_id": "app_home.start",
                    "value": "app_home.start"
                }
            }
        ])
            onboarding.push(...[
                {
                    "type": "divider"
                },
                {
                    "type": "image",
                    "image_url": randomImage,
                    "alt_text": "inspiration"
                },
                {
                    "type": "divider"
                }
            ])
            isShowingQuote = true
    }
    if(user && user.isOnboardingDone){
        onboarding.push(recentUsersBlock)
    }
    let pendingActionsBlocks = []
    if(pendingActions && pendingActions.length !== 0){
        let actionNumber = 1
        for (let a in pendingActions) {
            if(actionNumber!==1){
                pendingActionsBlocks.push({
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": " "
                    }
                })
            }
            let action = pendingActions[a]
            if(action.isSelfAssessment !== true && action.feedbackRequest.status === Constants.FEEDBACK_REQ_STATUS.ONGOING){
                pendingActionsBlocks.push(getPendingFeedbackReqBlock(action.feedbackRequest, actionNumber, user))
            } else if (action.status === Constants.FEEDBACK_REQ_STATUS.CLARIFICATION){
                let feedbackReqResponses = responses.filter(x => x.feedbackId === action.feedbackRequest.id)
                feedbackReqResponses.forEach(response => {
                    pendingActionsBlocks.push(...getPendingClarificationBlock(action.feedbackRequest, response, actionNumber))
                    actionNumber++
                })
                actionNumber--
            } else {
                actionNumber--
            }
            actionNumber++
        }
    }
    modal.blocks.splice(0, 0, ...onboarding)
    if(pendingActionsBlocks.length > 0){
        pendingActionsBlocks.splice(0, 0, {
			"type": "header",
			"text": {
				"type": "plain_text",
				"text": "Pending Actions",
				"emoji": true
			}
        })
        pendingActionsBlocks.splice(1, 0, {
            "type": "divider"
        })
    }
    if(!user.isOnboardingDone){
        if(feedbackRequests.length > 0)
            modal.blocks.splice(modal.blocks.length-2, 0, ...pendingActionsBlocks)
        else
            modal.blocks.splice(modal.blocks.length-4, 0, ...pendingActionsBlocks)
    } else {
        if(isShowingQuote){
            modal.blocks.splice(modal.blocks.length-5, 0, ...pendingActionsBlocks)
        } else {
            modal.blocks.splice(modal.blocks.length-3, 0, ...pendingActionsBlocks)
        }
    }
    if(showMessage){
        let showMessageBlock = {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": showMessage
            }
        }
        if(showMessageAccessory){
            showMessageBlock.accessory = showMessageAccessory
        }
        modal.blocks.splice(0, 0, showMessageBlock,
		{
			"type": "divider"
		})
    }
    return modal
}

let getTeamTreeModal = function(team, recentUsers){
    let recentUsersBlock = {
        "type": "context",
        "elements": [
            {
                "type": "mrkdwn",
                "text": `*Feedback lovers @ ${team.slackWorkspaceName}:*`
            }
        ]
    }
    recentUsers.forEach(user => {
        recentUsersBlock.elements.push({
            "type": "image",
            "image_url": user.slackProfileImage,
            "alt_text": user.slackDisplayName
        })
    })
    if(team.numberOfUsers > 5)
        recentUsersBlock.elements.push({
            "type": "mrkdwn",
            "text": `+ ${team.numberOfUsers - 5} Other${ team.numberOfUsers === 6 ? '' : 's'}`
        })
    let modal = {
        "type": "modal",
        "title": {
            "type": "plain_text",
            "text": `${team.slackWorkspaceName}'${team.slackWorkspaceName.slice(-1) === 's' ? '' : 's'} Tree`,
            "emoji": true
        },
        "close": {
            "type": "plain_text",
            "text": "Done",
            "emoji": true
        },
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*Planted in celebration of ...*`
                }
            },
            recentUsersBlock,
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Share the joy with others"
                },
                "accessory": {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Share",
                        "emoji": true
                    },
                    "action_id": "app_home.share_tree",
                    "value": "app_home.share_tree"
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "image",
                "image_url": team.teamTree.treeImage,
                "alt_text": "Planted tree"
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": `*Location:*\n${team.teamTree.plantedLocation}`
                    },
                    {
                        "type": "mrkdwn",
                        "text": `*Species:*\n${team.teamTree.plantSpecies}`
                    }
                ]
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*Beneficiary Name:* ${team.teamTree.beneficiaryName}`
                }
            },
            {
                "type": "image",
                "image_url": team.teamTree.beneficiaryImageUrl,
                "alt_text": "Beneficiary"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `${team.teamTree.beneficiaryDesc}<${team.teamTree.treeUrl}|More...>`
                }
            }
        ]
    }
    return modal
}

let getShareTreeModal = function(team){
    return {
        "type": "modal",
        "callback_id": "share_team_tree",
        "notify_on_close": true,
        "title": {
            "type": "plain_text",
            "text": `${team.slackWorkspaceName}'${team.slackWorkspaceName.slice(-1) === 's' ? '' : 's'} Tree`,
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
                "type": "input",
                "element": {
                    "type": "conversations_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select user or channel",
                        "emoji": true
                    },
                    "response_url_enabled": true
                },
                "label": {
                    "type": "plain_text",
                    "text": "Share with users / channels",
                    "emoji": true
                }
            },
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
                    "action_id": "share_team_tree.message",
                    "initial_value": "Hey Team,\nWe have a tree planted on our name! Check it out!"
                },
                "label": {
                    "type": "plain_text",
                    "text": "Message",
                    "emoji": true
                },
                "block_id": "share_team_tree.message"
            }
        ]
    }
}

let getTeamTreeMessage = function(user, teamTreeMessage){
    let message = {
        "text": teamTreeMessage,
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `Message from <@${user.slackId}>:`
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": teamTreeMessage
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "🌱 View Tree",
                            "emoji": true
                        },
                        "value": "share_tree_message.open_team_tree",
                        "action_id": "share_tree_message.open_team_tree"
                    }
                ]
            }
        ],
        "response_type": "in_channel"
    }
    return message
}

let showAppHome = async function(bot, message, hideReminders = '', showMessage = false, showMessageAccessory = false){
    let name
    let userId
    let recentUsers = []
    let homeView 
    let usersAndPendingActions
    if(message.internal_user){
        name = message.internal_user.slackDisplayName
        userId = message.internal_user.slackId
        recentUsers = await userController.getRecentActiveUsers(message.internal_user.teamId.id)
        usersAndPendingActions = await feedbackReqActController.getHomeFeedbackRequests(message.internal_user)
    } else {
        let profile = await bot.api.users.info({ user: message.user })
        name = profile.user.profile.real_name_normalized
        userId = profile.user.id
    }
    if(!usersAndPendingActions)
        homeView= getHomeContent(name, null, [], [], [], null, hideReminders, showMessage, showMessageAccessory, [])
    else
        homeView= getHomeContent(name, message.internal_user, usersAndPendingActions.pendingActions, usersAndPendingActions.pendingClarifications, usersAndPendingActions.feedbackRequests, usersAndPendingActions.lastFeedbackRequest, hideReminders, showMessage, showMessageAccessory, recentUsers)
    let postData = { 
        token: bot.api.token,
        user_id: userId,
        view: homeView
    }
    await bot.api.views.publish(postData)
}

let onMessagesTabOpen = async function(bot, message){
    sendFirstMessage(bot, message.internal_user)
}

let sendFirstMessage = async function(bot, user){
    if( user && user.userEvents && !user.userEvents.includes(Constants.USER_EVENTS.FIRST_MESSAGE_SENT) && !user.userEvents.includes(Constants.USER_EVENTS.FEEDBACK_SENT) && !user.userEvents.includes(Constants.USER_EVENTS.FEEDBACK_RECIEVED) && !user.userEvents.includes(Constants.USER_EVENTS.REQUEST_RECIEVED)){
        await userController.addUserEvents(user.id, Constants.USER_EVENTS.FIRST_MESSAGE_SENT)
        let firstMessage = messageView.getFirstTimeMessage(user.slackDisplayName)
        await bot.startPrivateConversation(user.slackId)
        let data = await bot.say(firstMessage)
        await messageController.addMessage(user.id, Constants.MESSAGE_TYPE.FIRST_MESSAGE, '', data)
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.RECEIVED_MESSAGE_FIRST_MESSAGE, user)
    }
}


let processOnHomeOpen = async function(bot, message){
    let slackTeamId = message.team
    let team = await teamController.getTeamBySlackId(slackTeamId)
    syncUsers(bot, team)
    if(message.internal_user && (!message.internal_user.userEvents || (message.internal_user.userEvents && !message.internal_user.userEvents.includes(Constants.USER_EVENTS.APP_HOME_OPENED)))){
        await userController.addUserEvents(message.internal_user.id, Constants.USER_EVENTS.APP_HOME_OPENED)
    }
}

let syncUsers = async function(bot, team){
    if(team && team.numberOfUsers === 0){
        let cursor = ''
        let users
        let newUsersAdded = 0
        do {
            users = await bot.api.users.list({cursor: cursor})
            let usersList = []
            for(let u in users.members){
                let user = users.members[u]
                if(user.deleted || user.is_bot || user.id === 'USLACKBOT')
                    continue
                let userData = {
                    teamId: team.id,
                    slackId: user.id,
                    slackTeamId: team.slackId,
                    slackUsername: user.name,
                    slackDisplayName: user.profile.real_name_normalized,  
                    slackTimezoneName: user.tz,
                    slackTimezoneOffset: user.tz_offset,
                    slackIsAdmin: user.is_admin,
                    slackIsOwner: user.is_owner,
                    slackProfileImage: user.profile.image_512
                }
                usersList.push(userData)
            }
            let usersAdded = await userController.addListOfUsers(usersList)
            for(u in usersAdded){
                amplitudeService.logEvent(amplitudeService.EVENT_NAMES.USER_ADDDED_TO_DB, usersAdded[u], {})
            }
            newUsersAdded += usersList.length
            cursor = users.response_metadata.next_cursor
        } while(cursor != '')
        await teamController.updateUserCount(team.id, team.numberOfUsers + newUsersAdded)
    }
}


let sendFeedbackRequestReminders = async function(bot, message){
    let feedbackReqId = message.actions[0].value || message.actions[0].selected_option.value.split(".")[1]
    let feedbackRequestActivities = await feedbackReqActivityController.getPendingResponsesForRequest(feedbackReqId)
    let messageList = []
    for (let i =0;i < feedbackRequestActivities.length; i++){
        let feedbackRequestAct = feedbackRequestActivities[i]
        let message = messageView.getFeedbackRequestReminderMessage(feedbackRequestAct.feedbackRequest, feedbackRequestAct.userFor)
        await bot.startPrivateConversation(feedbackRequestAct.userFor.slackId)
        let data = await bot.say(message)
        messageList.push({
            userId: feedbackRequestAct.userFor.id,
            type: Constants.MESSAGE_TYPE.FEEDBACK_REQ_REMINDER_MESSAGE,
            refId: feedbackRequestAct.feedbackRequest.id,
            data: data
        })
        amplitudeService.logEvent(amplitudeService.EVENT_NAMES.RECEIVED_MESSAGE_SEND_REMINDERS, feedbackRequestAct.userFor)
    }
    await messageController.insertListOfMessages(messageList)
    let reminderMessage = await messageController.getMessage(feedbackRequestActivities[0].feedbackRequest.userId.id, Constants.MESSAGE_TYPE.REMINDER_MESSAGE, feedbackRequestActivities[0].feedbackRequest.id)
    if(reminderMessage){
        reminderMessage.view.blocks.splice(1, 1, {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "✅ Reminders sent"
            }
        })
        let data = {
            token: bot.api.token,
            ts: reminderMessage.data.activityId,
            channel: reminderMessage.data.conversation.id,
            text: "✅ Reminders sent",
            blocks: reminderMessage.view.blocks
        }
        await bot.api.chat.update(data)
        await messageController.removeMessage(reminderMessage.userId, reminderMessage.type, reminderMessage.refId)
    }
    let extendDateMessage = await messageController.getMessage(message.internal_user.id, Constants.MESSAGE_TYPE.EXTEND_MESSAGE, feedbackRequestActivities[0].feedbackRequest.id)
    if(extendDateMessage){
        let messageViewBlocks = extendDateMessage.view.blocks
        messageViewBlocks[0].text.text += '\n\n✅ Reminders sent successfully!'
        let buttons = []
        buttons.push(messageViewBlocks[1].elements[1])
        messageViewBlocks[1].elements = buttons
        let data = {
            token: bot.api.token,
            ts: extendDateMessage.data.activityId,
            channel: extendDateMessage.data.conversation.id,
            text: `✅ Reminders sent successfully!`,
            blocks: messageViewBlocks
        }
        await bot.api.chat.update(data)
    }
    await feedbackRequestController.addRemindersSentNow(feedbackReqId)
    if(message.actions[0].action_id === 'review_not_ready.send_reminders'){
        let feedbackRequestActivity = await feedbackReqActivityController.getSelfAssessmentActivity(feedbackReqId)
        let modalView = reviewModalView.getReviewNotReadyModal(feedbackRequestActivity)
        let postData = { 
            token: bot.api.token,
            view_id: message.view.id,
            hash: message.view.hash,
            view: modalView
        }
        await bot.api.views.update(postData)
    }
    showAppHome(bot, message, feedbackReqId)
}

let processTeamJoinOrTeamChange = async function(bot, message){
    let eventType = message.type
    let slackTeamId = message.team
    let user = message.user
    if(user.deleted || user.is_bot || user.id === 'USLACKBOT')
        return
    let team = await teamController.getTeamBySlackId(slackTeamId)
    if(team){
        let userData = {
            teamId: team.id,
            slackId: user.id,
            slackTeamId: slackTeamId,
            slackUsername: user.name,
            slackDisplayName: user.profile.real_name_normalized,  
            slackTimezoneName: user.tz,
            slackTimezoneOffset: user.tz_offset,
            slackIsAdmin: user.is_admin,
            slackIsOwner: user.is_owner,
            slackProfileImage: user.profile.image_512
        }
        let userInDb = await userController.addUser(userData)
        if(eventType === 'team_join'){
            await teamController.updateUserCount(team.id, team.numberOfUsers + 1)
            amplitudeService.logEvent(amplitudeService.EVENT_NAMES.USER_ADDDED_TO_DB, userInDb, {})
        }
    }
}


let onAppUninstalled = async function(bot, message){
    let slackTeamId = message.team
    let team = await teamController.setTeamUninstalled(slackTeamId)
    amplitudeService.logEventRemovedFromWorkspace({workspaceName: team.slackWorkspaceName, workspaceId: slackTeamId}, '000000')
    await slackService.postWorkspaceRemovedMessage(team.slackWorkspaceName, team.numberOfUsers)
}

let showTeamTreeModal = async function(bot, message){
    let recentUsers = await userController.getRecentActiveUsers(message.internal_user.teamId.id)
    let postData = { 
        token: bot.api.token,
        trigger_id: message.incoming_message.channelData.trigger_id,
        view: getTeamTreeModal(message.internal_user.teamId, recentUsers)
    }
    await bot.api.views.open(postData)
    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.HOME_VIEW_TREE, message.internal_user)
}

let showShareTeamTreeModal = async function(bot, message){
    let postData = { 
        token: bot.api.token,
        trigger_id: message.incoming_message.channelData.trigger_id,
        view: getShareTreeModal(message.internal_user.teamId)
    }
    await bot.api.views.push(postData)
    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.TREE_SHARE_TREE, message.internal_user)
}

let processShareTeamTreeModal = async function(bot, message){
    let responseUrl = message.response_urls[0].response_url
    bot.httpBody({
        "response_action": "clear"
    })
    let messageStateValues = message.view.state.values
    let treeMessage = messageStateValues['share_team_tree.message']['share_team_tree.message'].value
    let shareMessage = getTeamTreeMessage(message.internal_user, treeMessage)
    await needle('post', responseUrl, shareMessage, {json: true})
    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.SHARE_TREE_SUBMIT, message.internal_user)
}

module.exports = {
    showAppHome,
    processOnHomeOpen,
    sendFeedbackRequestReminders,
    processTeamJoinOrTeamChange,
    onMessagesTabOpen,
    syncUsers,
    sendFirstMessage,
    onAppUninstalled,
    showTeamTreeModal,
    showShareTeamTreeModal,
    processShareTeamTreeModal
}