const User = require("../../models/userSchema");
const bcrypt = require("bcrypt");

// Navigates to the login page
const viewAdminLoginPage = async (req, res) => {
  return res.render("adminPanel/adminLogin");
};

// Admin login validation
const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await User.findOne({ email });

    if (!admin) {
      return res
        .status(400)
        .json({ success: false, message: "Admin not found." });
    }

    if (admin.email !== email) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials." });
    }

    if (!admin.isAdmin) {
      admin.isAdmin = true;
      await admin.save();
    }

    req.session.user = {
      id: admin._id,
      email: admin.email,
      isAdmin: admin.isAdmin,
    };

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({
          success: false,
          message: "Session error",
        });
      }
      res.status(200).json({
        success: true,
        message: "Login successful.",
        admin,
      });
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "An error occurred during login." });
  }
};

const adminLogout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Logout failed.",
      });
    }

    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.json({
      success: true,
      message: "Logged out successfully.",
    });
  });
};

module.exports = { viewAdminLoginPage, adminLogin, adminLogout };
