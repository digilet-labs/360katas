const userController = require("./userController")

let mauticSendMessageWebhookController = async function(botKitController, userId, message){
    let user = await userController.getUserById(userId)
    let bot = await botKitController.spawn(user.slackTeamId)
    await bot.startPrivateConversation(user.slackId)
    let data = await bot.say(message)
    console.log(data)
}

module.exports = {
    mauticSendMessageWebhookController
}