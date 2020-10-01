const Message = require('../models/messageModel')

let addMessage = function(userId, messageType, refId, messageData, view = null, scheduled = null){
    let message = {
        userId: userId,
        type: messageType,
        refId: refId,
        data: messageData
    }
    if(view){
        message.view = view
    }
    if(scheduled){
        message.scheduled = scheduled
    }
    return Message.addMessage(message)
}

let updateMessage = function(message){
    let data = {
        userId: message.userId.id,
        type: message.type,
        refId: message.refId,
        data: message.data
    }
    if(message.view){
        data.view = message.view
    }
    if(message.scheduled){
        data.scheduled = message.scheduled
    }
    return Message.updateMessage(message.id, data)
}

let addListOfMessages = function(messages){
    return Message.addListOfMessages(messages)
}

let insertListOfMessages = function(messages){
    return Message.insertListOfMessages(messages)
}

let getMessage = function(userId, messageType, refId){
    return Message.getMessage({userId: userId, type: messageType, refId: refId})
}

let getMessagesByType = function(userId, messageType){
    return Message.getMessagesByType(userId, messageType)
}

let getMessages = function(userId, messageType, refId){
    return Message.getMessages(userId, messageType, refId)
}

let removeMessage = function(userId, messageType, refId){
    return Message.removeMessage({userId: userId, type: messageType, refId: refId})
}

let getScheduledMessages = function(){
    return Message.getScheduledMessages()
}

module.exports = {
    addMessage,
    addListOfMessages,
    getMessage,
    updateMessage,
    getMessagesByType,
    getMessages,
    removeMessage,
    insertListOfMessages,
    getScheduledMessages
}