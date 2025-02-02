const express = require("express");
const router = express.Router();

// user pages
const {
  landingPage,
  shoppingPage,
  singlePage,
} = require("../controllers/user/userPages");

// user auth
const {
  loginForm,
  registerForm,
  register,
  otpPage,
  verifyOtp,
  resendOtp,
  login,
  logout,
} = require("../controllers/user/userAuth");

// middlewares
const {
  preventCache,
  preventAuthVisit,
} = require("../middleware/user/authMiddlewares");

// pages
router.route("/home").get(landingPage);
router.route("/shop").get(shoppingPage);
router.route("/shop/product/:id").get(singlePage);

// auth
router
  .route("/login")
  .get(preventCache, preventAuthVisit, loginForm)
  .post(login);
router
  .route("/register")
  .get(preventCache, preventAuthVisit, registerForm)
  .post(register);
router.route("/logout").post(logout);

// otp routes
router.route("/verify-otp").get(preventCache, otpPage).post(verifyOtp);
router.route("/resend-otp").post(resendOtp);

module.exports = router;
