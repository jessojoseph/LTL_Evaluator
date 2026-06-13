import nodemailer from 'nodemailer';
import { env } from '../config/env';

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${env.webappUrl}/reset-password?token=${token}`;

  // Check if SMTP is configured
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    console.log('\n==================================================');
    console.log('📬 [DEVELOPMENT MOCK EMAIL] Password Reset Requested');
    console.log(`To: ${email}`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log('==================================================\n');
    return;
  }

  // Fallback to Brevo HTTP API if using Brevo and having an API Key to bypass port blocks on Render
  if (env.smtpHost === 'smtp-relay.brevo.com' && (env.smtpPass.startsWith('xsmtpsib-') || env.smtpPass.startsWith('xkeysib-')) && typeof fetch !== 'undefined') {
    try {
      console.log('🔗 Sending email via Brevo HTTP API to bypass SMTP port blocks on cloud hosting...');
      
      const fromMatch = env.emailFrom.match(/^(.*?)\s*<([^>]+)>$/);
      const senderName = fromMatch ? fromMatch[1].replace(/['"]/g, '').trim() : 'AttendEase';
      const senderEmail = fromMatch ? fromMatch[2].trim() : 'jessoj952@gmail.com';

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': env.smtpPass,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: senderName,
            email: senderEmail,
          },
          to: [
            {
              email: email,
            },
          ],
          subject: 'AttendEase - Password Reset Request',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 10px;">
              <h2 style="color: #0f5c3a;">Reset Your Password</h2>
              <p>We received a request to reset your password for your AttendEase account. Click the button below to set a new password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #0f5c3a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
              </div>
              <p>Or copy and paste this URL into your browser:</p>
              <p style="word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
              <p style="font-size: 12px; color: #999;">If you did not request a password reset, you can safely ignore this email. This link is valid for 1 hour.</p>
            </div>
          `,
        }),
      });

      if (response.ok) {
        console.log(`📬 Password reset email sent to ${email} via Brevo HTTP API`);
        return;
      } else {
        const errJson = await response.json().catch(() => ({}));
        console.error('❌ Brevo HTTP API failed, falling back to standard SMTP...', errJson);
      }
    } catch (apiError) {
      console.error('❌ Brevo HTTP API error, falling back to standard SMTP:', apiError);
    }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });

    const mailOptions = {
      from: env.emailFrom,
      to: email,
      subject: 'AttendEase - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 10px;">
          <h2 style="color: #0f5c3a;">Reset Your Password</h2>
          <p>We received a request to reset your password for your AttendEase account. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #0f5c3a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this URL into your browser:</p>
          <p style="word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999;">If you did not request a password reset, you can safely ignore this email. This link is valid for 1 hour.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📬 Password reset email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    // Even if sending fails, in development we still print it to console
    console.log('\n==================================================');
    console.log('📬 [FALLBACK MOCK EMAIL] Password Reset URL');
    console.log(`To: ${email}`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log('==================================================\n');
  }
}
