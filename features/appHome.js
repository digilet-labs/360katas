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