const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../cloudinary/index.js");

// middleware is yet to be applied please apply this before presenting.
const { checkAdmin } = require("../middleware/admin/authMiddleware.js");

// requiring banner controllers
const {
  viewBanner,
  addBanner,
  viewAllBanners,
  deleteBanner,
} = require("../controllers/admin/adminBanner.js");

// requiring auth controllers
const {
  viewAdminLoginPage,
  adminLogin,
  adminLogout,
} = require("../controllers/admin/adminAuth.js");

// requiring product controllers
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

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 3,
  },
});

// Admin auth route
router.route("/login").get(viewAdminLoginPage).post(adminLogin);
router.route("/logout").post(adminLogout);

// Category management routes
router.route("/manage-category").get(catManagePage).post(createCat);
router
  .route("/manage-category/:id")
  .get(catUpdatePage)
  .put(updateCategory)
  .delete(deleteCategory);
router.route("/view-categories").get(catViewPage);

// Product routes
router.route("/products").get(viewAllProductsPage);
router.route("/product-view/:id").get(singleProductPage);
router
  .route("/product/:id")
  .get(updateProductPage)
  .put(upload.array("images"), updateProduct)
  .delete(deleteProduct);
router
  .route("/add-products")
  .get(viewAddProducts)
  .post(upload.array("images"), addProduct);

// Banner management routes
router
  .route("/banner-management")
  .get(viewBanner)
  .post(upload.single("image"), addBanner);

router.route("/all-banners").get(viewAllBanners);
router.route("/all-banners/:id").delete(deleteBanner);
module.exports = router;
