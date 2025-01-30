const User = require("../../models/userSchema");
const bcrypt = require("bcrypt");

const createAdmin = async (req, res) => {
  const adminEmail = process.env.ADMIN;
  const adminPass = process.env.PASS;
  try {
    const Admin = await User.findOne({ email: adminEmail });
    if (Admin) {
      console.log("Admin already exists!");
      return null;
    } else {
      const hashedPassword = await bcrypt.hash(adminPass, 12);
      const admin = new User({
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true,
      });

      admin.save();
      console.log("Admin user created");
    }
  } catch (err) {
    console.log("Error in creating the admin", err);
  }
};

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

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials." });
    }

    // Set isAdmin to true (if not already true)
    if (!admin.isAdmin) {
      admin.isAdmin = true;
      await admin.save();
    }

    // Only create a session after successful login and validation
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
    console.error("Error during admin login:", err);
    res
      .status(500)
      .json({ success: false, message: "An error occurred during login." });
  }
};

const adminLogout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
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

module.exports = { createAdmin, viewAdminLoginPage, adminLogin, adminLogout };
