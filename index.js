const QS = require("emfit-qs");

const fs = require('fs').promises; // Use the fs promises API
const axios = require("axios");
const moment = require("moment");
const jsonfile = require("jsonfile");
const yaml_config = require("node-yaml-config");
const { OpenAI } = require("openai");
var Pushover = require( 'pushover-notifications' )
const config = yaml_config.load(__dirname + "/config.yml");
const log4js = require("log4js");
const logger = log4js.getLogger();


var push = new Pushover({
	token: config.pushover.apikey,
	user: config.pushover.userkey
});

const configuration = {
  apiKey: config.openai.apikey,
  baseURL:  "https://openaiproxy-baxvbakvia-uc.a.run.app/v1",
};
const openai = new OpenAI(configuration);

logger.level = "debug";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var qs = new QS();

/**
 * Converts a UNIX timestamp to a formatted date string.
 *
 * @param {number} timestamp - The UNIX timestamp to convert.
 * @param {Object} [options={timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit"}] - Optional formatting options.
 * @throws {Error} Throws an error if the timestamp is not a valid number.
 * @returns {string} The formatted date string (YYYY-MM-DD HH:mm:ss) in Central Time by default.
 */
function convertTimestampToDateStr(timestamp, options = {
  timeZone: "America/Chicago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit"
}) {
  if (typeof timestamp !== 'number' || isNaN(timestamp)) {
    throw new Error('Invalid timestamp');
  }

  const date = new Date(timestamp * 1000);
  const dateString = date.toLocaleString("en-US", options).replace(',', '');

  return dateString;
}



/**
 * Converts a given number of seconds into a formatted string representing hours, minutes, and seconds.
 *
 * @param {number} seconds - The total number of seconds to convert.
 * @throws {Error} Throws an error if the input is not a positive number.
 * @returns {string} A string in the format "Xh Ym Zs" representing the equivalent time in hours, minutes, and seconds.
 */
function convertSecondsToHMS(seconds) {
  if (typeof seconds !== 'number' || seconds < 0 || isNaN(seconds)) {
    throw new Error('Invalid input: seconds must be a non-negative number');
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${hours}h ${minutes}m ${remainingSeconds}s`;
}


async function fetchUrl(url) {
  let cache_buster = Date.now() + Math.floor(Math.random() * 1000);
  let full_url = `${url}?cache_buster=${cache_buster}`;

  let response = await axios.get(full_url);
  let html = response.data;
  
  return html;
}



/**
 * Asynchronously sends a chat message via Pushover.
 * 
 * @param {string} subject - The subject line of the message.
 * @param {string} message - The body of the message.
 * @param {string} pushoverUser - The Pushover user key to send the message to.
 * @param {number} priority - The priority level for the Pushover message.
 * @async
 * @throws Will throw an error if message sending fails.
 */
const sendChatMessage = async function (subject, message, pushoverUser, priority) {
  try {
    logger.debug(`Sending message: ${message}`);
    
    const msg = {
      message: message,
      title: subject,
      html: 1,
      priority: priority,
      user: pushoverUser,
    };
  
    const results = await push.send(msg);
  
    logger.debug(`Message sent: ${JSON.stringify(results)}`);
  } catch (error) {
    logger.error(`Error sending message: ${error}`);
    throw error;  // Optionally re-throw error for upstream handling
  }
};


sleepMessage = async function (sleepObj, name) {

  var sleep_length = Math.round(sleepObj.sleep_duration / 60 / 60);

  sleepObj.navigation_data = sleepObj.navigation_data[0];
  sleepObj.sleepLengthInHours = sleep_length;

  trends = []
  for (var i = 0; i < sleepObj.minitrend_datestamps.length; i++) {
    var obj = {};
    obj["date"] = convertTimestampToDateStr(sleepObj.minitrend_datestamps[i].ts);
    obj["weekend"] = sleepObj.minitrend_datestamps[i].isWeekend ? true : false;
    obj["efficiency"] = sleepObj.minitrend_sleep_efficiency[i];
    obj["duration"] = sleepObj.minitrend_sleep_duration[i];
    obj["time_in_bed"] = sleepObj.minitrend_time_in_bed_duration[i];
    obj["score"] = sleepObj.minitrend_sleep_score[i];
    obj['toss_and_turn'] = sleepObj.minitrend_tossnturn_count[i];
    obj["rem_duration"] = sleepObj.minitrend_sleep_class_in_rem_duration[i];
    obj["light_duration"] = sleepObj.minitrend_sleep_class_in_light_duration[i];
    obj["deep_duration"] = sleepObj.minitrend_sleep_class_in_deep_duration[i];
    obj["rem_percent"] = sleepObj.minitrend_sleep_class_in_rem_percent[i];
    obj["light_percent"] = sleepObj.minitrend_sleep_class_in_light_percent[i];
    obj["deep_percent"] = sleepObj.minitrend_sleep_class_in_deep_percent[i];
    obj["bedexit_count"] = sleepObj.minitrend_bedexit_count[i];
    obj["hr_avg"] = sleepObj.minitrend_measured_hr_avg[i];
    obj["hr_max"] = sleepObj.minitrend_measured_hr_max[i];
    obj["hr_min"] = sleepObj.minitrend_measured_hr_min[i];
    obj["rr_avg"] = sleepObj.minitrend_measured_rr_avg[i];
    obj["rr_max"] = sleepObj.minitrend_measured_rr_max[i];
    obj["rr_min"] = sleepObj.minitrend_measured_rr_min[i];
    obj["activity_avg"] = sleepObj.minitrend_measured_activity_avg[i];
    obj["hrv_lf"] = sleepObj.minitrend_hrv_lf[i];
    obj["hrv_rmssd_evening"] = sleepObj.minitrend_hrv_rmssd_evening[i];
    obj["hrv_rmssd_morning"] = sleepObj.minitrend_hrv_rmssd_morning[i];
    obj["hrv_recovery_total"] = sleepObj.minitrend_hrv_recovery_total[i];
    obj["hrv_recovery_integrated"] = sleepObj.minitrend_hrv_recovery_integrated[i];
    obj["hrv_recovery_ratio"] = sleepObj.minitrend_hrv_recovery_ratio[i];
    obj["hrv_recovery_rate"] = sleepObj.minitrend_hrv_recovery_rate[i];
    obj["rmssd_min"] = sleepObj.minitrend_rmssd_min[i];
    obj["rmssd_max"] = sleepObj.minitrend_rmssd_max[i];
    obj["rmssd_avg"] = sleepObj.minitrend_rmssd_avg[i];
    trends.push(obj);
  }



 

  const keysToDelete = [
    'minitrend_bedexit_count',
    'minitrend_datestamps',
    'minitrend_bedexit_count',
    'minitrend_datestamps',
    'minitrend_hrv_lf',
    'minitrend_hrv_recovery_integrated',
    'minitrend_hrv_recovery_rate',
    'minitrend_hrv_recovery_ratio',
    'minitrend_hrv_recovery_total',
    'minitrend_hrv_recovery_total',
    'minitrend_hrv_rmssd_evening',
    'minitrend_hrv_rmssd_morning',
    'minitrend_measured_activity_avg',
    'minitrend_measured_hr_avg',
    'minitrend_measured_hr_max',
    'minitrend_measured_hr_min',
    'minitrend_measured_rr_avg',
    'minitrend_measured_rr_max',
    'minitrend_measured_rr_min',
    'minitrend_rmssd_avg',
    'minitrend_rmssd_max',
    'minitrend_rmssd_min',
    'minitrend_sleep_class_in_deep_duration',
    'minitrend_sleep_class_in_deep_percent',
    'minitrend_sleep_class_in_light_duration',
    'minitrend_sleep_class_in_light_percent',
    'minitrend_sleep_class_in_rem_duration',
    'minitrend_sleep_class_in_rem_percent',
    'minitrend_sleep_duration',
    'minitrend_sleep_efficiency',
    'minitrend_sleep_score_2',
    'minitrend_sleep_score',
    'minitrend_time_in_bed_duration',
    'minitrend_tossnturn_count',
    'sleep_epoch_datapoints',
    'hrv_rmssd_datapoints',
    'measured_datapoints',
    'tossnturn_datapoints',
    'time_start_timestamp',
    'time_user_gmt_offset',
    'time_start_gmt_offset',
    'time_start_string',
    'time_end_string',
    'from_utc',
    'to_utc',
    'note',
    'object_id',
    'nodata_periods',
    'snoring_data',
    'navigation_data',
    'from_utc',
    'to_utc',
    'system_nodata_periods',
    'id',
    'device_id',
    'hrv_rmssd_hist_data',
  ];
  keysToDelete.forEach(key => delete sleepObj[key]);
  

  sleepObj.sleep_class_light_duration = convertSecondsToHMS(sleepObj.sleep_class_light_duration)
  sleepObj.time_duration = convertSecondsToHMS(sleepObj.time_duration)
  sleepObj.sleep_class_deep_duration = convertSecondsToHMS(sleepObj.sleep_class_deep_duration)
  sleepObj.sleep_class_rem_duration = convertSecondsToHMS(sleepObj.sleep_class_rem_duration)
  sleepObj.sleep_class_awake_duration = convertSecondsToHMS(sleepObj.sleep_class_awake_duration)
  sleepObj.sleep_onset_duration = convertSecondsToHMS(sleepObj.sleep_onset_duration)
  sleepObj.sleep_duration = convertSecondsToHMS(sleepObj.sleep_duration)
  sleepObj.time_in_bed_duration = convertSecondsToHMS(sleepObj.time_in_bed_duration)
  sleepObj.bed_exit_duration = convertSecondsToHMS(sleepObj.bed_exit_duration)

  sleepObj.sleep_efficiency = sleepObj.sleep_efficiency.toFixed(2)

  sleepObj.sleep_score = sleepObj.sleep_score.toFixed(2)

  sleepObj.time_start = convertTimestampToDateStr(sleepObj.time_start)
  sleepObj.time_end = convertTimestampToDateStr(sleepObj.time_end)


  const dataPrompt = `
Sleeper: ${name}
  
Historical Data:
${JSON.stringify(trends.slice(-4))}

Last Nights Data:
${JSON.stringify(sleepObj)}

  """`;
  const systemPromptUrl = "https://prompt-host.web.app/prompt/aaf55bf6-56e1-43e7-ae75-ba9063a2b76e";

  // https://gist.githubusercontent.com/harperreed/ae0bf646a12b509e4d7a657fdc61dd19/raw/60fe703aced0958b891f9252439c392aa9f48742/system-prompt.txt
  const systemPrompt = await fetchUrl(systemPromptUrl); //config.openai.prompt
  
  const messages = [{ "role": "system", "content": systemPrompt}, { role: "user", content: dataPrompt }]

  const completion = await openai.chat.completions.create({
    messages: messages,
    model: config.openai.model,
  });

  // const message = completion.data.choices[0].message.content;

  const message = completion.choices[0]['message']['content']
  return message;
};


/**
 * Function to update the state of a device based on its ID.
 * The updated state is written to a file.
 *
 * @param {string} deviceId - The ID of the device for which to update the state.
 * @returns {Promise} - Returns a promise that resolves when the update is complete.
 */
const updateState = async function(deviceId) {
  const stateFile = config.emfit.stateFile;

  try {
    let obj = await fs.readFile(stateFile, 'utf8'); // Read the file
    obj = obj ? JSON.parse(obj) : {}; // Parse the JSON

    // Update the device ID with the current date
    obj[deviceId] = moment().format("L");

    // Write the updated object back to the file
    await fs.writeFile(stateFile, JSON.stringify(obj));
    
    logger.debug("Updated statefile: " + stateFile);
  } catch (err) {
    logger.error('Error reading/writing state file:', err);
    throw err; // Rethrow the error to allow further handling
  }
};



/**
 * Function to get the state of a device based on its ID.
 * The state indicates whether a message has already been sent for the device.
 *
 * @param {string} deviceId - The ID of the device for which to get the state.
 * @returns {boolean} - Returns true if the message hasn't been sent or file isn't initialized; false if the message has already been sent.
 */
const getState = function (deviceId) {
  const stateFile = config.emfit.stateFile;
  let state = true; // Initializing state as true
  let obj;

  // Adding error handling for file read
  try {
    obj = jsonfile.readFileSync(stateFile);
  } catch (error) {
    logger.error('Error reading state file:', error);
    return state; // Return true if the file cannot be read
  }

  if (obj === undefined) {
    logger.debug("File isn't initialized");
    return state; // Return true if the file isn't initialized
  }

  const todayDate = moment().format("L");

  if (todayDate === obj[deviceId]) {
    logger.debug("Already sent message");
    state = false;
  } else {
    logger.debug("Message isn't sent yet");
  }

  logger.debug(state);
  return state;
};

/**
 * Asynchronously initializes and operates a sleep bot.
 * This function handles login, fetches user data, and processes device settings.
 * @async
 * @throws Will throw an error if initializing the state file or login fails.
 */
async function instantiateSleepBot() {
  // try {
  //  await fs.writeFile(config.emfit.stateFile, JSON.stringify({}));
  //  logger.debug(`Initialized statefile: ${config.emfit.stateFile}`);
  //} catch (error) {
  //  logger.error("Error initializing state file", error);
  //}

  try {
    const loginData = await qs.login(config.emfit.username, config.emfit.password);
    const userData = await qs.user();
    
    for (const deviceSettings of userData.device_settings) {
      await processDevice(deviceSettings);
    }
  } catch (error) {
    logger.error("Error during login or fetching user data", error);
  }
}


/**
 * Asynchronously processes a device's settings.
 * This function handles device data fetching and subsequent actions.
 * @param {Object} deviceSettings - The settings object for a device.
 * @async
 * @throws Will throw an error if device data fetching fails.
 */
async function processDevice(deviceSettings) {
  const deviceId = deviceSettings.device_id;
  const deviceConfig = config.emfit.devices[deviceId];
  
  if (deviceConfig && deviceConfig.enabled && getState(deviceId)) {
    try {
      const sleep = await qs.latest(deviceId);
      const device = config.emfit.devices[sleep.device_id];
      
      if (device) {
        let sleepEndDate = moment(sleep.time_end * 1000).format("YYYY MM DD");
        let todayDate = moment().format("YYYY MM DD");

        if (sleepEndDate === todayDate) {
          logger.debug("Generating message for " + device.name);
          sleep.name = device.name;
          let message = await sleepMessage(sleep, device.discord_at, device.name);
          logger.debug("Sending message to " + device.name);

          const date = new Date();

          // Get the current month (0-11, where 0 = January, 1 = February, etc.)
          const month = date.getMonth() + 1; // Adding 1 to make it human-readable (1-12)

          // Get the current day of the month (1-31)
          const day = date.getDate();

          // Construct the human-readable date string
          const humanReadableDate = `${month}/${day}`;
          const subject = `${device.name}'s sleep on ${humanReadableDate}`;

          const pushoverUser = device.pushover_userkey;
          const pushoverPriority = device.pushover_priority;

          console.log(pushoverUser)
          if (pushoverUser !== undefined && pushoverUser !== "" && pushoverUser !== null) {
            await sendChatMessage(subject, message, pushoverUser, pushoverPriority);
          }
          updateState(deviceId);
      }
    }
    } catch (error) {
      logger.error("Error during device data fetching", error);
    }
  } else {
    logger.debug("Device is disabled");
  }
}


// Async function wrapper to handle the login and subsequent actions
async function instantiateSleepBot2() {
  try {
    jsonfile.writeFile(config.emfit.stateFile, {}, function (err) {
      if (err) {
        logger.error(err);
      } else {
        logger.debug("initialized statefile: " + config.emfit.stateFile);
      }
    });
  } catch {
    logger.info("Error initializing state file");
  }


  try {
    // Log in and await the result
    let loginData = await qs.login(config.emfit.username, config.emfit.password);

    // Get user data
    let userData = await qs.user();

    // Loop through device settings
    for (const deviceSettings of userData.device_settings) {

      let deviceId = deviceSettings.device_id;
      let deviceConfig = config.emfit.devices[deviceId];
      if (deviceConfig.enabled) {
        // Check the state of the device
        if (getState(deviceId)) {
          try {
            // Get the latest data for the first device found
            let sleep = await qs.latest(deviceId);
            let device = config.emfit.devices[sleep.device_id];

            // If the device is defined, process it
            if (device !== undefined) {
              let sleepEndDate = moment(sleep.time_end * 1000).format("YYYY MM DD");
              let todayDate = moment().format("YYYY MM DD");

              if (sleepEndDate === todayDate) {
                logger.debug("Generating message for " + device.name);
                sleep.name = device.name;
                let message = "yea" // await sleepMessage(sleep, device.discord_at, device.name);
                logger.debug("Sending message to " + device.name);

                const date = new Date();

                // Get the current month (0-11, where 0 = January, 1 = February, etc.)
                const month = date.getMonth() + 1; // Adding 1 to make it human-readable (1-12)

                // Get the current day of the month (1-31)
                const day = date.getDate();

                // Construct the human-readable date string
                const humanReadableDate = `${month}/${day}`;
                const subject = `${device.name}'s sleep on ${humanReadableDate}`;

                const pushoverUser = config.emfit.devices[sleep.device_id].pushover_userkey;
                const pushoverPriority = config.emfit.devices[sleep.device_id].pushover_priority;

                console.log(pushoverUser)
                if (pushoverUser !== undefined && pushoverUser !== "" && pushoverUser !== null) {
                  await sendChatMessage(subject, message, pushoverUser, pushoverPriority);
                }
                updateState(deviceId);
              }
            }
          } catch (error) {
            // Handle any errors during the device data fetching
            logger.error(error);
          }
        }
      }else{
        logger.debug("Device is disabled");
      }
    }
  } catch (error) {
    // Handle any errors during login or user fetching
    logger.error(error);
  }
}

// Calling the async function
instantiateSleepBot();

