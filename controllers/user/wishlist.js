const { Wishlist, WishlistItem } = require("../../models/wishlistSchema");

const wishlistPage = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.render("user/wishlistPage", { wishlistItems: [] });
    }

    const count = await WishlistItem.countDocuments({
      wishlistId: wishlist._id,
    });

    const wishlistItems = await WishlistItem.find({
      wishlistId: wishlist._id,
    }).populate("productId");

    return res.render("user/wishlistPage", { wishlistItems, count });
  } catch (err) {
    next(err);
  }
};

const addToWishlist = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { id } = req.params;

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId });
      await wishlist.save();
    }

    const existingItem = await WishlistItem.findOne({
      wishlistId: wishlist._id,
      productId: id,
    });
    if (existingItem) {
      return res.json({
        success: false,
        message: "Product is already in your wishlist.",
      });
    }

    const wishlistItem = new WishlistItem({
      wishlistId: wishlist._id,
      productId: id,
    });

    await wishlistItem.save();
    res.json({ success: true, message: "Product added to wishlist." });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Please login!" });
    }

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res
        .status(404)
        .json({ success: false, message: "Wishlist not found" });
    }

    const wishlistItem = await WishlistItem.findOneAndDelete({
      wishlistId: wishlist._id,
      productId: id,
    });

    if (!wishlistItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in wishlist" });
    }

    return res.json({
      success: true,
      message: "Item removed from wishlist",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

module.exports = { wishlistPage, addToWishlist, removeFromWishlist };
