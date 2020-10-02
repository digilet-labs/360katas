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