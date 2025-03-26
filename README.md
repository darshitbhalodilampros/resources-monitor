  
# PM2 and System Monitor

## Index
- [Overview](#overview)
- [Key Features](#key-features)
- [File Structure](#file-structure)
- [Configuration Overview](#configuration-overview)
- [Get Notified](#get-notified)
- [Exclude Monitoring](#exclude-monitoring)
- [Capture PM2 Event](#capture-pm2-event)
- [Example Configuration](#example-configuration)

## Overview
This repository provides a PM2 process event detection and server metrics monitoring system, designed to enhance observability and automation for server management. It integrates PM2 process event listeners to detect state changes such as error, start, and stop, while also monitoring key server metrics (CPU, memory, disk usage, etc.).

## Key Features
:white_check_mark: **PM2 Process Event Detection** – Listens for process lifecycle events like start, stop, restart, and error.

:white_check_mark: **Server Metrics Monitoring** – Tracks CPU, memory, and other critical performance metrics.

:white_check_mark: **Slack Notifications** – Sends alerts to Slack channels for real-time issue tracking.

:white_check_mark: **Email Alerts** – Notifies specific recipients about critical process events via email.

This repo ensures proactive monitoring and quick incident response, making it ideal for teams managing production servers.

## File Structure

:pushpin: **config.js** - For Configuration related to PM2 Events, Expected Recipient for specific process, Exclude process monitoring 

:email: **sendMail.js** - For mail content and logic to serve PM2 related mails

:hourglass_flowing_sand: **pm2-alert.js** - Logic for PM2 Events detection and deliver notification

:email: **sendSystemAlertMail.js** - For mail content and logic to serve System or Server related mails

:desktop_computer: **system-alert.js** - Logic for System metrics detection and deliver notification

## Configuration Overview
The `config.js` file allows you to customize process monitoring and notification settings with two main configuration sections:

### 1. Process Recipients
Specify email recipients for notifications on a per-process basis:

- Use the `processRecipients` object to define email recipients
- Each process can have unique `to` and `cc` email addresses
- A `_default` configuration provides fallback recipients

#### Example Configuration:
```javascript
processRecipients: {
  'abc': {
    to: ['abc@notify.com', 'def@gmail.com'],
    cc: 'geh@gmail.com',
  },
  '_default': {
    to: process.env.SMTP_TO,
    cc: process.env.SMTP_CC,
  },
}
```

### 2. Monitoring Configuration
Control which processes and events are monitored:

- `monitoredEvents`: Specify which PM2 events trigger notifications
  - Supported events: `start`, `error`, `stop`
- `excludedProcessIds`: List process IDs to exclude from monitoring

#### Example Configuration:
```javascript
monitoringConfig: {
  monitoredEvents: ['start', 'error', 'stop'],
  excludedProcessIds: [1, 3],
}
```
## Get Notified  
To receive notifications for specific PM2 events, follow the steps below:

1. Open the `config.js` file.  
2. Locate the `processRecipients` object.  
3. Add a new key with the **PM2 Process Name** (the key name must match the PM2 process name exactly).  
4. Specify the **recipient email addresses** for notifications in the `to` and `cc` fields.  

✅ *Once configured, you will receive email notifications whenever the specified PM2 events occur.*

## Exclude Monitoring  
To exclude certain PM2 processes from being monitored, follow these steps:

1. Open the `config.js` file.  
2. Find the `monitoringConfig` object.  
3. Locate the `excludedProcessIds` array.  
4. Add the **PM2 Process IDs** you want to exclude from monitoring.  

✅ *After this configuration, the specified processes will no longer be monitored.*

## Capture PM2 Event
To monitor specific PM2 events, follow the steps below:

1. Open the `config.js` file.  
2. Find the `monitoringConfig` object.  
3. Locate the `monitoredEvents` array.  
4. Add the **PM2 events** you want to capture.  

✅ *You will receive notifications whenever the listed events are triggered.*

## Example Configuration
```javascript
processRecipients: {
  'abc': {               // PM2 process name
    to: ['abc@notify.com', 'def@gmail.com'],   // Recipients
    cc: 'geh@gmail.com'                        // CC recipient
  },
  '_default': {           // Default recipient if no specific match
    to: process.env.SMTP_TO,
    cc: process.env.SMTP_CC,
  },
}

monitoringConfig: {
  monitoredEvents: ['start', 'error', 'stop'],  // Events to monitor
  excludedProcessIds: [1, 3],                   // Excluded PM2 process IDs
}
```
