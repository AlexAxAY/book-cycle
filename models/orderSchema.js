const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    total_items: {
      type: Number,
      required: true,
    },
    address_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
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
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
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
