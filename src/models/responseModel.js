var mongoose = require('mongoose')

var responseSchema = new mongoose.Schema({
    feedbackId: {type: String, ref: 'feedbackRequest'},
    questionText: { type: String },
    responseText: { type: String , default: 'No response entered'},
    responseById: { type: String, ref: 'user'},
    replies: [ { type: String } ],
    timestamp: { type: Number, default: Date.now }
})

responseSchema.statics.addListOfResponses = function(responses){
    return this.insertMany(responses)
}

responseSchema.statics.getResponsesForRequest = function(feedbackReqId){
    return this.find({ feedbackId: feedbackReqId })
        .populate({
            path: 'feedbackId',
            populate: [{
                path: 'userId'
            },{
                path: 'peersList'
            },{
                path: 'managersList'
            },{
                path: 'reporteesList'
            }]
        })
        .populate('responseById')
        .exec()
}

responseSchema.statics.getResponseById = function(responseId){
    return this.findOne({ _id: responseId })
        .populate({
            path: 'feedbackId',
            populate: {
                path: 'userId'
            }
        })
        .populate('responseById')
        .exec()
}

responseSchema.statics.getPendingClarificationResponses = function(userId){
    return this.find({responseById: userId, 'replies.0': {$exists: true}, 'replies.1': {$exists: false}})
}


responseSchema.statics.setClarificationQuestion = function(responseId, clarificationQuestion){
    return this.findOneAndUpdate({ _id: responseId }, { $push: { "replies": clarificationQuestion } }, { new: true })
    .populate({
        path: 'feedbackId',
        populate: {
            path: 'userId'
        }
    })
    .populate('responseById')
}

responseSchema.statics.setClarificationAnswer = function(responseId, clarificationAnswer){
    return this.findOneAndUpdate({ _id: responseId }, { $push: { "replies": clarificationAnswer } }, { new: true })
    .populate({
        path: 'feedbackId',
        populate: {
            path: 'userId'
        }
    })
    .populate('responseById')
}

module.exports = mongoose.model('response', responseSchema)
