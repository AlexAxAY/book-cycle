const User = require("../../models/userSchema");

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const user = await User.findOne({ _id: userId });
    return res.status(200).render("user/profilePage", { user });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const { name, email, gender } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and Email are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.email !== email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email is already taken" });
      }

      user.name = name;
      user.gender = gender;
      user.email = email;
      user.isVerified = false;
      await user.save();

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

          return res.status(200).json({
            success: true,
            message:
              "Your email has been updated. Please log in again to verify your new email.",
            redirectTo: "/user/login",
          });
        });
      });

      return;
    } else {
      user.name = name;
      user.gender = gender;
      const updatedUser = await user.save();

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
      });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile };
