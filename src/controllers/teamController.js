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