require('dotenv').config();
const nodemailer = require('nodemailer');
const config = require('./config');

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

const generateEmailHTML = (subject, processName, eventType, processId, timestamp) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .header { background-color: #007bff; color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
        .status { color: ${eventType === 'error' || eventType === 'stop' ? '#dc3545' : '#28a745'}; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h2>${subject}</h2></div>
        <div class="content">
          <p>The PM2 process <strong>"${processName || 'Unknown'}"</strong> (ID: ${processId || 'N/A'}) has experienced the following event:</p>
          <p><span class="status">${(eventType || 'Unknown').toUpperCase()}</span> at ${timestamp || 'N/A'}</p>
          <p>Please take appropriate action if necessary.</p>
        </div>
        <div class="footer"><p>This is an automated message from PM2 Monitoring System</p></div>
      </div>
    </body>
    </html>
  `;
};

const sendMail = (subject, text, callback) => {
  console.log('sendMail input:', { subject, text }); // Debug input

  let processName = 'Unknown';
  let processId = 'N/A';
  let eventType = 'Unknown';
  let timestamp = 'N/A';

  try {
    // Extract process name and ID
    const nameMatch = text.match(/"([^"]+)" \(ID: (\d+)\)/);
    if (nameMatch) {
      [processName, processId] = nameMatch.slice(1);
    }

    // Extract eventType (word between ") and "at")
    const eventMatch = text.match(/\)\s*(\w+)\s*at/);
    if (eventMatch) {
      eventType = eventMatch[1];
    }

    // Extract timestamp (everything after "at ")
    const timeMatch = text.match(/at (.+)$/);
    if (timeMatch) {
      timestamp = timeMatch[1];
    }
  } catch (error) {
    console.error('Error parsing text:', error.message);
  }

  const htmlContent = generateEmailHTML(subject, processName, eventType, processId, timestamp);

  // Dynamically get recipients based on process name
  const recipientConfig = config.processRecipients[processName] || config.processRecipients['_default'];
  
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: recipientConfig.to,
    cc: recipientConfig.cc,
    subject: subject,
    text: text,
    html: htmlContent,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error.message);
      if (callback) callback(error);
    } else {
      console.log('Email sent:', info.response);
      if (callback) callback(null, info);
    }
  });
};

module.exports = sendMail;
