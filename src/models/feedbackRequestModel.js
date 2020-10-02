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

const Constants = require('../Constants')
var mongoose = require('mongoose')

var autoRepeatMetadataSchema = new mongoose.Schema({
    questionsList: [{type: String}],  
    personalNote: { type: String },
    peersList: [{type: String, ref: 'user'}],
    managersList: [{type: String, ref: 'user'}],
    reporteesList: [{type: String, ref: 'user'}],
    nextDueDateDays: { type: Number }
})

var feedbackRequestSchema = new mongoose.Schema({
    userId: { type: String, ref: 'user' },
    teamId: { type: String, ref: 'team' },
    peersList: [{type: String, ref: 'user'}],
    managersList: [{type: String, ref: 'user'}],
    reporteesList: [{type: String, ref: 'user'}],
    questionsList: [{type: String}],
    requestTimestamp: { type: Number, default: Date.now },
    closeReqTimestamp: { type: Number },
    totalResponses: {type: Number, default: 0},
    responsesReceived: { type: Number , default: 0 },
    remindersSent: [{ type: Number }],
    nextAutoReminder: { type: Number },
    personalNote: { type: String, default: 'Enter a personal message to the recipients to encourage them to share feedback!' },
    status: { type: String, default: Constants.FEEDBACK_REQ_STATUS.ONGOING },
    autoRepeat: { type: Number },
    autoRepeatName: { type: String },
    autoRepeatMetadata: autoRepeatMetadataSchema,
    thankYouMessage: { type: String },
    isExtendMessageSent: {type: Boolean, default: false}
})

feedbackRequestSchema.methods.classifyResponseType = function(){
    if(this.peersList >= 2 && this.managersList >= 2 && this.reporteesList >= 2){
        return 'PMR'
    } else if (this.peersList >= 2){
        if(this.managersList > this.peersList){
            return 'M'
        } else if(this.reporteesList > this.peersList){
            return 'R'
        } else {
            return 'P'
        }
    } else if (this.managersList >= 2){
        if(this.peersList > this.managersList){
            return 'P'
        } else if(this.reporteesList > this.managersList){
            return 'R'
        } else {
            return 'M'
        }
    } else if (this.reporteesList >= 2){
        if(this.managersList > this.reporteesList){
            return 'M'
        } else if(this.peersList > this.reporteesList){
            return 'P'
        } else {
            return 'R'
        }
    } else {
        return 'ALL'
    }
}

feedbackRequestSchema.methods.getAutoRepeatScheduledTimestamp = function(){
    let timestamp = this.requestTimestamp
    switch(this.autoRepeatName ){
        case 'week':
            timestamp += Constants.TIME.ONE_WEEK
            break
        case 'fortnight':
            timestamp += Constants.TIME.ONE_WEEK * 2
            break
        case 'month':
            timestamp += Constants.TIME.ONE_MONTH
            break
        case 'quarter':
            timestamp += Constants.TIME.ONE_MONTH * 4
            break
    }
    return timestamp
}


feedbackRequestSchema.statics.addNewFeedbackRequest = function(feedbackReq){
    return this.create(feedbackReq)
}

feedbackRequestSchema.statics.getPendingFeedbackRequest = function(userId){
    let filter = {
        userId: userId,
        status: { $ne: Constants.FEEDBACK_REQ_STATUS.CONCLUDED }
    }
    return this.findOne(filter).sort('-requestTimestamp').exec()
}

feedbackRequestSchema.statics.getLastFeedbackRequest = function(userId){
    return this.findOne({userId: userId}).sort('-requestTimestamp').exec()
}

feedbackRequestSchema.statics.getMyOngoingFeedbackRequests = function(userId){
    let filter = {
        userId: userId,
        status: { $ne: Constants.FEEDBACK_REQ_STATUS.CONCLUDED }
    }
    return this.find(filter).sort('-requestTimestamp').exec()
}

feedbackRequestSchema.statics.getFeedbackRequestById = function(feedbackReqId){
    return this.findOne({_id: feedbackReqId})
    .populate('userId')
    .populate('peersList')
    .populate('managersList')
    .populate('reporteesList')
    .populate('autoRepeatMetadata.peersList')
    .populate('autoRepeatMetadata.managersList')
    .populate('autoRepeatMetadata.reporteesList')
    .exec()
}

feedbackRequestSchema.statics.incrementResponsesReceived = function(feedbackReqId){
    return this.updateOne({ _id: feedbackReqId }, {
        $inc: { responsesReceived: 1 }
    })
}

feedbackRequestSchema.statics.getCompletedOngoingRequests = function(){
    let now = Date.now()
    let query = {$or: [
        { status: Constants.FEEDBACK_REQ_STATUS.ONGOING, $where: 'this.responsesReceived === this.totalResponses' },
        { status: Constants.FEEDBACK_REQ_STATUS.ONGOING, closeReqTimestamp: { $lt: now } }
    ]}
    return this.find(query)
    .populate('userId')
    .populate('peersList')
    .populate('managersList')
    .populate('reporteesList')
    .exec()
}

feedbackRequestSchema.statics.finishCompletedOngoingRequests = function(){
    let now = Date.now()
    let query = {$or: [
        { status: Constants.FEEDBACK_REQ_STATUS.ONGOING, $where: 'this.responsesReceived === this.totalResponses' },
        { status: Constants.FEEDBACK_REQ_STATUS.ONGOING, closeReqTimestamp: { $lt: now } }
    ]}
    return this.updateMany(query, { status: Constants.FEEDBACK_REQ_STATUS.SUBMITTED, closeReqTimestamp: now})
    .exec()
}

feedbackRequestSchema.statics.getSoonExpiringRequests =function(){
    let nowPlusOneDay = Date.now() + Constants.TIME.ONE_DAY
    let query = { status: Constants.FEEDBACK_REQ_STATUS.ONGOING, closeReqTimestamp: {$lt: nowPlusOneDay}, isExtendMessageSent: false }
    return this.find(query)
    .populate('userId')
    .populate('peersList')
    .populate('managersList')
    .populate('reporteesList')
    .exec()
}

feedbackRequestSchema.statics.setIsExtendMessageSent = function(feedbackReqId){
    return this.findOneAndUpdate({ _id: feedbackReqId }, { $set: { isExtendMessageSent: true}})
}

feedbackRequestSchema.statics.extendFeedbackRequest = function(feedbackReqId, closeReqTimestamp){
    let query = { _id: feedbackReqId }
    return this.findOneAndUpdate(query, {$set: { closeReqTimestamp: closeReqTimestamp, isExtendMessageSent: false,  status: Constants.FEEDBACK_REQ_STATUS.ONGOING } })
    .exec()
}

feedbackRequestSchema.statics.concludeFinishedRequests = function(){
    let nowMinusMonth = Date.now() - 2 * Constants.TIME.ONE_WEEK
    let query = { status: Constants.FEEDBACK_REQ_STATUS.SUBMITTED, closeReqTimestamp: { $gte: nowMinusMonth }}
    return this.updateMany(query, {status: Constants.FEEDBACK_REQ_STATUS.CONCLUDED})
}

feedbackRequestSchema.statics.concludeFeedbackRequest = function(feedbackReqId){
    return this.findOneAndUpdate({ _id: feedbackReqId }, { $set: { status: Constants.FEEDBACK_REQ_STATUS.CONCLUDED } })
}

feedbackRequestSchema.statics.getAutoReminderRequests = function(){
    let now = Date.now()
    let query = { 
        nextAutoReminder: { $lt: now } ,
        status: Constants.FEEDBACK_REQ_STATUS.ONGOING
    }
    return this.find(query)
    .populate('userId')
    .populate('peersList')
    .populate('managersList')
    .populate('reporteesList')
    .exec()
}

feedbackRequestSchema.statics.getConcludedRequests = function(userId){
    let filter = {
        userId: userId,
        status: Constants.FEEDBACK_REQ_STATUS.CONCLUDED
    }
    return this.find(filter)
    .populate('userId')
    .populate('peersList')
    .populate('managersList')
    .populate('reporteesList')
    .sort('-requestTimestamp')
    .exec()
}

feedbackRequestSchema.statics.addRemindersSentNow = function(feedbackReqId, nextAutoReminder){
    let now = Date.now()
    let updateQuery = { $push: { remindersSent:  now}}
    if(nextAutoReminder)
        updateQuery['$set'] = { nextAutoReminder: nextAutoReminder }
    return this.findOneAndUpdate({ _id: feedbackReqId }, updateQuery)
}

feedbackRequestSchema.statics.setAutoRepeatMetaData = function(feedbackReqId, autoRepeatMetadata){
    return this.findOneAndUpdate({ _id: feedbackReqId }, { $set: { autoRepeatMetadata:  autoRepeatMetadata}})   
}

feedbackRequestSchema.statics.setAutoRepeat = function(feedbackReqId, autoRepeat, autoRepeatName){
    return this.findOneAndUpdate({ _id: feedbackReqId }, { $set: { autoRepeat:  autoRepeat, autoRepeatName: autoRepeatName }})   
}

feedbackRequestSchema.statics.removeAutoRepeat = function(feedbackReqId){
    return this.findOneAndUpdate({ _id: feedbackReqId }, { $set: { autoRepeatName: 'dnr' }, $unset: { autoRepeatMetadata:  "", autoRepeat: ""}})   
}

feedbackRequestSchema.statics.getNowAutoRepeatingRequests = function(){
    let now = Date.now()
    let query = {
        autoRepeat: { $lt: now }   
    }
    return this.find(query)
    .populate('userId')
    .populate('peersList')
    .populate('managersList')
    .populate('reporteesList')
    .populate('autoRepeatMetadata.peersList')
    .populate('autoRepeatMetadata.managersList')
    .populate('autoRepeatMetadata.reporteesList')
    .exec()
}

feedbackRequestSchema.statics.getLastQuestions = function(userId){
    let cmd = [
        { $match: { userId: userId } },
        { $sort : { "requestTimestamp" : -1 } },
        { $unwind : "$questionsList" },
        { $group: { _id: "$userId", questions: { $push: "$questionsList" } } },
        { $project: { questions: { $slice: ["$questions", 0, 50] } } }
     ]
    return this.aggregate(cmd).exec()
}

feedbackRequestSchema.statics.setThankYouMessage = function(feedbackReqId, thankYouMessage){
    return this.findOneAndUpdate({ _id: feedbackReqId }, { $set: { thankYouMessage: thankYouMessage } }, { new: true}) 
    .populate('userId')
    .populate('peersList')
    .populate('managersList')
    .populate('reporteesList')
    .exec()
}

module.exports = mongoose.model('feedbackRequest', feedbackRequestSchema)
