const Product = require("../../models/productSchema");
const Order = require("../../models/orderSchema");
const Review = require("../../models/ratingSchema");
const moment = require("moment");

const reviewPage = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_id, rating } = req.query;
    const user_id = req.user.id;

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

    const existingReview = await Review.findOne({ user_id, product_id: id });
    if (existingReview) {
      return res.status(400).send("Product already reviewed");
    }

    return res.render("user/reviewPage", { product, rating });
  } catch (err) {
    return res.status(500).render("utils/userErrorPage", {
      statusCode: 500,
      message: "Server error!",
    });
  }
};

const reviewUpdatePage = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id).populate("product_id");
    if (!review) {
      return res.status(404).send("Review not found");
    }

    return res.render("user/reviewUpdatePage", { review });
  } catch (err) {
    return res.status(500).render("utils/userErrorPage", {
      statusCode: 500,
      message: "Server error!",
    });
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
      is_deleted: false,
    });
    await newReview.save();

    const reviews = await Review.find({
      product_id: productId,
      is_deleted: false,
    });
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
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

const updateReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { rating, description, productId } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5." });
    }

    const existingReview = await Review.findOne({
      _id: reviewId,
      is_deleted: false,
    });

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (
      existingReview.user_id.toString() !== userId ||
      existingReview.product_id.toString() !== productId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this review",
      });
    }

    await Review.findByIdAndUpdate(reviewId, {
      rating,
      description,
    });

    const reviews = await Review.find({
      product_id: productId,
      is_deleted: false,
    });
    const ratingCount = reviews.length;
    const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
    const avgRating = totalRating / ratingCount;

    await Product.findByIdAndUpdate(productId, {
      avg_rating: avgRating,
      rating_count: ratingCount,
    });

    return res
      .status(200)
      .json({ success: true, message: "Review updated successfully." });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

const allReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const reviews = await Review.find({
      user_id: userId,
      is_deleted: false,
    }).populate("product_id");
    return res.render("user/allReviews", { reviews, moment });
  } catch (err) {
    console.log("Error from allReviews controller", err);
    return res.status(500).send("An error occurred while fetching reviews");
  }
};

const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const review = await Review.findById(reviewId);

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    review.is_deleted = true;
    await review.save();

    const reviews = await Review.find({
      product_id: review.product_id,
      is_deleted: false,
    });

    const ratingCount = reviews.length;
    let avgRating = null;

    if (ratingCount > 0) {
      const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
      avgRating = totalRating / ratingCount;
    }

    await Product.findByIdAndUpdate(review.product_id, {
      avg_rating: ratingCount > 0 ? avgRating : null,
      rating_count: ratingCount > 0 ? ratingCount : null,
    });

    return res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  reviewPage,
  submitReview,
  allReviews,
  reviewUpdatePage,
  updateReview,
  deleteReview,
};
