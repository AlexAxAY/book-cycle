const { Cart, CartItem } = require("../../models/cartSchemas");
const Product = require("../../models/productSchema");

// Cart page
const cartPage = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const cart = await Cart.findOne({ userId });

    let cartItems = [];
    if (cart) {
      cartItems = await CartItem.find({ cartId: cart._id })
        .populate("productId")
        .lean();

      cartItems = cartItems.filter(
        (item) => item.productId && item.productId.stock !== "Out of stock"
      );
    }

    return res.status(200).render("user/cartPage", { cartItems });
  } catch (err) {
    next(err);
  }
};

// add to cart
const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const userId = req.user ? req.user.id : null;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Please login!" });
    }

    if (!productId) {
      return res
        .status(404)
        .json({ success: false, message: "Product ID is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.stock === "Out of stock") {
      return res.status(404).json({
        success: false,
        message: "The product is out of stock",
      });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId });
      await cart.save();
    }

    let cartItem = await CartItem.findOne({ cartId: cart._id, productId });

    if (!cartItem) {
      cartItem = new CartItem({ cartId: cart._id, productId });
      await cartItem.save();
      return res.json({ success: true, message: "Product added to cart!" });
    } else {
      return res.json({ success: true, message: "Product already in cart!" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// remove from cart
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "Cart item ID is required" });
    }

    const removedItem = await CartItem.findByIdAndDelete(productId);

    if (!removedItem) {
      return res
        .status(404)
        .json({ success: false, message: "Cart item not found" });
    }

    return res.json({ success: true, message: "Item removed from cart!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// get cart details after calculation
const getCartDetails = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return res.json({ success: false, message: "User not logged in" });
    }
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.json({
        success: true,
        data: {
          totalOriginalPrice: 0,
          totalDiscountAmount: 0,
          overallDiscountPercentage: 0,
          totalAfterDiscount: 0,
          deliveryCharge: 0,
          finalTotal: 0,
          totalItems: 0,
        },
      });
    }

    const cartItems = await CartItem.find({ cartId: cart._id }).populate(
      "productId"
    );
    let totalOriginalPrice = 0;
    let totalDiscountAmount = 0;
    let totalItems = 0;

    cartItems.forEach((item) => {
      const price = item.productId.price;
      const quantity = item.quantity;
      totalOriginalPrice += price * quantity;
      totalItems += quantity;
      if (item.productId.discount_type === "percentage") {
        totalDiscountAmount +=
          price * (item.productId.discount / 100) * quantity;
      } else if (item.productId.discount_type === "fixed") {
        totalDiscountAmount += item.productId.discount * quantity;
      }
    });

    let overallDiscountPercentage = totalOriginalPrice
      ? (totalDiscountAmount / totalOriginalPrice) * 100
      : 0;
    let totalAfterDiscount = totalOriginalPrice - totalDiscountAmount;
    let deliveryCharge = totalAfterDiscount >= 500 ? 0 : 50;
    let finalTotal = totalAfterDiscount + deliveryCharge;

    return res.json({
      success: true,
      data: {
        totalOriginalPrice,
        totalDiscountAmount,
        overallDiscountPercentage,
        totalAfterDiscount,
        deliveryCharge,
        finalTotal,
        totalItems,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "Cart item ID is required" });
    }
    if (!quantity || quantity < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid quantity" });
    }

    const cartItem = await CartItem.findById(productId);
    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Cart item not found" });
    }

    const product = await Product.findById(cartItem.productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (quantity > product.count) {
      return res.status(400).json({
        success: false,
        message: `${product.count} unit${
          product.count > 1 ? "s" : ""
        } available for this product.`,
      });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    return res.json({
      success: true,
      message: "Cart item updated",
      data: cartItem,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  cartPage,
  addToCart,
  removeFromCart,
  getCartDetails,
  updateCartItem,
};
