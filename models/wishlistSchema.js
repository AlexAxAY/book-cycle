const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const wishlistItemSchema = new mongoose.Schema(
  {
    wishlistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wishlist",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { timestamps: true }
);

const WishlistItem = mongoose.model("WishlistItem", wishlistItemSchema);
const Wishlist = mongoose.model("Wishlist", wishlistSchema);

module.exports = { Wishlist, WishlistItem };
