const nodemailer = require('nodemailer');

let transporter;

if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: parseInt(process.env.SMTP_PORT, 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
} else {
  // No SMTP configured — create a no-op transporter for development
  console.warn('[Email] SMTP_HOST not configured. Emails will be logged but not sent.');
  transporter = {
    async sendMail(mailOptions) {
      console.log(`[Email] (DEV) Would send to: ${mailOptions.to} | Subject: ${mailOptions.subject}`);
      return { messageId: 'dev-no-op' };
    },
  };
}

const SMTP_FROM = process.env.SMTP_FROM || 'CLINIPAY <noreply@clinipay.com>';

module.exports = { transporter, SMTP_FROM };
