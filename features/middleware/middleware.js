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

const userController = require("../../src/controllers/userController")
const Constants = require("../../src/Constants")

let middlewareFunction = async function (bot, message, next) { 
    let user
    if(message.user && typeof message.user === "string")
        user = await userController.getUserBySlackId(message.user)
    else if (message.user && typeof message.user.id === "string")
        user = await userController.getUserBySlackId(message.user.id)
    if(user){
        message.internal_user = user
    }
    next()
}

module.exports = {
    middlewareFunction
}