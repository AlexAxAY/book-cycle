const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../cloudinary/index.js");
const { viewAdminLoginPage } = require("../controllers/admin/adminAuth.js");
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

// Login route
router.route("/login").get(viewAdminLoginPage);

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

module.exports = router;
