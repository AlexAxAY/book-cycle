const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const couponSchema = new Schema(
  {
    coupon_code: { type: String, required: true, unique: true, trim: true },
    discount_value: { type: Number, required: true, trim: true },
    discount_type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    min_order_value: { type: Number, required: true, trim: true },
    active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

const couponUsageSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, required: true },
    order_id: { type: Schema.Types.ObjectId, required: true },
    used_at: { type: Date, default: null },
    coupon_id: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);
const CouponUsage = mongoose.model("CouponUsage", couponUsageSchema);

module.exports = { Coupon, CouponUsage };
