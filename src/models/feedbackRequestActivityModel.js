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
const CONSTANTS = require('../Constants')

var feedbackReqActivitySchema = new mongoose.Schema({
    feedbackRequest: {type: String, ref: 'feedbackRequest'},
    userFor: {type: String, ref: 'user'},
    status: { type: String , default: CONSTANTS.FEEDBACK_REQ_STATUS.ONGOING },
    isSelfAssessment: {type: Boolean, default: false}
})


feedbackReqActivitySchema.statics.addFeedbackReqActivity = function(feedbackReqActivity){
    return this.create(feedbackReqActivity)
}

feedbackReqActivitySchema.statics.updateStatus = function(feedbackReqId, userForId, status){
    return this.updateOne({ feedbackRequest: feedbackReqId, userFor: userForId }, {
        status: status
    })
}

feedbackReqActivitySchema.statics.getPendingActionsForUser = function(userId, pendingFeedbackRequest){
    let query
    if(pendingFeedbackRequest)
        query = {$or: [{userFor: userId, status: CONSTANTS.FEEDBACK_REQ_STATUS.ONGOING},{userFor: userId, status: CONSTANTS.FEEDBACK_REQ_STATUS.CLARIFICATION}, {userFor: userId, feedbackRequest: pendingFeedbackRequest}]}
    else
        query = {$or: [{userFor: userId, status: CONSTANTS.FEEDBACK_REQ_STATUS.ONGOING},{userFor: userId, status: CONSTANTS.FEEDBACK_REQ_STATUS.CLARIFICATION}]}
    return this.find(query)
    .populate({
        path: 'feedbackRequest',
        populate: { path: 'userId autoRepeatMetadata.peersList autoRepeatMetadata.managersList autoRepeatMetadata.reporteesList' }
      })
    .exec()
}

feedbackReqActivitySchema.statics.getOngoingActionsForUser = function(userId, ongoingRequestIds){
    let query = {$or: [{userFor: userId, status: CONSTANTS.FEEDBACK_REQ_STATUS.ONGOING},{userFor: userId, status: CONSTANTS.FEEDBACK_REQ_STATUS.CLARIFICATION}, {userFor: userId, feedbackRequest: {$in: ongoingRequestIds}}]}
    return this.find(query)
    .populate({
        path: 'feedbackRequest',
        populate: { 
            path: 'userId peersList managersList reporteesList autoRepeatMetadata.peersList autoRepeatMetadata.managersList autoRepeatMetadata.reporteesList'
        }
      })
      .sort({'_id': -1})
    .exec()
}

feedbackReqActivitySchema.statics.getPendingResponsesForRequest = function(feedbackReqId){
    return this.find({feedbackRequest: feedbackReqId, status: CONSTANTS.FEEDBACK_REQ_STATUS.ONGOING, isSelfAssessment: false})
    .populate({
        path: 'feedbackRequest',
        populate: { path: 'userId' }
      })
    .populate('userFor')
    .exec()
}

feedbackReqActivitySchema.statics.setStatusClarification = function(feedbackReqId, userForId){
    return this.findOneAndUpdate({feedbackRequest: feedbackReqId, userFor: userForId}, {status: CONSTANTS.FEEDBACK_REQ_STATUS.CLARIFICATION}, {new: true})
}

feedbackReqActivitySchema.statics.getSelfAssessmentActivity = function(feedbackReqId){
    return this.findOne({feedbackRequest: feedbackReqId, isSelfAssessment: true}) 
    .populate({
        path: 'feedbackRequest',
        populate: { path: 'userId peersList managersList reporteesList' }
      })
    .exec()
}

module.exports = mongoose.model('feedbackReqActivity', feedbackReqActivitySchema)