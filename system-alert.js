const fs = require('fs');
const os = require('os');
const path = require('path');
const si = require('systeminformation');
const axios = require('axios');
const sendSystemAlertMail = require('./sendSystemAlertMail');
require('dotenv').config();

const SLACK_WEBHOOK_URL = process.env.SLACK_URL;

// IST Time Formatter
const istFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

let lastMemoryAlert = 0;
let lastStorageAlert = 0;
let lastCpuAlert = 0;
let lastNetworkAlert = 0;
let lastProcessAlert = 0;
let lastLoadAlert = 0;
let lastTempAlert = 0;
let lastUptimeAlert = 0;
const ALERT_COOLDOWN = 1800000; // half hour in milliseconds

// CPU usage tracking
let lastCpuTimes = os.cpus();
let lastCpuCheck = Date.now();

// Optimized Slack notification
async function sendSlackNotification({ alertType, metrics, timestamp }) {
  try {
    await axios.post(SLACK_WEBHOOK_URL, {
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `System Alert: ${alertType}`, emoji: true }
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Type:*\n${alertType}` },
            { type: 'mrkdwn', text: `*Metrics:*\n${metrics}` },
            { type: 'mrkdwn', text: `*Time:*\n${timestamp}` }
          ]
        }
      ]
    }, { timeout: 5000 });
    console.log(`Slack sent: ${alertType}`);
  } catch (error) {
    console.error('Slack error:', error.message);
  }
}

async function checkSystemResources() {
  try {
    const currentTime = Date.now();
    const currentISTTime = istFormatter.format(new Date());

    const { default: psList } = await import('ps-list');

    // 1. Check Memory Usage
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    if (memoryUsagePercent > 80 && currentTime - lastMemoryAlert > ALERT_COOLDOWN) {
      const subject = 'Server Alert: High Memory Usage';
      const text = `Server memory usage has exceeded 80%.\n` +
                   `Current usage: ${memoryUsagePercent.toFixed(2)}%\n` +
                   `Total Memory: ${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
                   `Used Memory: ${(usedMemory / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
                   `Time: ${currentISTTime}`;
      sendSystemAlertMail(subject, text);
      sendSlackNotification({
        alertType: 'High Memory Usage',
        metrics: `${memoryUsagePercent.toFixed(2)}% (${(usedMemory / 1024 / 1024 / 1024).toFixed(2)} GB used)`,
        timestamp: currentISTTime
      });
      lastMemoryAlert = currentTime;
      fs.appendFileSync('resource_monitor.log', `${new Date().toISOString()} - Memory alert triggered\n`);
    }

    // 2. Check Storage Usage
    const stats = await fs.promises.statfs('/');
    const totalStorage = stats.blocks * stats.bsize;
    const freeStorage = stats.bfree * stats.bsize;
    const usedStorage = totalStorage - freeStorage;
    const storageUsagePercent = (usedStorage / totalStorage) * 100;

    if (storageUsagePercent > 90 && currentTime - lastStorageAlert > ALERT_COOLDOWN) {
      const subject = 'Server Alert: High Storage Usage';
      const text = `Server storage usage has exceeded 90%.\n` +
                   `Current usage: ${storageUsagePercent.toFixed(2)}%\n` +
                   `Total Storage: ${(totalStorage / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
                   `Used Storage: ${(usedStorage / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
                   `Time: ${currentISTTime}`;
      sendSystemAlertMail(subject, text);
      sendSlackNotification({
        alertType: 'High Storage Usage',
        metrics: `${storageUsagePercent.toFixed(2)}% (${(usedStorage / 1024 / 1024 / 1024).toFixed(2)} GB used)`,
        timestamp: currentISTTime
      });
      lastStorageAlert = currentTime;
      fs.appendFileSync('resource_monitor.log', `${new Date().toISOString()} - Storage alert triggered\n`);
    }

    // 3. Check CPU Usage
    const currentCpuTimes = os.cpus();
    const timeDiff = currentTime - lastCpuCheck;
    let totalIdle = 0;
    let totalTick = 0;

    for (let i = 0; i < currentCpuTimes.length; i++) {
      const last = lastCpuTimes[i].times;
      const current = currentCpuTimes[i].times;
      const idleDiff = current.idle - last.idle;
      const totalDiff = (current.user + current.nice + current.sys + current.idle + current.irq) -
                        (last.user + last.nice + last.sys + last.idle + last.irq);
      totalIdle += idleDiff;
      totalTick += totalDiff;
    }
    const cpuUsagePercent = 100 - ((totalIdle / totalTick) * 100);

    if (cpuUsagePercent > 80 && currentTime - lastCpuAlert > ALERT_COOLDOWN) {
      const subject = 'Server Alert: High CPU Usage';
      const text = `Server CPU usage has exceeded 80%.\n` +
                   `Current usage: ${cpuUsagePercent.toFixed(2)}%\n` +
                   `Time: ${currentISTTime}`;
      sendSystemAlertMail(subject, text);
      sendSlackNotification({
        alertType: 'High CPU Usage',
        metrics: `${cpuUsagePercent.toFixed(2)}%`,
        timestamp: currentISTTime
      });
      lastCpuAlert = currentTime;
      fs.appendFileSync('resource_monitor.log', `${new Date().toISOString()} - CPU alert triggered\n`);
    }
    lastCpuTimes = currentCpuTimes;
    lastCpuCheck = currentTime;

    // 4. Check Network Usage
    const networkStats = await si.networkStats();
    const bytesPerSec = networkStats[0].rx_sec + networkStats[0].tx_sec;

    if (bytesPerSec > 1000000 && currentTime - lastNetworkAlert > ALERT_COOLDOWN) {
      const subject = 'Server Alert: High Network Usage';
      const text = `Server network usage is high.\n` +
                   `Current usage: ${(bytesPerSec / 1024 / 1024).toFixed(2)} MB/s\n` +
                   `Time: ${currentISTTime}`;
      sendSystemAlertMail(subject, text);
      sendSlackNotification({
        alertType: 'High Network Usage',
        metrics: `${(bytesPerSec / 1024 / 1024).toFixed(2)} MB/s`,
        timestamp: currentISTTime
      });
      lastNetworkAlert = currentTime;
      fs.appendFileSync('resource_monitor.log', `${new Date().toISOString()} - Network alert triggered\n`);
    }

    // 5. Check Process Count
    const processes = await psList();
    const processCount = processes.length;

    if (processCount > 200 && currentTime - lastProcessAlert > ALERT_COOLDOWN) {
      const subject = 'Server Alert: High Process Count';
      const text = `Server has too many running processes.\n` +
                   `Current count: ${processCount}\n` +
                   `Time: ${currentISTTime}`;
      sendSystemAlertMail(subject, text);
      sendSlackNotification({
        alertType: 'High Process Count',
        metrics: `${processCount} processes`,
        timestamp: currentISTTime
      });
      lastProcessAlert = currentTime;
      fs.appendFileSync('resource_monitor.log', `${new Date().toISOString()} - Process alert triggered\n`);
    }

    // 6. Check System Load Average
    const loadAvg = os.loadavg()[0];
    const cpuCount = os.cpus().length;
    const loadPerCpu = loadAvg / cpuCount;

    if (loadPerCpu > 1.0 && currentTime - lastLoadAlert > ALERT_COOLDOWN) {
      const subject = 'Server Alert: High System Load';
      const text = `Server load average is high.\n` +
                   `1-min Load Avg: ${loadAvg.toFixed(2)}\n` +
                   `Load per CPU: ${loadPerCpu.toFixed(2)}\n` +
                   `CPU Count: ${cpuCount}\n` +
                   `Time: ${currentISTTime}`;
      sendSystemAlertMail(subject, text);
      sendSlackNotification({
        alertType: 'High System Load',
        metrics: `Load: ${loadPerCpu.toFixed(2)} (CPUs: ${cpuCount})`,
        timestamp: currentISTTime
      });
      lastLoadAlert = currentTime;
      fs.appendFileSync('resource_monitor.log', `${new Date().toISOString()} - Load alert triggered\n`);
    }

    // 7. Check CPU Temperature
    const temps = await si.cpuTemperature();
    const mainTemp = temps.main || 0;

    if (mainTemp > 70 && currentTime - lastTempAlert > ALERT_COOLDOWN) {
      const subject = 'Server Alert: High CPU Temperature';
      const text = `Server CPU temperature is high.\n` +
                   `Current temp: ${mainTemp}°C\n` +
                   `Time: ${currentISTTime}`;
      sendSystemAlertMail(subject, text);
      sendSlackNotification({
        alertType: 'High CPU Temperature',
        metrics: `${mainTemp}°C`,
        timestamp: currentISTTime
      });
      lastTempAlert = currentTime;
      fs.appendFileSync('resource_monitor.log', `${new Date().toISOString()} - Temperature alert triggered\n`);
    }

    // 8. Check Uptime
    const uptimeSeconds = os.uptime();
    const uptimeHours = uptimeSeconds / 3600;

    if (uptimeHours < 1 && currentTime - lastUptimeAlert > ALERT_COOLDOWN) {
      const subject = 'Server Alert: Possible Reboot Detected';
      const text = `Server uptime is unusually low.\n` +
                   `Current uptime: ${(uptimeSeconds / 60).toFixed(2)} minutes\n` +
                   `Time: ${currentISTTime}`;
      sendSystemAlertMail(subject, text);
      sendSlackNotification({
        alertType: 'Possible Reboot Detected',
        metrics: `${(uptimeSeconds / 60).toFixed(2)} minutes`,
        timestamp: currentISTTime
      });
      lastUptimeAlert = currentTime;
      fs.appendFileSync('resource_monitor.log', `${new Date().toISOString()} - Uptime alert triggered\n`);
    }

  } catch (err) {
    console.error('Error checking system resources:', err);
    fs.appendFileSync('resource_monitor.log', `${new Date().toISOString()} - Error: ${err.message}\n`);
  }
}

// Rest of the file remains the same...
const logFileToWatch = path.join(__dirname, 'resource_monitor.log');

if (!fs.existsSync(logFileToWatch)) {
  fs.writeFileSync(logFileToWatch, `${istFormatter.format(new Date())} - Monitoring started\n`);
}

let isChecking = false;
function debounceCheck() {
  if (!isChecking) {
    isChecking = true;
    checkSystemResources().finally(() => {
      isChecking = false;
    });
  }
}

try {
  const watcher = fs.watch(logFileToWatch, (eventType, filename) => {
    if (eventType === 'change') {
      debounceCheck();
    }
  });

  watcher.on('error', (error) => {
    console.error('Watcher error:', error);
    checkSystemResources();
  });

  console.log(`Monitoring system resources via ${logFileToWatch}`);
  
  checkSystemResources();
  setInterval(checkSystemResources, 300000);

} catch (err) {
  console.error('Error setting up watcher:', err);
  checkSystemResources();
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  process.exit(0);
});
