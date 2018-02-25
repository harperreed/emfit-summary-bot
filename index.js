const QS = require('emfit-qs');

const fs = require('fs');
const moment = require('moment');
const jsonfile = require('jsonfile')
const yaml_config = require('node-yaml-config');
const config = yaml_config.load(__dirname + '/config.yml');
const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'debug';

var qs = new QS()

const client = require('twilio')(config.twilio.accountSid, config.twilio.authToken);


sendSMS = function(number, message){
  client.messages
  .create({
    to: number,
    from: config.twilio.fromNumber,
    body: message,
  })
  .then(message => logger.debug(message.sid));
}

sleepMessage = function(sleepObj){

  let end = new Date(sleepObj.time_end * 1000)
  end = moment(end).format("h:mm A");
  let start = new Date(sleepObj.time_start * 1000)
  start = moment(start).format("h:mm A");

  var message = "Good Morning, "+ sleepObj.name+"! "
  var sleep_length = Math.round(sleepObj.sleep_duration /60/60)
  var sleep_judgement = ""

  if (sleep_length >8){
    sleep_judgement = "😃"
  }else if (sleep_length >7){
    sleep_judgement = "😀"
  }else if (sleep_length <6){
    sleep_judgement = "😴"
  }



  message = message + sleep_judgement + "\n\n"
  message = message +'You slept about ' + sleep_length + ' hours \n('
  message = message + sleepObj.sleep_class_light_percent + "% light, " + sleepObj.sleep_class_rem_percent + "% REM and "+ sleepObj.sleep_class_deep_percent + "% deep). \n\n"

  message = message + "💤 It took you about " + Math.round(sleepObj.sleep_onset_duration/60) + " minutes to fall asleep and "
  message = message + "you got up about " + sleepObj.bed_exit_count + " times. \n\n"
  message = message + "🛌🏽 You went to bed around " + start + " and got out of bed around " + end +".\n\n"
  message = message + "📈 Last night your sleep score was "+ sleepObj.sleep_score + " out of a 100."

  return message
}

updateState = function(deviceId){
  var stateFile = config.emfit.stateFile
  
  jsonfile.readFile(stateFile, function(err, obj) {
    if (obj == undefined){
      obj = {}
      obj[deviceId] = moment().format("L")
    }else{
      obj[deviceId] = moment().format("L")  
    }
    jsonfile.writeFile(stateFile, obj, function (err) {
      if (err){
        logger.error(err)  
      }else{
        logger.debug("Updated statefile: " + stateFile)
      }
    })
    return false
  })
  
}

getState = function(deviceId){
  var stateFile = config.emfit.stateFile
  var state = ""
 
  obj = jsonfile.readFileSync(stateFile) 
  if (obj == undefined){
    logger.debug("File isn't initialized")
    state= true
  }
  todayDate = moment().format("L");
  
  if (todayDate == obj[deviceId]){
    logger.debug("Already sent message")
    state= false
  }else{
    logger.debug("message isn't sent yet")
    state=  true
  }
  return state
}


if (!fs.existsSync(config.emfit.stateFile)) {
  jsonfile.writeFile(config.emfit.stateFile, {}, function (err) {
    if (err){
      logger.error(err)  
    }else{
      logger.debug("initialized statefile: " + config.emfit.stateFile)
    }
  })
}



qs.login(config.emfit.username, config.emfit.password).then(function(data) {
  qs.user().then(function(data) {
    data.device_settings.forEach(function(deviceSettings) {
      let deviceId = deviceSettings.device_id
      if (getState(deviceId)){
        // get latest data for first device found
        qs.latest(deviceId).then(function (sleep) {
          // dump all data
          jsonfile.writeFile("sleep"+deviceId+".json", sleep, function (err) {
          if (err){
        logger.error(err)  
      }
    })
          
          device = config.emfit.devices[sleep.device_id]
          if (device != undefined){
            sleepEndDate = moment(sleep.time_end* 1000).format("YYYY MM DD");
            todayDate = moment().format("YYYY MM DD");
            if (sleepEndDate==todayDate){
              if(moment(sleep.time_end* 1000).add(1, 'hour').isBefore(moment())){
                logger.debug("Generating message for " + device.name)
                sleep.name = device.name
                let message = sleepMessage(sleep)
                logger.debug("Sending message to " + device.number)
                sendSMS(device.number,message)
                updateState(deviceId)
              }else{
                logger.debug("not time yet time to send message to " + device.name)
              }
            }

          }
        })
      }
    })
  }).catch(function(error){
    logger.error(error)
  })
})

