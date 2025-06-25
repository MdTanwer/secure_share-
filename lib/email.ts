import nodemailer from "nodemailer";

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: "tanwirmd922@gmail.com",
      pass: "zonl ppqa fffu mdkv",
    },
  });
};

// Generate a 6-digit verification code
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
export const sendVerificationEmail = async (email: string, code: string) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: "tanwirmd922@gmail.com",
      to: email,
      subject: "SecureShare - Email Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1976d2; margin: 0;">SecureShare</h1>
            <p style="color: #666; margin: 5px 0;">Secure Secret Sharing</p>
          </div>
          
          <div style="background: #f5f5f5; padding: 30px; border-radius: 8px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email</h2>
            <p style="color: #666; margin-bottom: 30px;">
              Enter this verification code to complete your registration:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block; margin-bottom: 30px;">
              <span style="font-size: 32px; font-weight: bold; color: #1976d2; letter-spacing: 5px;">
                ${code}
              </span>
            </div>
            
            <p style="color: #999; font-size: 14px; margin: 0;">
              This code will expire in 10 minutes.<br>
              If you didn't request this, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
            <p>© 2024 SecureShare. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `
        SecureShare - Email Verification
        
        Your verification code is: ${code}
        
        This code will expire in 10 minutes.
        If you didn't request this, please ignore this email.
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Verification email sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
