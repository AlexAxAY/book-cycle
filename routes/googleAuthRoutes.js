const express = require("express");
const passport = require("../services/passport");
const { logout } = require("../controllers/user/userAuth");

const router = express.Router();

// Route to initiate Google OAuth login
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/user/login" }),
  (req, res) => {
    req.session.user = {
      id: req.user._id,
      email: req.user.email,
      isVerified: req.user.isVerified,
    };
    res.redirect("/user/home");
  }
);

// logout for google auth
router.get("/logout", logout);

module.exports = router;
