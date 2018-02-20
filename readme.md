# Emfit Morning Summary Bot

A simple sms bot that is meant to be triggerred by cron to send you a summary of your previous nights sleep. 

It can be called from cron and once it sends the morning message it will not send it again until tomorrow. i hope. 

Example text:

    Good Morning, Harper! 😃
  
    You slept about 9 hours 
    (54% light, 28% REM and 18% deep). 

    💤 It took you about 30 minutes to fall asleep and you got up about 3 times. 

    🛌🏽 You went to bed around 9:52 PM and got out of bed around 9:11 AM.
  

Should work great!



## config.yml

Here is an example config.yml. It should be pretty self explanatory. 

    default:
      emfit:
        username: email@address
        password: XXX
        devices:
          4613:
            name: NAME
            deviceId: 5555
            number: 12223335555
        stateFile: /tmp/statefile.json

      twilio:
        accountSid: XX
        authToken: XX
        fromNumber: 12223335555




## Cron config
here is my cron

`*/15 6,7,8,9,10,11 * * *  /usr/local/bin/node /home/harper/scripts/emfit-summary-bot/index.js /home/harper/scripts/emfit-summary-bot/cron.log 2>&1`

Theoretically it should run every 15 minutes from 6am-11am.
