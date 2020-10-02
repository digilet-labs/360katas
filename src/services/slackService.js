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

const needle = require('needle')

let postNewWorkspaceAddedMessage = async function(workspaceName, username, timezone, workspaceStrength){
    let message = (process.env.ENV_TYPE === 'stage') ? '[STAGE] ' : ''
    message += `New workspace added.\nWorkspace name: ${workspaceName}\nUser: ${username}\nTimezone: ${timezone}\nWorkspace strength: ${workspaceStrength}`
    let url = '<slack webhook url>'
    let body = { "text": message }
    await needle('post', url, body, { json: true })
}

let postWorkspaceRemovedMessage = async function(workspaceName, workspaceStrength){
    let message = (process.env.ENV_TYPE === 'stage') ? '[STAGE] ' : ''
    message += `Workspace Removed.\nWorkspace name: ${workspaceName}\nWorkspace strength: ${workspaceStrength}`
    let url = '<slack webhook url>'
    let body = { "text": message }
    await needle('post', url, body, { json: true })
}

let postNewFeedbackRequestMessage = async function(workspaceName, username, timezone, workspaceStrength, numberOfUsers){
    let message = (process.env.ENV_TYPE === 'stage') ? '[STAGE] ' : ''
    message += `New feedback request sent.\nWorkspace name: ${workspaceName}\nUser: ${username}\nTimezone: ${timezone}\nWorkspace strength: ${workspaceStrength}\nNumber of participants: ${numberOfUsers}`
    let url = '<slack webhook url>'
    let body = { "text": message }
    await needle('post', url, body, { json: true })
}

let postNewResponseReceivedMessage = async function(workspaceName, username, feedbackReqUser, timezone, workspaceStrength, receivedResponses, totalResponses){
    let message = (process.env.ENV_TYPE === 'stage') ? '[STAGE] ' : ''
    message += `New response sent.\nWorkspace name: ${workspaceName}\nUser: ${username}\nTo User: ${feedbackReqUser}\nTimezone: ${timezone}\nWorkspace strength: ${workspaceStrength}\nResponses Received: ${receivedResponses}/${totalResponses}`
    let url = '<slack webhook url>'
    let body = { "text": message }
    await needle('post', url, body, { json: true })
}

let postRequestReviewedMessage = async function(workspaceName, username, timezone, workspaceStrength, receivedResponses, totalResponses){
    let message = (process.env.ENV_TYPE === 'stage') ? '[STAGE] ' : ''
    message += `Request reviewed.\nWorkspace name: ${workspaceName}\nUser: ${username}\nTimezone: ${timezone}\nWorkspace strength: ${workspaceStrength}\nResponses Received: ${receivedResponses}/${totalResponses}`
    let url = '<slack webhook url>'
    let body = { "text": message }
    await needle('post', url, body, { json: true })
}

let postMessageReviewedMessage = async function(workspaceName, username, slackMessage){
    let message = (process.env.ENV_TYPE === 'stage') ? '[STAGE] ' : ''
    message += `Message recieved.\nWorkspace name: ${workspaceName}\nUser: ${username}\nMessage: ${slackMessage}`
    let url = '<slack webhook url>'
    let body = { "text": message }
    await needle('post', url, body, { json: true })
}

module.exports = {
    postNewWorkspaceAddedMessage,
    postWorkspaceRemovedMessage,
    postNewFeedbackRequestMessage,
    postNewResponseReceivedMessage,
    postRequestReviewedMessage,
    postMessageReviewedMessage
}