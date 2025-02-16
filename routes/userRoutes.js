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

// user review
const { reviewPage, submitReview } = require("../controllers/user/review");

// user orders
const {
  orderSummary,
  proceedToBuy,
  orders,
  cancelOrder,
} = require("../controllers/user/order");

// checkout
const {
  checkoutPage,
  addCheckoutAddress,
  checkoutAddressUpdatePage,
  checkoutAddressUpdate,
} = require("../controllers/user/checkout");

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
router.route("/cart").get(preventCache, checkingAuth, cartPage);
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
  .get(preventCache, checkingAuth, addressUpdatePage)
  .delete(checkingAuth, deleteAddress)
  .put(checkingAuth, updateAddress);
router.route("/view-address").get(checkingAuth, viewAllAddress);

// checkout routes
router
  .route("/checkout")
  .get(preventCache, checkingAuth, checkoutPage)
  .post(checkingAuth, proceedToBuy);
router.route("/checkout/address").post(checkingAuth, addCheckoutAddress);
router
  .route("/checkout/address/:id")
  .get(preventCache, checkingAuth, checkoutAddressUpdatePage)
  .put(checkingAuth, checkoutAddressUpdate);

// order routes
router
  .route("/order/:id")
  .get(preventCache, checkingAuth, orderSummary)
  .post(checkingAuth, cancelOrder);
router.route("/orders").get(checkingAuth, orders);

// review routes
router
  .route("/review/:id")
  .get(checkingAuth, reviewPage)
  .post(checkingAuth, submitReview);

module.exports = router;
