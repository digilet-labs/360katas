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

let ENV_TYPE = process.env.ENV_TYPE || "stage"


let AMPLITUDE_KEY = ""
let REDIS_URL = "localhost"
let WEBSITE_HOST = "http://<yourslackapp>.com/"
let IS_LIVE = ENV_TYPE === "prod"

if(ENV_TYPE === "prod"){
    AMPLITUDE_KEY = ""
    REDIS_URL = "<redis-url>"
    WEBSITE_HOST = "http://<yourslackapp>.com/"
}


let FEEDBACK_REQ_STATUS = {
    ONGOING: 'ONGOING',
    SUBMITTED: 'SUBMITTED',
    CLARIFICATION: 'CLARIFICATION',
    CONCLUDED: 'CONCLUDED'
}

let USER_EVENTS = {
    APP_HOME_OPENED: 'APP_HOME_OPENED',
    FIRST_MESSAGE_SENT: 'FIRST_MESSAGE_SENT',
    REQUEST_RECIEVED: 'REQUEST_RECIEVED',
    FEEDBACK_SENT: 'FEEDBACK_SENT',
    FEEDBACK_RECIEVED: 'FEEDBACK_RECIEVED'
}

let QUESTIONS = {
    QUESTION1: 'What did I *do well* last month and should continue doing?',
    QUESTION2: 'What should I *start doing* next month?',
    QUESTION3: 'What should I *stop doing*?',
    PERSONAL: {
        QUESTION1: '*3 adjectives* that come to your mind when you think about me?',
        QUESTION2: 'If I were a car, *what brand* would I be? and why?',
        QUESTION3: 'If you are assembling a *team for a Mars Mission*, what would my role be in it?'
    },
    SKILLS:{
        QUESTION1: 'What are my *greatest strengths?*',
        QUESTION2: 'What are my *areas of improvement?*'
    },
    WORK: {
        QUESTION1: 'What did I *do well* last month and should continue doing?',
        QUESTION2: 'What should I *start doing* next month?',
        QUESTION3: 'What should I *stop doing*?'
    }
}

let TIME = {
    ONE_HOUR:  60 * 60 * 1000,
    ONE_DAY: 24 * 60 * 60 * 1000,
    ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
    ONE_MONTH: 30 * 24 * 60 * 60 * 1000,
}

let MESSAGE_TYPE = {
    INCOMING_FEEDBACKREQ_MESSAGE: 'INCOMING_FEEDBACKREQ_MESSAGE',
    FEEDBACK_SENT_MESSAGE: 'FEEDBACK_SENT_MESSAGE',
    FIRST_MESSAGE: 'FIRST_MESSAGE',
    RESPOND_MESSAGE: 'RESPOND_MESSAGE',
    CLARIFICATION_MESSAGE: 'CLARIFICATION_MESSAGE',
    CLARIFICATION_MESSAGE_SCHEDULED: 'CLARIFICATION_MESSAGE_SCHEDULED',
    RESPOND_TO_CLARIFICATION_MESSAGE_SCHEDULED: 'RESPOND_TO_CLARIFICATION_MESSAGE_SCHEDULED',
    REMINDER_MESSAGE: 'REMINDER_MESSAGE',
    EXTEND_MESSAGE: 'EXTEND_MESSAGE',
    REQ_EXTENDED_MESSAGE: 'REQ_EXTENDED_MESSAGE',
    FEEDBACK_REQ_REMINDER_MESSAGE: 'FEEDBACK_REQ_REMINDER_MESSAGE',
    FEEDBACK_REVIEW_SELF_CLARIF_MESSAGE: 'FEEDBACK_REVIEW_SELF_CLARIF_MESSAGE'
}

module.exports = {
    IS_LIVE,
    AMPLITUDE_KEY,
    REDIS_URL,
    WEBSITE_HOST,
    TIME,
    USER_EVENTS,
    FEEDBACK_REQ_STATUS,
    QUESTIONS,
    MESSAGE_TYPE,
}
