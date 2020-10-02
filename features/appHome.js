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

const appHomeView = require('./views/appHomeView')
const amplitudeService = require('../src/services/amplitudeService')

module.exports = function(controller){
    
    controller.on('app_home_opened', async (bot, message) => {
        if(message.incoming_message.channelData.tab === 'home'){
            amplitudeService.logEvent(amplitudeService.EVENT_NAMES.HOME_OPENED, message.internal_user)
            appHomeView.showAppHome(bot, message)
        } else if (message.incoming_message.channelData.tab === 'messages'){
            appHomeView.onMessagesTabOpen(bot, message)
        }
        appHomeView.processOnHomeOpen(bot, message)
    })

    controller.on('team_join', async(bot, message) => {
        appHomeView.processTeamJoinOrTeamChange(bot, message)
    })

    controller.on('user_change', async(bot, message) => {
        appHomeView.processTeamJoinOrTeamChange(bot, message)
    })

    controller.on('app_uninstalled', async(bot, message) => {
        appHomeView.onAppUninstalled(bot, message)
    })

}