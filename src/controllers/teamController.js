const TeamModel = require('../models/teamModel')


let getTeamBySlackId = function(slackTeamId){
    return TeamModel.getTeamBySlackId(slackTeamId)
}

let createNewTeam = function(team){
    return TeamModel.addTeam(team)
}

let updateUserCount = function(teamId, usersCount){
    return TeamModel.updateUserCount(teamId, usersCount)
}

let setTeamUninstalled = function(slackTeamId){
    return TeamModel.setUninstalled(slackTeamId)
}

let getAllTeams = function(){
    return TeamModel.getAllTeams()
}

let setTeamTree = function(teamId, treeImage, treeUrl, plantedLocation, plantedDate, beneficiaryName, beneficiaryImageUrl, beneficiaryDesc, plantSpecies){
    let data = {
        treeImage,
        treeUrl,
        plantedLocation,
        plantedDate,
        beneficiaryName,
        beneficiaryImageUrl,
        beneficiaryDesc,
        plantSpecies
    }
    return TeamModel.setTeamTree(teamId, data)
}

module.exports = {
    getTeamBySlackId,
    createNewTeam,
    updateUserCount,
    setTeamUninstalled,
    getAllTeams,
    setTeamTree
}