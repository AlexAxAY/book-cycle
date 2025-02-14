const mongoose = require("mongoose");

const cancelOrderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    reason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Cancel = mongoose.model("Cancel", cancelOrderSchema);
module.exports = Cancel;
