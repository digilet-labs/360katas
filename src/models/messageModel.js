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