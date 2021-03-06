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

const ResponseModel = require('../models/responseModel')
const userController = require('./userController')


let addResponses = async function(userId, feedbackReqId, questions, responses){
    let responsesList = []
    responses.forEach((response, index) => {
        responsesList.push({
            feedbackId: feedbackReqId,
            questionText: questions[index],
            responseText: response,
            responseById: userId,
            replies: []
        })
    })
    let returnresponses = await ResponseModel.addListOfResponses(responsesList)
    await userController.setActiveNow(userId)
    return returnresponses
}


let getResponsesForRequest = async function(feedbackReqId){
    let responses = await ResponseModel.getResponsesForRequest(feedbackReqId)
    let result = {responses: {}}
    let responseType
    let peersList
    let managersList
    let reporteesList
    responses.forEach((response) => {
        if(!('feedbackRequest' in result)){
            result['feedbackRequest'] = response.feedbackId
            responseType = response.feedbackId.classifyResponseType()
            peersList = response.feedbackId.peersList.map(x => x.id)
            managersList = response.feedbackId.managersList.map(x => x.id)
            reporteesList = response.feedbackId.reporteesList.map(x => x.id)
        }
        if(responseType === 'PMR'){
            if(!result.responses[response.questionText]){
                result.responses[response.questionText] = {'peers': [], 'managers':[],'reportees':[]}
            }
            if(response.responseById.id in peersList){
                result.responses[response.questionText].peers.push(response)
            } else if(response.responseById.id in managersList){
                result.responses[response.questionText].managers.push(response)
            } else if(response.responseById.id in reporteesList){
                result.responses[response.questionText].reportees.push(response)
            } else {
                result.responses[response.questionText].self = [response]
            }
        } else if (responseType === 'P'){
            if(!result.responses[response.questionText]){
                result.responses[response.questionText] = {'peers': [], 'others':[]}
            }
            if(response.responseById.id in peersList){
                result.responses[response.questionText].peers.push(response)
            } else if (response.responseById.id in managersList || response.responseById.id in reporteesList){
                result.responses[response.questionText].others.push(response)
            } else {
                result.responses[response.questionText].self = [response]
            }
        } else if (responseType === 'M'){
            if(!result.responses[response.questionText]){
                result.responses[response.questionText] = {'managers': [], 'others':[]}
            }
            if(response.responseById.id in managersList){
                result.responses[response.questionText].managers.push(response)
            } else if (response.responseById.id in peersList || response.responseById.id in reporteesList){
                result.responses[response.questionText].others.push(response)
            } else {
                result.responses[response.questionText].self = [response]
            }
        } else if (responseType === 'R'){
            if(!result.responses[response.questionText]){
                result.responses[response.questionText] = {'reportees': [], 'others':[]}
            }
            if(response.responseById.id in reporteesList){
                result.responses[response.questionText].reportees.push(response)
            } else if (response.responseById.id in managersList || response.responseById.id in peersList){
                result.responses[response.questionText].others.push(response)
            } else {
                result.responses[response.questionText].self = [response]
            }
        } else {
            if(!result.responses[response.questionText]){
                result.responses[response.questionText] = {'all':[]}
            }
            if(response.responseById.id === response.feedbackId.userId.id){
                result.responses[response.questionText].self = [response]
            } else {
                result.responses[response.questionText].all.push(response)
            }
        }
    })
    console.log(result)
    return result
}

let getPendingClarificationResponses = function(userId){
    return ResponseModel.getPendingClarificationResponses(userId)
}

let setClarificationQuestion = function(responseId, clarificationQuestion){
    return ResponseModel.setClarificationQuestion(responseId, clarificationQuestion)
}

let setClarificationAnswer = function(responseId, clarificationAnswer){
    return ResponseModel.setClarificationAnswer(responseId, clarificationAnswer)
}

let getResponseById = function(responseId){
    return ResponseModel.getResponseById(responseId)
}

module.exports = {
    addResponses,
    getResponsesForRequest,
    setClarificationQuestion,
    setClarificationAnswer,
    getResponseById,
    getPendingClarificationResponses
}