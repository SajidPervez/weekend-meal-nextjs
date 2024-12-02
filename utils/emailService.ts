import {Resend} from 'resend';

// Initialize Resend SDK with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a receipt email to the provided email address.
 * @param {string} email - The recipient's email address.
 * @param {string} subject - The subject of the email.
 * @param {string} body - The body of the email.
 * @returns {Promise<void>}
 */
export async function sendReceiptEmail(email: string, subject: string, body: string): Promise<void> {
  try {
    await resend.emails.send({
      to: email,
      subject: subject,
      html: body,
    });
    console.log(`Receipt email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send receipt email:', error);
  }
}
