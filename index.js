const QS = require("emfit-qs");

const fs = require("fs");
const moment = require("moment");
const jsonfile = require("jsonfile");
const yaml_config = require("node-yaml-config");
const config = yaml_config.load(__dirname + "/config.yml");
const log4js = require("log4js");
const logger = log4js.getLogger();
const fetch = require("node-fetch");
const { Webhook, MessageBuilder } = require("discord-webhook-node");
const hook = new Webhook(config.discord.webhook);

logger.level = "debug";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var qs = new QS();

sendChatMessage = function (message) {
  console.log(message);

  // hook.send(embed);
  try {
    hook.send(message);
  } catch (error) {
    console.error(error);
  }
};

sleepMessage = function (sleepObj, userid, name) {
  let end = new Date(sleepObj.time_end * 1000);
  end = moment(end).format("h:mm A");
  let start = new Date(sleepObj.time_start * 1000);
  start = moment(start).format("h:mm A");

  var sleep_length = Math.round(sleepObj.sleep_duration / 60 / 60);
  var sleep_judgement = "";

  if (sleep_length >= 8) {
    sleep_judgement = "😃";
    sleep_judgement_image =
      "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/271/grinning-face-with-big-eyes_1f603.png";
  } else if (sleep_length >= 7) {
    sleep_judgement = "😀";
    sleep_judgement_image =
      "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/271/grinning-face_1f600.png";
  } else if (sleep_length <= 6) {
    sleep_judgement = "😴";
    sleep_judgement_image =
      "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/271/sleeping-face_1f634.png";
  }

  var message = `Hi <@${userid}> \n\n`;

  message =
    message +
    `You slept about *${sleep_length}* hours (*${sleepObj.sleep_class_light_percent}%* light, *${sleepObj.sleep_class_rem_percent}%* REM and *${sleepObj.sleep_class_deep_percent}%* deep). \n\n`;
  message =
    message +
    `💤 It took you about *${Math.round(
      sleepObj.sleep_onset_duration / 60
    )}* minutes to fall asleep and you got up about *${
      sleepObj.bed_exit_count
    }* times. \n\n`;
  message =
    message +
    `🛌🏽 You went to bed around *${start}* and got out of bed around *${end}* \n`;

  const embed = new MessageBuilder()
    .setTitle(`Good Morning, ${name}`)
    .addField("Sleep Score", `*${sleepObj.sleep_score}* out of a 100.`, true)
    .addField("HRV Morning", `${sleepObj.hrv_rmssd_morning}`, true)
    .addField("HRV Evening", `${sleepObj.hrv_rmssd_evening}`, true)
    .addField("Sleep length", `*${sleep_length}* hours`, true)
    .addField("Bed time", `*${start}*`, true)
    .addField("Wake up time", `*${end}*`, true)
    .setThumbnail(sleep_judgement_image)
    .setDescription(message)
    .setTimestamp();

  return embed;
};

updateState = function (deviceId) {
  var stateFile = config.emfit.stateFile;

  jsonfile.readFile(stateFile, function (err, obj) {
    if (obj == undefined) {
      obj = {};
      obj[deviceId] = moment().format("L");
    } else {
      obj[deviceId] = moment().format("L");
    }
    jsonfile.writeFile(stateFile, obj, function (err) {
      if (err) {
        logger.error(err);
      } else {
        logger.debug("Updated statefile: " + stateFile);
      }
    });
    return false;
  });
};

getState = function (deviceId) {
  var stateFile = config.emfit.stateFile;
  var state = "";

  obj = jsonfile.readFileSync(stateFile);

  if (obj == undefined) {
    logger.debug("File isn't initialized");
    state = true;
  }
  todayDate = moment().format("L");

  if (todayDate == obj[deviceId]) {
    logger.debug("Already sent message");
    state = false;
  } else {
    logger.debug("message isn't sent yet");
    state = true;
  }
  logger.debug(state);
  return state;
};

if (!fs.existsSync(config.emfit.stateFile)) {
  jsonfile.writeFile(config.emfit.stateFile, {}, function (err) {
    if (err) {
      logger.error(err);
    } else {
      logger.debug("initialized statefile: " + config.emfit.stateFile);
    }
  });
}

qs.login(config.emfit.username, config.emfit.password).then(function (data) {
  qs.user()
    .then(function (data) {
      data.device_settings.forEach(function (deviceSettings) {
        let deviceId = deviceSettings.device_id;
        if (getState(deviceId)) {
          // get latest data for first device found
          qs.latest(deviceId).then(function (sleep) {
            device = config.emfit.devices[sleep.device_id];
            if (device != undefined) {
              sleepEndDate = moment(sleep.time_end * 1000).format("YYYY MM DD");
              todayDate = moment().format("YYYY MM DD");
              if (sleepEndDate == todayDate) {
                logger.debug("Generating message for " + device.name);
                sleep.name = device.name;
                let cards = sleepMessage(sleep, device.discord_at, device.name);
                logger.debug("Sending message to " + device.name);
                updateState(deviceId);
                sendChatMessage(cards);
              }
            }
          });
        }
      });
    })
    .catch(function (error) {
      logger.error(error);
    });
});
