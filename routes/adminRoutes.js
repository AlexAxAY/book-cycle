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

// Requiring user controllers
const {
  salesReportPage,
  downloadSalesReportExcel,
  downloadSalesReportPDF,
} = require("../controllers/admin/salesReport.js");

// Requiring coupon controllers
const {
  couponForm,
  addCoupon,
  allCoupons,
  editCoupon,
  couponUpdateForm,
  deleteCoupon,
} = require("../controllers/admin/coupon.js");

// Requiring offer module controllers
const {
  offerModulePage,
  applyOffer,
  viewOffers,
} = require("../controllers/admin/offers.js");

// Requiring auth controllers
const {
  viewAdminLoginPage,
  adminLogin,
  adminLogout,
} = require("../controllers/admin/adminAuth.js");

// Order controllers
const {
  allOrders,
  getSingleOrder,
  updateOrderStatus,
  handleReturnDecision,
} = require("../controllers/admin/orders.js");

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

// User management routes
router.route("/users").get(allUsers);
router.route("/users/block/:id").patch(blockUser);
router.route("/users/unblock/:id").patch(unblockUser);
router.route("/user/details/:id").get(userDetailsPage);

// Order routes
router.route("/all-orders").get(allOrders);
router.route("/order/:id").get(getSingleOrder).post(updateOrderStatus);
router.route("/order/return/:id").post(handleReturnDecision);

// Coupon routes
router.route("/add-coupon").get(couponForm).post(addCoupon);
router.route("/coupons").get(allCoupons);
router
  .route("/coupon/:id")
  .put(editCoupon)
  .get(couponUpdateForm)
  .delete(deleteCoupon);

// Offer routes
router.route("/add-offer").get(offerModulePage).post(applyOffer);
router.route("/offers").get(viewOffers);

// sales report route
router.route("/sales-report").get(salesReportPage);
router.get("/sales-report/pdf-download", downloadSalesReportPDF);
router.get("/sales-report/excel-download", downloadSalesReportExcel);

module.exports = router;
