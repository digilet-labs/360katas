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

const userController = require("./userController")

let mauticSendMessageWebhookController = async function(botKitController, userId, message){
    let user = await userController.getUserById(userId)
    let bot = await botKitController.spawn(user.slackTeamId)
    try {
        await bot.startPrivateConversation(user.slackId)
        await bot.say(message)
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    mauticSendMessageWebhookController
}