const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const Offer = require("../../models/offerSchema");

const offerModulePage = async (req, res) => {
  try {
    const categories = await Category.find({ is_deleted: false });
    const products = await Product.find({ is_deleted: false });

    return res.render("adminPanel/offerModule", { categories, products });
  } catch (err) {
    concole.log("Error in offerModulePage controller", err);
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

    // Validate discount value existence
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

    // discount value cannot be negative
    if (discVal < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value cannot be negative.",
      });
    }

    // Percentage discount check
    if (discountType === "percentage" && discVal > 90) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 90%.",
      });
    }

    // Ensure the action field is valid
    if (!action || (action !== "increase" && action !== "decrease")) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action specified." });
    }

    // Helper to compute discount amount for a product
    const computeDiscountAmount = (price, type, value) => {
      return type === "percentage" ? price * (value / 100) : value;
    };

    // Prepare offer data to save in the Offer schema
    let offerData = { discountType, discountValue: discVal, action };

    // Function to process a list of products
    const processProducts = async (products) => {
      let failedProducts = [];
      for (const product of products) {
        // Use product.price if final_price is missing (null or undefined)
        const effectiveFinalPrice =
          product.final_price !== undefined && product.final_price !== null
            ? product.final_price
            : product.price;

        // For fixed discount, check if the entered discount exceeds effective final price
        if (discountType === "fixed" && discVal > effectiveFinalPrice) {
          failedProducts.push(product.name);
          continue; // Skip updating this product
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
          // Only update if the new discount is greater than the current one
          if (newDiscountAmt > currentDiscountAmt) {
            await Product.findByIdAndUpdate(product._id, {
              discount: discVal,
              discount_type: discountType,
              final_price: product.price - newDiscountAmt,
            });
          }
        } else if (action === "decrease") {
          // Unconditionally update for a decrease
          await Product.findByIdAndUpdate(product._id, {
            discount: discVal,
            discount_type: discountType,
            final_price: product.price - newDiscountAmt,
          });
        }
      }
      return failedProducts;
    };

    // Process offer by product name or category
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
      } else {
        // Single product by name
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
            message: `The following products/product have a final price lower than the offered discount: ${failedProducts.join(
              ", "
            )}`,
          });
        }
        offerData.category = null;
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
            message: `The following product/products have a final price lower than the offered discount: ${failedProducts.join(
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

    // Save the offer document in the Offer schema
    await Offer.create(offerData);

    return res.json({ success: true, message: "Offer applied successfully." });
  } catch (error) {
    console.error("Error applying offer:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { offerModulePage, applyOffer };
