const needle = require('needle')

let postNewWorkspaceAddedMessage = async function(workspaceName, username, timezone, workspaceStrength){
    let message = (process.env.ENV_TYPE === 'stage') ? '[STAGE] ' : ''
    message += `New workspace added.\nWorkspace name: ${workspaceName}\nUser: ${username}\nTimezone: ${timezone}\nWorkspace strength: ${workspaceStrength}`
    let url = 'https://hooks.slack.com/services/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'
    let body = { "text": message }
    await needle('post', url, body, { json: true })
}

let postWorkspaceRemovedMessage = async function(workspaceName, workspaceStrength){
    let message = (process.env.ENV_TYPE === 'stage') ? '[STAGE] ' : ''
    message += `Workspace Removed.\nWorkspace name: ${workspaceName}\nWorkspace strength: ${workspaceStrength}`
    let url = 'https://hooks.slack.com/services/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'
    let body = { "text": message }
    await needle('post', url, body, { json: true })
}

let postNewFeedbackRequestMessage = async function(workspaceName, username, timezone, workspaceStrength, numberOfUsers){
    let message = (process.env.ENV_TYPE === 'stage') ? '[STAGE] ' : ''
    message += `New feedback request sent.\nWorkspace name: ${workspaceName}\nUser: ${username}\nTimezone: ${timezone}\nWorkspace strength: ${workspaceStrength}\nNumber of participants: ${numberOfUsers}`
    let url = 'https://hooks.slack.com/services/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'
    let body = { "text": message }
    await needle('post', url, body, { json: true })
}

let postNewResponseReceivedMessage = async function(workspaceName, username, feedbackReqUser, timezone, workspaceStrength, receivedResponses, totalResponses){
    let message = (process.env.ENV_TYPE === 'stage') ? '[STAGE] ' : ''
    message += `New response sent.\nWorkspace name: ${workspaceName}\nUser: ${username}\nTo User: ${feedbackReqUser}\nTimezone: ${timezone}\nWorkspace strength: ${workspaceStrength}\nResponses Received: ${receivedResponses}/${totalResponses}`
    let url = 'https://hooks.slack.com/services/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'
    let body = { "text": message }
    await needle('post', url, body, { json: true })
}

let postRequestReviewedMessage = async function(workspaceName, username, timezone, workspaceStrength, receivedResponses, totalResponses){
    let message = (process.env.ENV_TYPE === 'stage') ? '[STAGE] ' : ''
    message += `Request reviewed.\nWorkspace name: ${workspaceName}\nUser: ${username}\nTimezone: ${timezone}\nWorkspace strength: ${workspaceStrength}\nResponses Received: ${receivedResponses}/${totalResponses}`
    let url = 'https://hooks.slack.com/services/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'
    let body = { "text": message }
    await needle('post', url, body, { json: true })
}

let postMessageReviewedMessage = async function(workspaceName, username, slackMessage){
    let message = (process.env.ENV_TYPE === 'stage') ? '[STAGE] ' : ''
    message += `Message recieved.\nWorkspace name: ${workspaceName}\nUser: ${username}\nMessage: ${slackMessage}`
    let url = 'https://hooks.slack.com/services/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'
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