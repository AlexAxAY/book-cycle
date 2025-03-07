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

// Requiring dashboard controller
const { dashboard } = require("../controllers/admin/dashboard.js");

// Requiring wallet controller
const {
  walletPage,
  singleWalletInfo,
} = require("../controllers/admin/wallet.js");

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
  .put(upload.array("images"), checkAdmin, updateProduct)
  .delete(checkAdmin, deleteProduct);
router
  .route("/add-products")
  .get(checkAdmin, viewAddProducts)
  .post(upload.array("images"), checkAdmin, addProduct);

// Banner management routes
router
  .route("/banner-management")
  .get(checkAdmin, viewBanner)
  .post(upload.single("image"), checkAdmin, addBanner);
router.route("/all-banners").get(checkAdmin, viewAllBanners);
router.route("/all-banners/:id").delete(checkAdmin, deleteBanner);

// User management routes
router.route("/users").get(checkAdmin, allUsers);
router.route("/users/block/:id").patch(checkAdmin, blockUser);
router.route("/users/unblock/:id").patch(checkAdmin, unblockUser);
router.route("/user/details/:id").get(checkAdmin, userDetailsPage);

// Order routes
router.route("/all-orders").get(checkAdmin, allOrders);
router
  .route("/order/:id")
  .get(getSingleOrder)
  .post(checkAdmin, updateOrderStatus);
router.route("/order/return/:id").post(checkAdmin, handleReturnDecision);

// Coupon routes
router
  .route("/add-coupon")
  .get(checkAdmin, couponForm)
  .post(checkAdmin, addCoupon);
router.route("/coupons").get(checkAdmin, allCoupons);
router
  .route("/coupon/:id")
  .put(checkAdmin, editCoupon)
  .get(checkAdmin, couponUpdateForm)
  .delete(checkAdmin, deleteCoupon);

// Offer routes
router
  .route("/add-offer")
  .get(checkAdmin, offerModulePage)
  .post(checkAdmin, applyOffer);
router.route("/offers").get(checkAdmin, viewOffers);

// sales report route
router.route("/sales-report").get(checkAdmin, salesReportPage);
router.get("/sales-report/pdf-download", checkAdmin, downloadSalesReportPDF);
router.get(
  "/sales-report/excel-download",
  checkAdmin,
  downloadSalesReportExcel
);

// dashboard route
router.route("/dashboard").get(checkAdmin, dashboard);

// wallet route
router.route("/wallet").get(checkAdmin, walletPage);
router.route("/wallet/:id").get(checkAdmin, singleWalletInfo);

module.exports = router;
