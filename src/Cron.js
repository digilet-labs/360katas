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

const CronJob = require('cron').CronJob
const cronController =require('./controllers/cronController')

let setupCronJobs = function(botKitController){
    // Every 1 minute
    // Finish Ongoing Feedback Requests if all responses received.
    new CronJob('* * * * *', function() {
        console.log('Beat: Finish Ongoing Feedback Requests if all responses received.')
        try {
            cronController.finishCompletedOngoingRequests(botKitController)
        } catch (error) {
            console.log(error)
        }
        return
    }).start()

    // Every day
    // Conclude Finished Feedback Requests
    new CronJob('0 0 * * *', function(){
        console.log('Beat: Conclude Finished Feedback Requests')
        return cronController.concludeFinishedRequests()
    }).start()

    // Every 1 minute
    // Send Auto Reminders of Feedback Requests.
    new CronJob('* * * * *', function() {
        console.log('Beat: Send Auto Reminders of Feedback Requests.')
        return cronController.sendFeedbackRequestsAutoReminders(botKitController)
    }).start()

    // Every 1 minute
    // Repeat Auto Repeating Requests
    new CronJob('* * * * *', function() {
        console.log('Beat: Repeat Auto Repeating Requests')
        return cronController.repeatAutoRepeatingRequests(botKitController)
    }).start()

    // Every 1 minute
    // Send extend due date requests to soon expiring requests
    new CronJob('* * * * *', function() {
        console.log('Beat: Send extend due date requests to soon expiring requests')
        return cronController.sendSoonExpiringRequestMessages(botKitController)
    }).start()


    // Every 1 minute
    // Send scheduled messages
    new CronJob('* * * * *', function() {
        console.log('Beat: Send scheduled messages')
        return cronController.sendScheduledMessages(botKitController)
    }).start()
    

}


module.exports = setupCronJobs