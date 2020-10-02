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

const UserModel = require('../models/userModel')

let addUser = function(user){
    return UserModel.addUser(user)
}

let addListOfUsers = async function(users){
    await UserModel.addListOfUsers(users)
    let slackUserIds = users.map( u => u.slackId)
    let usersAdded = await UserModel.getUsersBySlackIdsWithTeam(slackUserIds)
    return usersAdded
}

let getUsersBySlackIds = function(slackUserIds){
    return UserModel.getUsersBySlackIds(slackUserIds)
}

let getUserBySlackId = function(slackUserId){
    return UserModel.getUserBySlackId(slackUserId)
}

let updateUserOnboardingDone = function(userId){
    return UserModel.updateUserOnboardingDone(userId)
}

let addUserEvents = function(userId, userEvent){
    return UserModel.addUserEvents(userId, userEvent)
}

let getUserById = function(userId){
    return UserModel.getUserById(userId)
}

let setTempContext = function(userId, tempContext){
    return UserModel.setTempContext(userId, tempContext)
}

let getRecentActiveUsers = async function(teamId){
    let users = await UserModel.getRecentActiveUsers(teamId)
    let profilePicUsers = []
    let defaultPicUsers = []
    for(let i in users){
        if(users[i].slackProfileImage.startsWith("https://avatars.slack-edge.com"))
            profilePicUsers.push(users[i])
        else
            defaultPicUsers.push(users[i])
    } 
    profilePicUsers.push(...defaultPicUsers)
    return profilePicUsers
}

let setActiveNow = function(userId){
    return UserModel.setActiveNow(userId)
}

module.exports = {
    addUser,
    addUserEvents,
    addListOfUsers,
    getUsersBySlackIds,
    getUserBySlackId,
    updateUserOnboardingDone,
    getUserById,
    setTempContext,
    getRecentActiveUsers,
    setActiveNow
}