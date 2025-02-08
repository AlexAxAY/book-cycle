const express = require("express");
const router = express.Router();

// user pages
const {
  landingPage,
  shoppingPage,
  singlePage,
} = require("../controllers/user/userPages");

// carts
const { cartPage } = require("../controllers/user/cart");

// change password
const {
  changePasswordPage,
  changePassword,
  setPasswordPage,
  setPassword,
  forgotPassPage,
  forgotPassword,
} = require("../controllers/user/changePassword");

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
  ensureValidToken,
  checkingAuth,
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

// otp routes
router
  .route("/verify-otp")
  .get(preventCache, otpPage)
  .post(ensureValidToken, verifyOtp);
router.route("/resend-otp").post(resendOtp);

// cart routes
router.route("/cart").get(cartPage);

// change password routes
// add checking auth middleware, it is removed because for development
router
  .route("/change-password")
  .get(checkingAuth, changePasswordPage)
  .patch(checkingAuth, changePassword);
router
  .route("/set-password")
  .get(checkingAuth, setPasswordPage)
  .patch(checkingAuth, setPassword);
router
  .route("/forgot-password")
  .get(preventCache, forgotPassPage)
  .post(forgotPassword);

module.exports = router;
