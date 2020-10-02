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