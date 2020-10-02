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

const teamController = require("../../src/controllers/teamController")

let getAddTeamTreeModal = function(){
    let modal = {
        "type": "modal",
        "callback_id": "internal_flow.add_team_tree",
        "title": {
            "type": "plain_text",
            "text": "Add Team Tree",
            "emoji": true
        },
        "submit": {
            "type": "plain_text",
            "text": "Submit",
            "emoji": true
        },
        "close": {
            "type": "plain_text",
            "text": "Cancel",
            "emoji": true
        },
        "blocks": [
            {
                "type": "input",
                "element": {
                    "type": "plain_text_input",
                    "action_id": "team_id"
                },
                "label": {
                    "type": "plain_text",
                    "text": "Team ID",
                    "emoji": true
                },
                "block_id": "team_id"
            },
            {
                "type": "input",
                "element": {
                    "type": "plain_text_input",
                    "action_id": "image_url"
                },
                "label": {
                    "type": "plain_text",
                    "text": "Image URL",
                    "emoji": true
                },
                "block_id": "image_url"
            },
            {
                "type": "input",
                "element": {
                    "type": "plain_text_input",
                    "action_id": "tree_url"
                },
                "label": {
                    "type": "plain_text",
                    "text": "Tree URL",
                    "emoji": true
                },
                "block_id": "tree_url"
            },
            {
                "type": "input",
                "element": {
                    "type": "plain_text_input",
                    "action_id": "tree_location"
                },
                "label": {
                    "type": "plain_text",
                    "text": "Tree Location",
                    "emoji": true
                },
                "block_id": "tree_location"
            },
            {
                "type": "input",
                "element": {
                    "type": "datepicker",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select a date",
                        "emoji": true
                    },
                    "action_id": "planted_date"
                },
                "label": {
                    "type": "plain_text",
                    "text": "Planted Date",
                    "emoji": true
                },
                "block_id": "planted_date"
            },
            {
                "type": "input",
                "element": {
                    "type": "plain_text_input",
                    "action_id": "beneficiary_name"
                },
                "label": {
                    "type": "plain_text",
                    "text": "Beneficiary Name",
                    "emoji": true
                },
                "block_id": "beneficiary_name"
            },
            {
                "type": "input",
                "element": {
                    "type": "plain_text_input",
                    "action_id": "beneficiary_image"
                },
                "label": {
                    "type": "plain_text",
                    "text": "Beneficiary Image URL",
                    "emoji": true
                },
                "block_id": "beneficiary_image"
            },
            {
                "type": "input",
                "element": {
                    "type": "plain_text_input",
                    "multiline": true,
                    "action_id": "beneficiary_desc"
                },
                "label": {
                    "type": "plain_text",
                    "text": "Beneficiary Description",
                    "emoji": true
                },
                "block_id": "beneficiary_desc"
            },
            {
                "type": "input",
                "element": {
                    "type": "plain_text_input",
                    "action_id": "tree_species"
                },
                "label": {
                    "type": "plain_text",
                    "text": "Species",
                    "emoji": true
                },
                "block_id": "tree_species"
            },
        ]
    }
    return modal
}

let showAddTeamTreeModal = async function(bot, message){
    let modalView = getAddTeamTreeModal()
    let postData = { 
        token: bot.api.token,
        trigger_id: message.incoming_message.channelData.trigger_id,
        view: modalView
    }
    await bot.api.views.open(postData)
}

let processAddTeamTreeModal = async function(bot, message){
    let messageStateValues = message.view.state.values
    let teamId = messageStateValues.team_id.team_id.value
    let imageUrl = messageStateValues.image_url.image_url.value
    let treeUrl = messageStateValues.tree_url.tree_url.value
    let treeLocation = messageStateValues.tree_location.tree_location.value
    let plantedDate = messageStateValues.planted_date.planted_date.selected_date
    let beneficiaryName = messageStateValues.beneficiary_name.beneficiary_name.value
    let beneficiaryImage = messageStateValues.beneficiary_image.beneficiary_image.value
    let beneficiaryDesc = messageStateValues.beneficiary_desc.beneficiary_desc.value
    let plantSpecies = messageStateValues.tree_species.tree_species.value
    await teamController.setTeamTree(teamId, imageUrl, treeUrl, treeLocation, plantedDate, beneficiaryName, beneficiaryImage, beneficiaryDesc, plantSpecies)
    await bot.startPrivateConversation(message.internal_user.slackId)
    await bot.say("added team tree")
}

module.exports = {
    showAddTeamTreeModal,
    processAddTeamTreeModal
}