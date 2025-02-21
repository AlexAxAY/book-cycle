const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    total_items: {
      type: Number,
      required: true,
    },
    order_items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
        price_at_purchase: { type: Number, required: true },
        discount_at_purchase: { type: Number, default: 0 },
        final_price_at_purchase: { type: Number, required: true },
        return_status: {
          type: String,
          enum: ["Not requested", "Requested", "Approved", "Rejected"],
          default: "Not requested",
        },
        return_reason: { type: String, default: null },
        admin_message: { type: String, default: null },
      },
    ],
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
      enum: [
        "Pending",
        "Confirmed",
        "Cancelled",
        "In transit",
        "Shipped",
        "Delivered",
      ],
      default: "Confirmed",
    },
    inTransitAt: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    payment_type: { type: String, enum: ["COD", "Razorpay"], require: true },
    selling_price: { type: Number, required: true },
    total_selling_price: {
      type: Number,
      required: true,
    },
    coupon_applied: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
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
