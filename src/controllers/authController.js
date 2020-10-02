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

const redisClient = require('../services/redisService').redis_client
const teamController = require('../controllers/teamController')

let getTokenCacheKey = function(teamId){
    return `tokenCache:${teamId}`
}

let getUserCacheKey = function(teamId){
    return `userCache:${teamId}`
}

let setTokenCacheFor = function(teamId, token, callback){
    let key = getTokenCacheKey(teamId)
    redisClient.set(key, token, callback)
}

let getTokenCacheFor = function(teamId, callback){
    let key = getTokenCacheKey(teamId)
    redisClient.get(key, callback)
}

let setUserCacheFor = function(teamId, userId, callback){
    let key = getUserCacheKey(teamId)
    redisClient.set(key, userId, callback)
}

let getUserCacheFor = function(teamId, callback){
    let key = getUserCacheKey(teamId)
    redisClient.get(key, callback)
}

let setTeamAndTokens = async function(teamId, teamName, authUserId, token, botUserId){
    setTokenCacheFor(teamId, token)
    setUserCacheFor(teamId, botUserId)
    let teamData = {
        slackId: teamId,
        slackWorkspaceName: teamName,
        authedUser: authUserId,
        accessToken: token,
        botUserId: botUserId,
        numberOfUsers: 0,
        lastSyncedAt: Date.now()
    }
    let teamObject = await teamController.createNewTeam(teamData)
    return teamObject
}


async function getTokenForTeam(teamId) {
    return new Promise((resolve, reject) => {
        setTimeout(function() {
            getTokenCacheFor(teamId, function(err, token){
                if(err || !token){
                    console.error('Team not found in tokenCache: ', teamId)
                    reject('Team not found')
                    return
                }
                resolve(token)
            })
        }, 150)
    })
}

async function getBotUserByTeam(teamId) {
    return new Promise((resolve, reject) => {
        setTimeout(function() {
            getUserCacheFor(teamId, function(err, user){
                if(err || !user){
                    console.error('Team not found in userCache: ', teamId)
                    reject('Team not found')
                    return
                }
                resolve(user)
            })
        }, 150)
    })
}



module.exports = {
    setTeamAndTokens,
    getTokenForTeam,
    getBotUserByTeam
}