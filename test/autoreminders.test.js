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

const assert = require('assert');
const feedbackRequestController = require('../src/controllers/feedbackRequestController');
const Constants = require('../src/Constants')


describe('Auto Reminders Test', () => {
    it('case for 1 day request', () => {
        let result = runAutoReminders(1)
        assert.strictEqual(result, 1);
    });

    it('case for 2 day request', () => {
        let result = runAutoReminders(2)
        assert.strictEqual(result, 1);
    });

    it('case for 4 day request', () => {
        let result = runAutoReminders(4)
        assert.strictEqual(result, 2);
    });

    it('case for 7 day request', () => {
        let result = runAutoReminders(7)
        assert.strictEqual(result, 3);
    });

    it('case for 11 day request', () => {
        let result = runAutoReminders(11)
        assert.strictEqual(result, 4);
    });

    it('case for 16 day request', () => {
        let result = runAutoReminders(16)
        assert.strictEqual(result, 4);
    });
});

let runAutoReminders = function(days){
    let dateNow = Date.now()
    let closeTimestamp = dateNow + Constants.TIME.ONE_DAY * days
    let current = dateNow
    let nextAutoReminder = current - 1
    let totalReminders = 0
    while(current < closeTimestamp){
        if(nextAutoReminder < current){
            let x = feedbackRequestController.getNextAutoReminder(dateNow, closeTimestamp, current)            
            nextAutoReminder = x
            if (x !== closeTimestamp + Constants.TIME.ONE_WEEK)
                totalReminders += 1
        }
        current += 60 * 1000
    }
    return totalReminders
}