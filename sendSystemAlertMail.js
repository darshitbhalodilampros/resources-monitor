require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const generateSystemAlertHTML = (subject, alertType, details, timestamp) => {
  const alertColors = {
    'High Memory Usage': '#ff9800',
    'High Storage Usage': '#f44336',
    'High CPU Usage': '#e91e63',
    'High Network Usage': '#9c27b0',
    'High Process Count': '#3f51b5',
    'High System Load': '#2196f3',
    'High CPU Temperature': '#ff5722',
    'Possible Reboot Detected': '#4caf50'
  };

  const alertColor = alertColors[alertType] || '#607d8b';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f0f2f5;
          margin: 0;
          padding: 20px;
          line-height: 1.6;
        }
        .container {
          max-width: 650px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .header {
          background-color: ${alertColor};
          color: white;
          padding: 15px 20px;
          text-align: center;
          border-bottom: 4px solid rgba(255,255,255,0.2);
        }
        .header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 25px;
          color: #333;
        }
        .alert-box {
          background-color: #f8f9fa;
          border-left: 5px solid ${alertColor};
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
        }
        .alert-title {
          font-size: 18px;
          font-weight: 600;
          color: ${alertColor};
          margin-bottom: 10px;
        }
        .details {
          font-size: 14px;
          color: #555;
          white-space: pre-wrap;
        }
        .footer {
          text-align: center;
          padding: 15px;
          font-size: 12px;
          color: #888;
          background-color: #f8f9fa;
          border-top: 1px solid #eee;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${subject}</h2>
        </div>
        <div class="content">
          <p>A server alert has been triggered. Please review the details below:</p>
          <div class="alert-box">
            <div class="alert-title">${alertType}</div>
            <div class="details">${details}</div>
          </div>
          <p>Please investigate and take appropriate action to ensure server stability.</p>
        </div>
        <div class="footer">
          <p>This is an automated alert from Server Monitoring Service</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const sendSystemAlertMail = (subject, text, callback) => {
  console.log('sendSystemAlertMail input:', { subject, text });

  let alertType = 'Unknown Alert';
  let details = text;
  let timestamp = new Date().toLocaleString();

  try {
    const alertMatch = subject.match(/Server Alert: (.+)/);
    if (alertMatch) {
      alertType = alertMatch[1];
    }
    const timeMatch = text.match(/Time: (.+)$/);
    if (timeMatch) {
      timestamp = timeMatch[1];
    }
  } catch (error) {
    console.error('Error parsing alert text:', error.message);
  }

  const htmlContent = generateSystemAlertHTML(subject, alertType, details, timestamp);

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: process.env.SMTP_TO,
    cc: process.env.SMTP_CC,
    subject: subject,
    text: text,
    html: htmlContent,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending system alert email:', error.message);
      if (callback) callback(error);
    } else {
      console.log('System alert email sent:', info.response);
      if (callback) callback(null, info);
    }
  });
};

module.exports = sendSystemAlertMail;
