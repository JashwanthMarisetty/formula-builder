const sgMail = require('@sendgrid/mail');

/**
 * Send email using SendGrid (HTTP API - works on Render!)
 * 
 * Why SendGrid instead of SMTP?
 * - Render blocks SMTP ports (25, 465, 587)
 * - SendGrid uses HTTPS (port 443) which is always open
 * - More reliable email delivery
 * - Better tracking and analytics
 * 
 * Setup required:
 * 1. Sign up at https://sendgrid.com
 * 2. Verify your sender email
 * 3. Create an API key
 * 4. Add SENDGRID_API_KEY to environment variables
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    // Set API key from environment
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'formulabuilder@formulabuilder.tech',
        name: 'Formula Builder'
      },
      replyTo: process.env.SENDGRID_FROM_EMAIL || 'formulabuilder@formulabuilder.tech',
      subject,
      text,
      html,
    };

    const response = await sgMail.send(msg);
    console.log('✅ Email sent successfully via SendGrid');
    return { success: true, messageId: response[0].headers['x-message-id'] };
  } catch (error) {
    console.error('❌ SendGrid error:', error.response?.body || error.message);
    throw error;
  }
};

module.exports = { sendEmail };
