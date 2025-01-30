const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../cloudinary/index.js");

// middleware
const { checkAdmin } = require("../middleware/admin/authMiddleware.js");

const {
  viewAdminLoginPage,
  adminLogin,
  adminLogout,
} = require("../controllers/admin/adminAuth.js");

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

module.exports = router;
