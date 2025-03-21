const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: process.env.NODE_ENV === "production" ? 465 : 587,
  secure: process.env.NODE_ENV === "production",
  auth: {
    user: process.env.ADMIN,
    pass: process.env.APP_PASS,
  },
});

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const expiringTime = () => {
  return new Date(Date.now() + 2 * 60 * 1000);
};

function getOtpEmailTemplate({ name, otp, expiryMinutes }) {
  return `
    <section style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0;">
      <header style="text-align: center; padding-bottom: 10px;">
        <h2 style="color: #333;">Email Verification</h2>
      </header>
      <p>Hello ${name || "User"},</p>
      <p>Thank you for registering. To complete your registration, please use the following One-Time Password (OTP):</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; background-color: #f0f0f0; padding: 10px 20px; border-radius: 4px;">
          ${otp}
        </span>
      </div>
      <p>This OTP is valid for <strong>${expiryMinutes}</strong> minute(s).</p>
      <p>If you did not initiate this request, please ignore this email.</p>
      <footer style="text-align: center; margin-top: 20px; font-size: 12px; color: #777;">
        &copy; ${new Date().getFullYear()} Bookcycle. All rights reserved.
      </footer>
    </section>
    `;
}

function getForgotOtpTemplate({ name, otp, expiryMinutes }) {
  return `
    <section style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0;">
      <header style="text-align: center; padding-bottom: 10px;">
        <h2 style="color: #333;">Forgot Password</h2>
      </header>
      <p>Hello ${name || "User"},</p>
      <p>Please use the following One-Time Password (OTP) to reset your password:</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; background-color: #f0f0f0; padding: 10px 20px; border-radius: 4px;">
          ${otp}
        </span>
      </div>
      <p>This OTP is valid for <strong>${expiryMinutes}</strong> minute(s).</p>
      <p>If you did not initiate this request, please ignore this email.</p>
      <footer style="text-align: center; margin-top: 20px; font-size: 12px; color: #777;">
        &copy; ${new Date().getFullYear()} Bookcycle. All rights reserved.
      </footer>
    </section>
    `;
}

function sendBlockEmail(user, reason) {
  return `
      <p>Dear ${user.name},</p>
      <p>We regret to inform you that your account has been blocked.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>If you believe this is a mistake or wish to appeal, please contact our support team.</p>
      <br/>
      <p>Best regards,</p>
      <p>Book Cycle</p>
    `;
}

function sendUnblockMail(user) {
  return `
      <p>Dear ${user.name},</p>
      <p>We are pleased to inform you that your account has been successfully unblocked and you can now access all the features and services available on our platform.</p>ath sc
      <br/>
      <p>Best regards,</p>
      <p>Book Cycle</p>
    `;
}

module.exports = {
  transporter,
  getOtpEmailTemplate,
  sendBlockEmail,
  sendUnblockMail,
  generateOtp,
  expiringTime,
  getForgotOtpTemplate,
};
