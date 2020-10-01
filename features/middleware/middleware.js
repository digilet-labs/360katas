const userController = require("../../src/controllers/userController")
const Constants = require("../../src/Constants")

let middlewareFunction = async function (bot, message, next) { 
    let user
    if(message.user && typeof message.user === "string")
        user = await userController.getUserBySlackId(message.user)
    else if (message.user && typeof message.user.id === "string")
        user = await userController.getUserBySlackId(message.user.id)
    if(user){
        message.internal_user = user
    }
    next()
}

module.exports = {
    middlewareFunction
}