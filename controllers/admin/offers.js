const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const Offer = require("../../models/offerSchema");
const moment = require("moment");

const offerModulePage = async (req, res) => {
  try {
    const categories = await Category.find({ is_deleted: false });
    const products = await Product.find({ is_deleted: false });

    return res.render("adminPanel/offerModule", { categories, products });
  } catch (err) {
    return res.status(500).render("utils/errorPage", {
      statusCode: 500,
      message: "Server Error!",
    });
  }
};

const applyOffer = async (req, res) => {
  try {
    const {
      applyBy,
      productName,
      category,
      discountType,
      discountValue,
      action,
    } = req.body;

    if (
      discountValue === undefined ||
      discountValue === null ||
      discountValue === ""
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Discount value is required." });
    }

    const discVal = parseFloat(discountValue);
    if (isNaN(discVal)) {
      return res
        .status(400)
        .json({ success: false, message: "Discount value must be a number." });
    }

    if (discVal < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value cannot be negative.",
      });
    }

    if (discountType === "percentage" && discVal > 90) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 90%.",
      });
    }

    if (!action || (action !== "increase" && action !== "decrease")) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action specified." });
    }

    const computeDiscountAmount = (price, type, value) => {
      return type === "percentage" ? price * (value / 100) : value;
    };

    let offerData = { discountType, discountValue: discVal, action };

    const processProducts = async (products) => {
      let failedProducts = [];
      for (const product of products) {
        const effectiveFinalPrice =
          product.final_price !== undefined && product.final_price !== null
            ? product.final_price
            : product.price;

        if (discountType === "fixed" && discVal > effectiveFinalPrice) {
          failedProducts.push(product.name);
          continue;
        }
        const newDiscountAmt = computeDiscountAmount(
          product.price,
          discountType,
          discVal
        );
        const currentDiscountAmt = computeDiscountAmount(
          product.price,
          product.discount_type,
          product.discount
        );

        if (action === "increase") {
          if (newDiscountAmt > currentDiscountAmt) {
            await Product.findByIdAndUpdate(product._id, {
              discount: discVal,
              discount_type: discountType,
              final_price: product.price - newDiscountAmt,
            });
          }
        } else if (action === "decrease") {
          await Product.findByIdAndUpdate(product._id, {
            discount: discVal,
            discount_type: discountType,
            final_price: product.price - newDiscountAmt,
          });
        }
      }
      return failedProducts;
    };

    if (applyBy === "name") {
      if (productName === "All products") {
        const products = await Product.find({});
        const failedProducts = await processProducts(products);
        if (failedProducts.length > 0) {
          return res.status(400).json({
            success: false,
            message: `The following products have a final price lower than the offered discount: ${failedProducts.join(
              ", "
            )}`,
          });
        }
        offerData.product = null;
        offerData.allProducts = true;
      } else {
        const product = await Product.findOne({ name: productName });
        if (!product) {
          return res
            .status(404)
            .json({ success: false, message: "Product not found." });
        }
        const effectiveFinalPrice =
          product.final_price !== undefined && product.final_price !== null
            ? product.final_price
            : product.price;
        if (discountType === "fixed" && discVal > effectiveFinalPrice) {
          return res.status(400).json({
            success: false,
            message: `Fixed discount cannot exceed the final price of the product ${product.name}.`,
          });
        }
        const newDiscountAmt = computeDiscountAmount(
          product.price,
          discountType,
          discVal
        );
        const currentDiscountAmt = computeDiscountAmount(
          product.price,
          product.discount_type,
          product.discount
        );
        if (action === "increase") {
          if (newDiscountAmt > currentDiscountAmt) {
            await Product.findByIdAndUpdate(product._id, {
              discount: discVal,
              discount_type: discountType,
              final_price: product.price - newDiscountAmt,
            });
          }
        } else if (action === "decrease") {
          await Product.findByIdAndUpdate(product._id, {
            discount: discVal,
            discount_type: discountType,
            final_price: product.price - newDiscountAmt,
          });
        }
        offerData.product = product._id;
      }
    } else if (applyBy === "category") {
      if (category === "All categories") {
        const products = await Product.find({});
        const failedProducts = await processProducts(products);
        if (failedProducts.length > 0) {
          return res.status(400).json({
            success: false,
            message: `The following products have a final price lower than the offered discount: ${failedProducts.join(
              ", "
            )}`,
          });
        }
        offerData.category = null;
        offerData.allCategories = true;
      } else {
        const products = await Product.find({ category: category });
        if (!products || products.length === 0) {
          return res.status(404).json({
            success: false,
            message: "No products found in this category.",
          });
        }
        const failedProducts = await processProducts(products);
        if (failedProducts.length > 0) {
          return res.status(400).json({
            success: false,
            message: `The following products have a final price lower than the offered discount: ${failedProducts.join(
              ", "
            )}`,
          });
        }
        offerData.category = category;
      }
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid application method." });
    }

    await Offer.create(offerData);

    return res.json({ success: true, message: "Offer applied successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const viewOffers = async (req, res) => {
  try {
    let query = {};

    if (req.query.ajax) {
      if (req.query.filterPeriod) {
        const now = moment();
        let startDate, endDate;
        switch (req.query.filterPeriod) {
          case "1": // Today
            startDate = now.clone().startOf("day");
            endDate = now.clone().endOf("day");
            break;
          case "2": // Yesterday
            startDate = now.clone().subtract(1, "days").startOf("day");
            endDate = now.clone().subtract(1, "days").endOf("day");
            break;
          case "3": // This Week
            startDate = now.clone().startOf("week");
            endDate = now.clone().endOf("week");
            break;
          case "4": // This Month
            startDate = now.clone().startOf("month");
            endDate = now.clone().endOf("month");
            break;
          case "5": // This Year
            startDate = now.clone().startOf("year");
            endDate = now.clone().endOf("year");
            break;
        }
        if (startDate && endDate) {
          query.createdAt = {
            $gte: startDate.toDate(),
            $lte: endDate.toDate(),
          };
        }
      }

      if (req.query.fromDate && req.query.toDate) {
        query.createdAt = {
          $gte: new Date(req.query.fromDate),
          $lte: new Date(req.query.toDate),
        };
      }
    }

    const offers = await Offer.find(query)
      .populate("product")
      .populate("category")
      .sort({ createdAt: -1 });

    if (req.query.ajax) {
      return res.json({ offers, moment });
    } else {
      return res.render("adminPanel/viewOffers", { offers, moment });
    }
  } catch (err) {
    return res.status(500).render("utils/errorPage", {
      statusCode: 500,
      message: "Server Error!",
    });
  }
};

module.exports = { offerModulePage, applyOffer, viewOffers };
