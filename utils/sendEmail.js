import nodemailer from 'nodemailer';

let transporter;

const initTransporter = async () => {
  if (transporter) return transporter;

  // Check if real SMTP credentials are provided (ignoring the placeholder)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_USER !== 'your_email@gmail.com') {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  } else {
    // Fallback to Ethereal mock email for development
    console.log('No active SMTP credentials found (using placeholder). Creating Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    console.log('Ethereal test account created:', testAccount.user);
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailTransporter = await initTransporter();
    const info = await mailTransporter.sendMail({
      from: '"Aura Premium E-Commerce" <noreply@aura-ecommerce.com>',
      to,
      subject,
      html,
    });

    console.log(`\n=== EMAIL SENT TO: ${to} ===`);
    console.log(`Subject: ${subject}`);
    if (info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`Preview URL: ${previewUrl}`);
      }
    }
    console.log('===============================\n');
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};
