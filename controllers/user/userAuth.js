const User = require("../../models/userSchema");
const Otp = require("../../models/otpSchema");

const {
  transporter,
  getOtpEmailTemplate,
  expiringTime,
  generateOtp,
} = require("../../services/nodemailer");

const bcrypt = require("bcrypt");

// login page
const loginForm = async (req, res) => {
  return res.render("user/loginPage");
};

// register page
const registerForm = async (req, res) => {
  return res.render("user/registerPage");
};

// set-password page
const setPasswordPage = async (req, res) => {
  return res.render("user/setPassword");
};

// setting-password (for user who logged in first using g-auth then switching to normal way)
const setPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 10 characters long.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).render("utils/userErrorPage", {
        statusCode: 404,
        message: "User not found!",
      });
    }

    req.session.user = { email: user.email, isVerified: user.isVerified };

    res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (err) {
    console.log("Internal error in fetching password!", err);
  }
};

// register user
const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords mismatch!" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
    });

    await newUser.save();

    const otp = generateOtp();
    const expiresAt = expiringTime();

    await Otp.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    const mailOptions = {
      from: '"Book Cycle®" <alexaxay10619@gmail.com>',
      to: email,
      subject: "Your OTP for Email Verification",
      html: getOtpEmailTemplate({
        name,
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

    res.json({
      success: true,
      message: "Registration successful! Please verify your OTP.",
      email: newUser.email,
      otpExpiresAt: expiresAt,
      redirectTo: "/user/verify-otp",
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// otp verify page
const otpPage = async (req, res) => {
  return res.render("user/otpVerify");
};

// verifying otp
const verifyOtp = async (req, res) => {
  try {
    const { email, otp: userOtp } = req.body;

    if (!email || !userOtp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required." });
    }

    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please resend the OTP.",
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    if (otpRecord.otp !== userOtp) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP. Please try again." });
    }

    // OTP is valid. Mark user as verified.
    await User.findOneAndUpdate({ email }, { isVerified: true });
    const newUser = await User.findOne({ email });
    // Delete the OTP record after successful verification
    await Otp.deleteOne({ email });

    req.session.user = { email: newUser.email, isVerified: newUser.isVerified };

    return res.json({
      success: true,
      message: "Email verified successfully!",
      redirectTo: "/user/home",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

// Resend otp
const resendOtp = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    const otp = generateOtp();
    const expiresAt = expiringTime();

    // Upsert new OTP record
    await Otp.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // Send OTP email
    const mailOptions = {
      from: '"Book Cycle®" <alexaxay10619@gmail.com>',
      to: email,
      subject: "Your New OTP for Email Verification",
      html: getOtpEmailTemplate({
        name,
        otp,
        expiryMinutes: 2,
      }),
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending OTP email:", err);
      } else {
        console.log("New OTP email sent:", info.response);
      }
    });

    return res.json({
      success: true,
      message: "New OTP has been sent to your email.",
      otpExpiresAt: expiresAt,
    });
  } catch (error) {
    console.error("Error resending OTP:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

// login user
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message:
          "We regret to inform you that your account has been temporarily restricted. Please contact support for assistance.",
      });
    }

    if (user.password === null) {
      return res.status(200).json({
        success: true,
        stayBack: user._id,
        message:
          "You are already registered, but your password is missing. Please set a new password. Redirecting!!..",
        redirectTo: "/user/set-password",
      });
    }

    // Compare the entered password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    // If the user is not verified, mimic the registration OTP flow:
    if (!user.isVerified) {
      // Generate OTP and expiry time
      const otp = generateOtp();
      const expiresAt = expiringTime();

      // Upsert new OTP record
      await Otp.findOneAndUpdate(
        { email },
        { otp, expiresAt },
        { upsert: true, new: true }
      );

      // Send OTP email
      const mailOptions = {
        from: '"Book Cycle®" <alexaxay10619@gmail.com>',
        to: email,
        subject: "Your OTP for Email Verification",
        html: getOtpEmailTemplate({
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

      return res.status(200).json({
        success: true,
        message:
          "You have an account but your email is not verified. Please verify your OTP.",
        email: user.email,
        otpExpiresAt: expiresAt,
        redirectTo: "/user/verify-otp",
      });
    }

    // If verified, store user details in session and redirect to home.
    req.session.user = {
      email: user.email,
      isVerified: user.isVerified,
    };

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      redirectTo: "/user/home",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// logout route
const logout = async (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Error in logging out!" });
      }
      res.clearCookie("connect.sid", { path: "/" });
      return res
        .status(200)
        .json({ success: true, message: "Logged out successfully!" });
    });
  });
};

module.exports = { logout };

module.exports = {
  loginForm,
  registerForm,
  setPasswordPage,
  register,
  otpPage,
  verifyOtp,
  resendOtp,
  login,
  logout,
  setPassword,
};
