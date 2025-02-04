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
  setPasswordPage,
  otpPage,
  verifyOtp,
  resendOtp,
  login,
  logout,
  setPassword,
} = require("../controllers/user/userAuth");

// middlewares
const {
  preventCache,
  preventAuthVisit,
} = require("../middleware/user/authMiddlewares");

// main pages
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
router
  .route("/set-password")
  .get(preventCache, preventAuthVisit, setPasswordPage);
router.route("/set-password/:id").patch(setPassword);

// otp routes
router.route("/verify-otp").get(preventCache, otpPage).post(verifyOtp);
router.route("/resend-otp").post(resendOtp);

module.exports = router;
