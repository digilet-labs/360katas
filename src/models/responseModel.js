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
