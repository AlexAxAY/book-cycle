const Product = require("../../models/productSchema");
const Order = require("../../models/orderSchema");
const Review = require("../../models/ratingSchema");

const reviewPage = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_id, rating } = req.query;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).send("Product not found");
    }

    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).send("Order not found");
    }

    if (order.status !== "Delivered") {
      return res
        .status(403)
        .send("You cannot review this product until it is delivered.");
    }

    return res.render("user/reviewPage", { product, rating });
  } catch (err) {
    console.error("Error in reviewPage controller:", err);
    res.status(500).send("Internal Server Error");
  }
};

const submitReview = async (req, res) => {
  try {
    const productId = req.params.id;

    const { rating, description } = req.body;

    const userId = req.user ? req.user.id : null;

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5." });
    }

    const existingReview = await Review.findOne({
      product_id: productId,
      user_id: userId,
    });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a review for this product.",
      });
    }

    const newReview = new Review({
      user_id: userId,
      product_id: productId,
      rating,
      description: description || null,
    });
    await newReview.save();

    const reviews = await Review.find({ product_id: productId });
    const ratingCount = reviews.length;
    const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
    const avgRating = totalRating / ratingCount;

    await Product.findByIdAndUpdate(productId, {
      avg_rating: avgRating,
      rating_count: ratingCount,
    });

    return res
      .status(200)
      .json({ success: true, message: "Review submitted successfully." });
  } catch (err) {
    console.error("Error in submitReview controller:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

module.exports = { reviewPage, submitReview };
