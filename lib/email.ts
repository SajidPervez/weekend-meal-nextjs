import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is required');
}

const resend = new Resend(process.env.RESEND_API_KEY);

// For development, use a verified Resend domain
const FROM_EMAIL = process.env.NODE_ENV === 'production' 
  ? 'Weekend Meals <orders@weekendmeal.com>'
  : 'onboarding@resend.dev';

export async function sendReceiptEmail(
  to: string,
  orderDetails: {
    sessionId: string;
    amount: number;
    items?: Array<{ name: string; quantity: number; price: number }>;
  }
) {
  try {
    console.log('Sending email to:', to, 'Order details:', orderDetails);
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'Your Weekend Meal Order Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981; text-align: center;">Thank You for Your Order!</h1>
          <p>Dear Customer,</p>
          <p>We're excited to confirm your Weekend Meal order. Here are your order details:</p>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Order ID:</strong> ${orderDetails.sessionId}</p>
            <p><strong>Total Amount:</strong> $${(orderDetails.amount / 100).toFixed(2)}</p>
            ${orderDetails.items ? `
              <h3>Order Items:</h3>
              <ul>
                ${orderDetails.items.map(item => `
                  <li>${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>
                `).join('')}
              </ul>
            ` : ''}
          </div>
          <p>Your meals will be prepared with care and delivered fresh.</p>
          <p>If you have any questions about your order, please don't hesitate to contact us.</p>
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px;">
              Weekend Meals - Delicious meals delivered to your door
            </p>
          </div>
        </div>
      `,
      text: `
Thank You for Your Order!

Dear Customer,

We're excited to confirm your Weekend Meal order. Here are your order details:

Order ID: ${orderDetails.sessionId}
Total Amount: $${(orderDetails.amount / 100).toFixed(2)}

${orderDetails.items ? `
Order Items:
${orderDetails.items.map(item => `- ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}
` : ''}

Your meals will be prepared with care and delivered fresh.

If you have any questions about your order, please don't hesitate to contact us.

Weekend Meals - Delicious meals delivered to your door
      `
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
