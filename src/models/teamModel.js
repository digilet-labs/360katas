var mongoose = require('mongoose')

let teamTreeSchema = new mongoose.Schema({
    treeImage: { type: String },
    treeUrl: { type: String },
    plantedDate: {type: String},
    plantedLocation: {type: String},
    plantSpecies: {type: String},
    beneficiaryName: {type: String},
    beneficiaryImageUrl: {type: String},
    beneficiaryDesc: {type: String},
})

var teamSchema = new mongoose.Schema({
    slackId: { type: String },
    slackWorkspaceName: { type: String },
    numberOfUsers: { type: Number },
    lastSyncedAt: { type: Number },
    authedUser: { type: String },
    accessToken: { type: String },
    botUserId: {type: String },
    timestamp: { type: Number, default: Date.now },
    teamTree: {type: teamTreeSchema },
    isInstalled: {type: Boolean, default: true}
})

teamSchema.statics.addTeam = function(team){
    return this.findOneAndUpdate({ slackId: team.slackId }, team, {
        new: true,
        upsert: true
      })
}

teamSchema.statics.getTeamBySlackId = function(slackTeamId){
    return this.findOne({ slackId: slackTeamId })
}

teamSchema.statics.updateUserCount = function(teamId, userCount){
    return this.findOneAndUpdate({ _id: teamId }, {$set: {numberOfUsers: userCount}}, {new: true})
}

teamSchema.statics.setUninstalled = function(slackTeamId){
    return this.findOneAndUpdate({ slackId: slackTeamId }, { $set: { isInstalled: false}},  {new: true})
}

teamSchema.statics.getAllTeams = function(){
    return this.find({})
}

teamSchema.statics.setTeamTree = function(teamId, teamTree){
    return this.findOneAndUpdate({_id: teamId}, {$set: {teamTree: teamTree}})
}

module.exports = mongoose.model('team', teamSchema)