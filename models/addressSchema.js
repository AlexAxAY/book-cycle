const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const addressSchema = new Schema(
  {
    address_line: { type: String, required: true, trim: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    state: { type: String, required: true },
    city: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address_type: { type: String, enum: ["work", "home"], required: true },
    landmark: { type: String, trim: true, default: null },
    alt_phone: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", addressSchema);
