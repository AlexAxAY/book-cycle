const express = require("express");
const router = express.Router();

// user pages
const {
  landingPage,
  shoppingPage,
  singlePage,
} = require("../controllers/user/userPages");

// carts
const {
  cartPage,
  addToCart,
  removeFromCart,
  getCartDetails,
  updateCartItem,
} = require("../controllers/user/cart");

// user profile
const { getProfile, updateProfile } = require("../controllers/user/profile");

// user address
const {
  getAddressPage,
  addAddress,
  viewAllAddress,
  deleteAddress,
  updateAddress,
  addressUpdatePage,
} = require("../controllers/user/address");

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
router.route("/cart").get(checkingAuth, cartPage);
router.route("/cart-details").get(checkingAuth, getCartDetails);
router
  .route("/cart/:productId")
  .post(checkingAuth, addToCart)
  .delete(checkingAuth, removeFromCart)
  .put(checkingAuth, updateCartItem);

// change password routes
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

// user profile management routes
router
  .route("/profile")
  .get(checkingAuth, getProfile)
  .patch(checkingAuth, updateProfile);

//  user address management routes
router
  .route("/manage-address")
  .get(checkingAuth, getAddressPage)
  .post(checkingAuth, addAddress);

router
  .route("/manage-address/:id")
  .get(checkingAuth, addressUpdatePage)
  .delete(checkingAuth, deleteAddress)
  .put(checkingAuth, updateAddress);
router.route("/view-address").get(checkingAuth, viewAllAddress);

module.exports = router;
