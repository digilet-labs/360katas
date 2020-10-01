

module.exports = function(controller) {

    controller.on('slash_command', async(bot, message) => { 
        let command = message.command
        let parameter = message.text
        console.log(message)
        console.log(command, parameter)
        bot.httpBody({text:'Pong'})
        // await bot.replyPublic(message, 'My response to your command is: ...')
    });
}