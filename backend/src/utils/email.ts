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
