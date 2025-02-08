const bcrypt = require("bcrypt");
const User = require("../../models/userSchema");
const Otp = require("../../models/otpSchema");
const jwt = require("jsonwebtoken");

const {
  transporter,
  getForgotOtpTemplate,
  expiringTime,
  generateOtp,
} = require("../../services/nodemailer");

// set password page
const setPasswordPage = async (req, res) => {
  return res.render("user/setPassword");
};

// set password
const setPassword = async (req, res) => {
  const { newPassword, confirmPass } = req.body;

  try {
    // Validate input...
    if (!newPassword || !confirmPass) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }
    if (newPassword.length < 10) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 10 characters long.",
      });
    }
    if (newPassword !== confirmPass) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match." });
    }

    const userId = res.locals.user;

    const user = await User.findById(userId.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Hash and update new password
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({
      success: true,
      message: "Password updated successfully!",
    });
  } catch (error) {
    console.error("Error in setPassword:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// change password page
const changePasswordPage = async (req, res) => {
  try {
    console.log("res.locals.user:", res.locals.user);
    const userId = res.locals.user.id;
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found!");
      return res.redirect("/user/login");
    }
    if (user.password === null) {
      return res.redirect("/user/set-password");
    } else {
      return res.render("user/changePasswordPage");
    }
  } catch (err) {
    console.error("Error in fetching setPassword page", err);
  }
};

// changing password route
const changePassword = async (req, res) => {
  const userId = res.locals.user;
  const { currentPassword, newPassword, confirmPass } = req.body;

  try {
    if (!currentPassword || !newPassword || !confirmPass) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    if (newPassword.length < 10) {
      return res.status(400).json({
        success: false,
        message: `New password must be at least 10 characters long.`,
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: `Current password and new passwords are same`,
      });
    }

    if (newPassword !== confirmPass) {
      res
        .status(400)
        .json({ success: false, message: "Passwords do no match." });
    }

    // Find the user
    const user = await User.findById(userId.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect." });
    }

    // Hash and update new password
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({
      success: true,
      message: "Password updated successfully!",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error. Try again later." });
  }
};

// forgot password page
const forgotPassPage = (req, res) => {
  return res.render("user/forgotPasswordPage");
};

// forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const otp = generateOtp();
    const expiresAt = expiringTime();

    // Upsert (update or create) the OTP record for this email
    await Otp.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    const mailOptions = {
      from: '"Book Cycle®" <alexaxay10619@gmail.com>',
      to: email,
      subject: "Your OTP for Password Reset",
      html: getForgotOtpTemplate({
        name: user.name,
        otp,
        expiryMinutes: 2,
      }),
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending OTP email:", err);
      } else {
        console.log("OTP email sent:", info.response);
      }
    });

    const tokenPayload = {
      id: user._id,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET);

    return res.json({
      success: true,
      message: "OTP sent to your email. Please verify OTP.",
      email: user.email,
      otpExpiresAt: expiresAt,
      token,
      purpose: "forgot-password",
      redirectTo: "/user/verify-otp",
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

module.exports = {
  changePasswordPage,
  changePassword,
  setPasswordPage,
  setPassword,
  forgotPassPage,
  forgotPassword,
};
