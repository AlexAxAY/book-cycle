const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    price: { type: Number, required: true, trim: true },
    count: { type: Number, required: true, trim: true },
    category: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    publisher: { type: String, trim: true, default: null },
    name: { type: String, required: true, trim: true },
    images: [{ url: String, filename: String }],
    author: { type: String, required: true, trim: true },
    avg_rating: { type: Number, trim: true },
    rating_count: { type: Number, trim: true },
    stock: {
      type: String,
      enum: ["In stock", "Out of stock", "Limited stock"],
      required: true,
    },
    brand: { type: String, trim: true, default: null },
    discount: { type: Number, required: true, trim: true },
    discount_type: {
      type: String,
      enum: ["fixed", "percentage"],
      required: true,
    },
    final_price: { type: Number, trim: true, default: null },
    publish_date: { type: String, trim: true, default: null, required: true },
    is_deleted: { type: Boolean, default: false },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
