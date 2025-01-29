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
module.exports = { createAdmin, viewAdminLoginPage };
