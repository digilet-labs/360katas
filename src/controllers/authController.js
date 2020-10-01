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