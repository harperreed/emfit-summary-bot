# Emfit Morning Summary Bot

## Overview

This Sleep Bot project aims to handle multiple responsibilities, including initializing state files, logging into a service, fetching user and device data, and sending messages via Pushover. The project is built using Node.js and relies on a `config.yaml` file for various settings.

## Table of Contents
1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Usage](#usage)
4. [Functions](#functions)
5. [Contributing](#contributing)
6. [License](#license)

## Installation

Clone the repository and navigate to the project folder. Run the following command to install the required Node.js packages:

```bash
npm install
```

## Configuration

Create a `config.yaml` file in the root directory with the following structure:

```yaml
default:
  emfit:
    username: email@address
    password: XXX
    devices:
      4613:
        name: NAME
        enabled: true
        deviceId: 5555
        number: 12223335555
        discord_at: "xxxx"
        pushover_userkey: xxxx
        pushover_priority: -1
    stateFile: /tmp/statefile.json
  chat:
    space: XX
    key: XX
    token: XX
  twilio:
    accountSid: XX
    authToken: XX
    fromNumber: 12223335555
  openai: 
    apikey: "sk-xxxx"
    model: "gpt-4"
  pushover: 
    apikey: xxxx
    userkey: xxxx
```

Replace the placeholder values (`XXX`, `XX`, `xxxx`, etc.) with your actual credentials and settings.

## Usage

To start the bot, simply run:

```bash
node index.js
```

## Functions

### `instantiateSleepBot()`

An asynchronous function that initializes state files, logs into the Emfit service, fetches user data, and processes each device setting.

### `processDevice(deviceSettings)`

A helper function to process individual device settings. It fetches the latest sleep data for each device and sends messages if conditions are met.

### `sendChatMessage(subject, message, pushoverUser, priority)`

An asynchronous function that sends a Pushover message.

## Contributing

If you'd like to contribute, please fork the repository and make changes as you'd like. Pull requests are warmly welcome.

## License

MIT

---

Feel free to modify this README to better suit your project's needs.
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

      chat:
        space: XX
        key: XX
        token: XX




## Cron config
here is my cron

`*/15 6,7,8,9,10,11 * * *  /usr/local/bin/node /home/harper/scripts/emfit-summary-bot/index.js /home/harper/scripts/emfit-summary-bot/cron.log 2>&1`

Theoretically it should run every 15 minutes from 6am-11am.
