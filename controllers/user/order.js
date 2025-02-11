const { Cart, CartItem } = require("../../models/cartSchemas");
const Order = require("../../models/orderSchema");

const orderSummary = (req, res) => {
  return res.render("user/orderSummary");
};

const proceedToBuy = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;

    const { addressId, confirm } = req.body;
    if (!addressId) {
      return res
        .status(400)
        .json({ success: false, message: "Address is required." });
    }

    // Find the user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res
        .status(400)
        .json({ success: false, message: "Your cart is empty." });
    }

    // Get all cart items with product details populated
    const cartItems = await CartItem.find({ cartId: cart._id }).populate(
      "productId"
    );
    if (!cartItems || cartItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Your cart is empty." });
    }

    // Filter items into valid and invalid based on product stock count
    const validCartItems = cartItems.filter(
      (item) => item.productId && item.productId.count > 0
    );
    const invalidCartItems = cartItems.filter(
      (item) => !item.productId || item.productId.count <= 0
    );

    if (validCartItems.length === 0) {
      return res.status(400).json({
        success: false,
        zero: true,
        message: "All items in your cart are out of stock.",
      });
    }

    // If there are out-of-stock items and the user has not confirmed, return a response for confirmation
    if (invalidCartItems.length > 0 && !confirm) {
      return res.json({
        success: false,
        partial: true,
        message:
          "Some items in your order are out of stock. Do you wish to proceed with the available items?",
      });
    }

    // Perform calculations for valid items only
    let totalOriginalPrice = 0;
    let totalDiscountAmount = 0;
    let totalItems = 0;

    validCartItems.forEach((item) => {
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

    const totalAfterDiscount = totalOriginalPrice - totalDiscountAmount;
    const deliveryCharge = totalAfterDiscount >= 500 ? 0 : 50;
    const finalTotal = totalAfterDiscount + deliveryCharge;

    // Create a new order with only valid items
    const newOrder = new Order({
      total_items: totalItems,
      address_id: addressId,
      user_id: userId,
      status: "Confirmed",
      products: validCartItems.map((item) => item.productId._id),
      total_selling_price: totalAfterDiscount,
      coupon_applied: null,
      delivery_charge: deliveryCharge,
      final_amount: finalTotal,
      total_discount: totalDiscountAmount,
    });

    await newOrder.save();

    await CartItem.deleteMany({ cartId: cart._id });

    return res.json({
      success: true,
      message: "Order placed successfully.",
      orderId: newOrder._id,
    });
  } catch (error) {
    console.error("Error in proceedToBuy:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { orderSummary, proceedToBuy };
