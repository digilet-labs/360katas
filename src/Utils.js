const { random } = require("underscore")
const Constants = require("./Constants")

let formatDate = function(timestamp, tzOffset) {
    let date = new Date(timestamp)
    let tzTimestamp = timestamp + date.getTimezoneOffset() * 60000 +  tzOffset * 1000
    var monthNames = [
      "Jan", "Feb", "Mar",
      "Apr", "May", "Jun", "Jul",
      "Aug", "Sep", "Oct",
      "Nov", "Dec"
    ]
    date = new Date(tzTimestamp)
    var day = date.getDate()
    var monthIndex = date.getMonth()
    var year = date.getFullYear()

    return day + '-' + monthNames[monthIndex] + '-' + year
}

let formatTime = function(timestamp, tzOffset) {
  let date = new Date(timestamp)
  let tzTimestamp = timestamp + date.getTimezoneOffset() * 60000 +  tzOffset * 1000
  date = new Date(tzTimestamp)
  var hours = date.getHours()
  var minutes = date.getMinutes()
  var ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12 // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes
  var strTime = hours + ':' + minutes + ' ' + ampm
  return strTime
}

let timestampToSlackDateFormat = function(timestamp, tzOffset){
  let date = new Date(timestamp)
  let tzTimestamp = timestamp + date.getTimezoneOffset() * 60000 + tzOffset * 1000
  date = new Date(tzTimestamp)
  var day = date.getDate()
  var monthIndex = date.getMonth()
  var year = date.getFullYear()
  return year + '-' + String(monthIndex+1).padStart(2, '0') + '-' + String(day).padStart(2, '0')
}

let slackDateToTimestamp = function(slackDate, tzOffset, offset = 12 * 60 * 60 * 1000 ){
  let timestamp = Date.parse(`${slackDate}T00:00:00.000Z`)
  timestamp = timestamp - tzOffset * 1000 + offset
  return timestamp
}

let getAnonymousEmoji = function(index){
  let array = [':dog:',':cat2:',':fish:',':rabbit2:',':ox:',':whale:',':elephant:',':cow2:',':whale2:',':tiger2:',':monkey:',':hatched_chick:',':pig2:',':dolphin:',':dog2:',':wolf:']
  let i = index % array.length 
  return array[i]
}

let randomScheduledTime = function(){
  let dateNow = Date.now()
  let min = 15
  let max = 31
  let randomx =  Math.floor(Math.random() * (max - min) + min); 
  return dateNow + randomx * 60 * 1000
}

module.exports = {
    formatDate,
    timestampToSlackDateFormat,
    slackDateToTimestamp,
    getAnonymousEmoji,
    formatTime,
    randomScheduledTime
}