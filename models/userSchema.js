const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: null },
    email: { type: String, unique: true, default: null },
    password: { type: String, default: null },
    gender: { type: String, enum: ["male", "female"], default: null },
    googleId: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    ref_id: { type: String, default: null, unique: true },
    referred_by: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "User",
    },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
