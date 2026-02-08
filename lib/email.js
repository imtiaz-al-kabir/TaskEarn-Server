import sgMail from '@sendgrid/mail';

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com';

if (apiKey) sgMail.setApiKey(apiKey);

export async function sendEmailNotification(to, subject, text) {
  if (!apiKey) return;
  try {
    await sgMail.send({
      to,
      from: fromEmail,
      subject,
      text: text || subject,
    });
  } catch (err) {
    console.error('SendGrid error:', err.message);
  }
}
