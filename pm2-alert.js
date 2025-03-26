require('dotenv').config();
const pm2 = require('pm2');
const sendMail = require('./sendMail');
const axios = require('axios');
const config = require('./config');

const SLACK_WEBHOOK_URL = process.env.SLACK_URL;
const { monitoredEvents: MONITORED_EVENTS, excludedProcessIds: EXCLUDED_PROCESS_IDS } = config.monitoringConfig;

// Validate configuration at startup
if (!SLACK_WEBHOOK_URL || !Array.isArray(MONITORED_EVENTS) || !Array.isArray(EXCLUDED_PROCESS_IDS)) {
  console.error('Invalid configuration detected');
  process.exit(1);
}

const axiosInstance = axios.create({
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

// Optimized Slack notification with retry logic
async function sendSlackNotification({ eventType, process, timestamp }, retries = 2) {
  const payload = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `PM2 ${eventType.toUpperCase()}: ${process.name}`, emoji: true }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Name:*\n${process.name}` },
          { type: 'mrkdwn', text: `*ID:*\n${process.pm_id}` },
          { type: 'mrkdwn', text: `*Event:*\n${eventType}` },
          { type: 'mrkdwn', text: `*Time:*\n${timestamp}` }
        ]
      }
    ]
  };

  try {
    await axiosInstance.post(SLACK_WEBHOOK_URL, payload);
    console.log(`Slack sent: ${eventType} - ${process.name}`);
  } catch (error) {
    if (retries > 0) {
      console.warn(`Slack retry (${retries}): ${error.message}`);
      return sendSlackNotification({ eventType, process, timestamp }, retries - 1);
    }
    console.error('Slack failed:', error.message);
  }
}

// Cached IST time formatter
const istFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});
const getISTTime = () => istFormatter.format(new Date());

// Process event handler
const handleProcessEvent = ({ event: eventType, process }) => {
  if (
    EXCLUDED_PROCESS_IDS.includes(process.pm_id) || 
    !MONITORED_EVENTS.includes(eventType)
  ) return;

  const timestamp = getISTTime();
  const subject = `PM2 ${eventType.toUpperCase()}: ${process.name}`;
  const text = `Process "${process.name}" (ID: ${process.pm_id}) ${eventType} at ${timestamp}.`;

  // Process notifications concurrently
  Promise.all([
    new Promise((resolve) => {
      sendMail(subject, text, (err) => {
        console.log(err ? `Email failed: ${err.message}` : `Email sent: ${subject}`);
        resolve();
      });
    }),
    sendSlackNotification({ eventType, process, timestamp })
  ]).catch((err) => console.error('Notification error:', err.message));
};

// Main PM2 logic with cleanup
function startMonitoring() {
  pm2.connect((err) => {
    if (err) {
      console.error('PM2 connect failed:', err.message);
      process.exit(2);
    }

    console.log('PM2 connected');

    pm2.launchBus((err, bus) => {
      if (err) {
        console.error('PM2 bus failed:', err.message);
        pm2.disconnect();
        process.exit(2);
      }

      console.log('PM2 bus active');
      bus.on('process:event', handleProcessEvent);
    });
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    pm2.disconnect();
    process.exit(0);
  });
}

startMonitoring();
