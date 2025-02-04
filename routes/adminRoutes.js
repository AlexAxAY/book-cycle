const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../cloudinary/index.js");

// Middleware is yet to be applied please apply this before presenting.
const {
  checkAdmin,
  preventCache,
  preventAuth,
} = require("../middleware/admin/authMiddleware.js");

// Requiring banner controllers
const {
  viewBanner,
  addBanner,
  viewAllBanners,
  deleteBanner,
} = require("../controllers/admin/adminBanner.js");

// Requiring user controllers
const {
  allUsers,
  blockUser,
  unblockUser,
  userDetailsPage,
} = require("../controllers/admin/adminUserCtrl.js");

// Requiring auth controllers
const {
  viewAdminLoginPage,
  adminLogin,
  adminLogout,
} = require("../controllers/admin/adminAuth.js");

// Requiring product controllers
const {
  viewAllProductsPage,
  viewAddProducts,
  catManagePage,
  catUpdatePage,
  updateCategory,
  deleteCategory,
  catViewPage,
  createCat,
  addProduct,
  updateProductPage,
  updateProduct,
  deleteProduct,
  singleProductPage,
} = require("../controllers/admin/adminCrud.js");

// multer
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 3,
  },
});

// Admin auth route
router
  .route("/login")
  .get(preventAuth, preventCache, viewAdminLoginPage)
  .post(adminLogin);
router.route("/logout").post(adminLogout);

// Category management routes
router
  .route("/manage-category")
  .get(checkAdmin, catManagePage)
  .post(checkAdmin, createCat);
router
  .route("/manage-category/:id")
  .get(checkAdmin, catUpdatePage)
  .put(checkAdmin, updateCategory)
  .delete(checkAdmin, deleteCategory);
router.route("/view-categories").get(checkAdmin, catViewPage);

// Product routes
router.route("/products").get(checkAdmin, viewAllProductsPage);
router.route("/product-view/:id").get(checkAdmin, singleProductPage);
router
  .route("/product/:id")
  .get(checkAdmin, updateProductPage)
  .put(checkAdmin, upload.array("images"), updateProduct)
  .delete(checkAdmin, deleteProduct);
router
  .route("/add-products")
  .get(checkAdmin, viewAddProducts)
  .post(checkAdmin, upload.array("images"), addProduct);

// Banner management routes
router
  .route("/banner-management")
  .get(checkAdmin, viewBanner)
  .post(checkAdmin, upload.single("image"), addBanner);
router.route("/all-banners").get(checkAdmin, viewAllBanners);
router.route("/all-banners/:id").delete(checkAdmin, deleteBanner);

// User management routes
router.route("/users").get(checkAdmin, allUsers);
router.route("/users/block/:id").patch(checkAdmin, blockUser);
router.route("/users/unblock/:id").patch(checkAdmin, unblockUser);
router.route("/user/details/:id").get(checkAdmin, userDetailsPage);

module.exports = router;
