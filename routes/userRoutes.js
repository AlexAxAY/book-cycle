const express = require("express");
const router = express.Router();

const { landingPage, shoppingPage } = require("../controllers/user/userPages");

router.route("/home").get(landingPage);
router.route("/shop").get(shoppingPage);

module.exports = router;
