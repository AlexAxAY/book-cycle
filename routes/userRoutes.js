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
  login,
  logout,
} = require("../controllers/user/userAuth");

// pages
router.route("/home").get(landingPage);
router.route("/shop").get(shoppingPage);
router.route("/shop/product/:id").get(singlePage);

// auth
router.route("/login").get(loginForm).post(login);
router.route("/register").get(registerForm).post(register);
router.route("/logout").post(logout);

module.exports = router;
