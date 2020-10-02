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

var mongoose = require('mongoose')
const Constants = require('../Constants')

var messageSchema = new mongoose.Schema({
    userId: { type: String, ref: 'user'},
    refId: { type: String },
    type: {type: String},
    data: { type: Object },
    view: { type: Object },
    scheduled: { type: Number },
})

messageSchema.statics.addMessage = function(message){
    return this.findOneAndUpdate({ userId: message.userId, refId: message.refId, type: message.type }, message, {
        new: true,
        upsert: true
      })
}

messageSchema.statics.updateMessage = function(messageId, message){
    return this.findOneAndUpdate({ _id: messageId }, message, {
        new: true,
        upsert: true
      })
}


messageSchema.statics.addListOfMessages = function(messages){
    let ops = []
    for(let i in messages){
        let message = messages[i]
        let op ={ 
            updateOne: {
                filter: { userId: message.userId, refId: message.refId, type: message.type },
                update: message,
                upsert: true
            }
        }
        ops.push(op)
    }
    return this.bulkWrite(ops)
}

messageSchema.statics.insertListOfMessages = function(messages){
    return this.insertMany(messages)
}

messageSchema.statics.getMessage = function(message){
    return this.findOne({ userId: message.userId, refId: message.refId, type: message.type})
}

messageSchema.statics.getMessagesByType = function(userId, type){
    return this.find({ userId: userId, type: type})    
}

messageSchema.statics.getMessages = function(userId, type, refId){
    return this.find({ userId: userId, type: type, refId: refId})    
}

messageSchema.statics.removeMessage = function(message){
    return this.findOneAndRemove({ userId: message.userId, refId: message.refId, type: message.type})
}

messageSchema.statics.getScheduledMessages = function(){
    return this.find({ type: {$in: [Constants.MESSAGE_TYPE.CLARIFICATION_MESSAGE_SCHEDULED, Constants.MESSAGE_TYPE.RESPOND_TO_CLARIFICATION_MESSAGE_SCHEDULED]}, scheduled: { $lt: Date.now() } })
    .populate('userId')
    .exec()
}

module.exports = mongoose.model('message', messageSchema)