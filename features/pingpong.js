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

const slackService = require("../src/services/slackService")
const amplitudeService = require("../src/services/amplitudeService")
const Constants = require("../src/Constants")

let helloMessage = {
	"text": "Hello! I am 360Katas! I help you seek anonymous feedback and work on our development goals!\n\nI'm still very young and not developed (pun intended :p) enough to hold an intelligent conversation with a human. You can learn more about how I can help here",
	"blocks": [
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "Hello! I am 360Katas! I help you seek anonymous feedback and work on our development goals!\n\nI'm still very young and not developed (pun intended :p) enough to hold an intelligent conversation with a human. You can learn more about how I can help <https://slack.com/app_redirect?app=A016QPZRFTK&tab=about|here>. "
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "You can also speak to one of our team member directly by tapping the button below!"
			}
		},
		{
			"type": "actions",
			"elements": [
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"text": "ℹ️ Live Chat",
						"emoji": true
					},
					"url": "https://360katas.com/faqs?uid=dschqoij23099jcnksdncio1enf1oilksdcn1oi3neon"
				}
			]
		}
	]
}

let helloFunction = async(bot, message) => {
    await bot.reply(message, helloMessage)
    amplitudeService.logEvent(amplitudeService.EVENT_NAMES.SENT_MESSAGE, message.internal_user, { message: message.text })
}

module.exports = function(controller) {

    controller.hears('ping','direct_message', async(bot, message) => {
        if((!Constants.IS_LIVE && message.internal_user.teamId.id === '5f57eff040cd4ea637fbc028') || (Constants.IS_LIVE && message.internal_user.teamId.id === '5efdf696e958f37976d4f2c2')){
            await bot.reply(message, {
                "text": "pong",
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "pong"
                        },
                        "accessory": {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "Add Team Tree",
                                "emoji": true
                            },
                            "value": "message.add_team_tree",
                            "action_id": "message.add_team_tree"
                        }
                    }
                ]
            })
            return
        } 
        await bot.reply(message, 'pong')
    })

    controller.hears('hello','direct_message', helloFunction)

    controller.hears('hi','direct_message', helloFunction)

    controller.on('direct_message', async (bot, message) => {
        await bot.reply(message, helloMessage)
        if(message.internal_user){
            await slackService.postMessageReviewedMessage(message.internal_user.teamId.slackWorkspaceName, message.internal_user.slackDisplayName, message.text)
            amplitudeService.logEvent(amplitudeService.EVENT_NAMES.SENT_MESSAGE, message.internal_user, { message: message.text })
        }
    })
}
