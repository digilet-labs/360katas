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

var userSchema = new mongoose.Schema({
    teamId: {type: String, ref: 'team'},
    slackId: {type: String},
    slackTeamId: {type: String},
    slackUsername: {type: String},
    slackDisplayName: {type: String},  
    slackTimezoneName: {type: String},
    slackTimezoneOffset: {type: Number},
    slackIsAdmin: { type: Boolean, default: false }, 
    slackIsOwner: { type: Boolean, default: false},
    slackProfileImage: {type: String, default: 'https://i0.wp.com/a.slack-edge.com/df10d/img/avatars/ava_0018-512.png?ssl=1'},
    isOnboardingDone: {type: Boolean, default: false},
    timestamp: { type: Number, default: Date.now },
    lastActiveTimestamp: { type: Number },
    userEvents: [{type: String}],
    tempContext: {type: Object, default: {}}
})

userSchema.statics.addUser = function(user){
    return this.findOneAndUpdate({ slackId: user.slackId }, user, {
        new: true,
        upsert: true
    }).populate('teamId')
}

userSchema.statics.addListOfUsers = function(users){
    let ops = []
    for(let i in users){
        let user = users[i]
        let op ={ 
            updateOne: {
                filter: { slackId: user.slackId },
                update: user,
                upsert: true
            }
        }
        ops.push(op)
    }
    return this.bulkWrite(ops)
}

userSchema.statics.getUsersBySlackIds = function(slackUserIds){
    return this.find({
        slackId: {
            $in: slackUserIds
        }
    })
}

userSchema.statics.getUsersBySlackIdsWithTeam = function(slackUserIds){
    return this.find({
        slackId: {
            $in: slackUserIds
        }
    }).populate('teamId')
}

userSchema.statics.getUserById = function(userId){
    return this.findOne({ _id: userId }).populate('teamId')
}

userSchema.statics.getUserBySlackId = function(slackUserId){
    return this.findOne({ slackId: slackUserId }).populate('teamId')
}

userSchema.statics.updateUserOnboardingDone = function(userid){
    return this.updateOne({ _id: userid }, {
        $set: {
            isOnboardingDone: true
        }
    })
}

userSchema.statics.addUserEvents = function(userId, userEvent){
    return this.updateOne({ _id: userId }, {
        $addToSet: {
            userEvents: userEvent
        }
    })
}

userSchema.statics.setTempContext = function(userId, tempContext){
    return this.updateOne({ _id: userId }, {
        $set: { tempContext: tempContext }
    })
}

userSchema.statics.getRecentActiveUsers = function(teamId){
    return this.find({ teamId: teamId }).sort({lastActiveTimestamp: -1}).limit(5).exec()
}

userSchema.statics.setActiveNow = function(userId){
    return this.updateOne({ _id: userId }, {
        $set: { lastActiveTimestamp: Date.now() }
    })
}

module.exports = mongoose.model('user', userSchema)