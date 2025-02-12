const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    total_items: {
      type: Number,
      required: true,
    },
    address: {
      address_line: { type: String, required: true, trim: true },
      state: { type: String, required: true },
      city: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address_type: { type: String, enum: ["work", "home"], required: true },
      landmark: { type: String, trim: true, default: null },
      alt_phone: { type: String, trim: true, default: null },
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Confirmed", "Cancelled", "In transit", "Shipped", "Delivered"],
      default: "Confirmed",
    },
    payment_type: { type: String, enum: ["COD", "Razorpay"], require: true },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        require: true,
      },
    ],
    selling_price: { type: Number, required: true },
    total_selling_price: {
      type: Number,
      required: true,
    },
    coupon_applied: {
      type: String,
      default: null,
    },
    delivery_charge: {
      type: Number,
      default: 0,
    },
    final_amount: {
      type: Number,
      required: true,
    },
    total_discount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
