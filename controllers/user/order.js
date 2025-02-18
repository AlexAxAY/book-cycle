const { Cart, CartItem } = require("../../models/cartSchemas");
const { Coupon, CouponUsage } = require("../../models/couponSchemas");
const Order = require("../../models/orderSchema");
const Address = require("../../models/addressSchema");
const Product = require("../../models/productSchema");
const Cancel = require("../../models/cancelSchema");
const Rating = require("../../models/ratingSchema");
const moment = require("moment");

const orderSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate({
        path: "order_items.products",
      })
      .populate("coupon_applied");

    if (!order) {
      return console.log("order not found!");
    }

    const productIds = order.order_items.map((item) => item.products._id);

    const ratings = await Rating.find({
      user_id: req.user ? req.user.id : null,
      product_id: { $in: productIds },
    });

    const ratedProducts = {};
    ratings.forEach((rating) => {
      ratedProducts[rating.product_id.toString()] = true;
    });

    // Format order dates
    const orderCreated = moment(order.createdAt).format("MMMM Do YYYY, h:mm A");
    const orderInTransit = order.inTransitAt
      ? moment(order.inTransitAt).format("MMMM Do YYYY, h:mm A")
      : null;
    const orderShipped = order.shippedAt
      ? moment(order.shippedAt).format("MMMM Do YYYY, h:mm A")
      : null;
    const orderDelivered = order.deliveredAt
      ? moment(order.deliveredAt).format("MMMM Do YYYY, h:mm A")
      : null;

    const cancel = await Cancel.findOne({ order_id: id }).populate("user_id");
    let orderCancelled = null;
    if (cancel) {
      orderCancelled = moment(cancel.createdAt).format("MMMM Do YYYY, h:mm A");
    }

    return res.render("user/orderSummary", {
      order,
      orderCreated,
      orderInTransit,
      orderShipped,
      orderDelivered,
      orderCancelled,
      cancel,
      ratedProducts,
    });
  } catch (err) {
    console.log("Error in orderSummary controller", err);
    return res.status(500).send("server error!");
  }
};

const proceedToBuy = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { addressId, confirm, paymentMethod, couponCode } = req.body;

    if (!addressId) {
      return res
        .status(400)
        .json({ success: false, message: "Address is required." });
    }

    // Fetch the user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res
        .status(400)
        .json({ success: false, message: "Your cart is empty." });
    }

    const cartItems = await CartItem.find({ cartId: cart._id }).populate(
      "productId"
    );
    if (!cartItems || cartItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Your cart is empty." });
    }

    // Partition items into valid and invalid based on product stock
    const validCartItems = cartItems.filter(
      (item) => item.productId && item.productId.count > 0
    );
    const invalidCartItems = cartItems.filter(
      (item) => !item.productId || item.productId.count <= 0
    );
    if (invalidCartItems.length > 0) {
      const invalidIds = invalidCartItems.map((item) => item._id);
      await CartItem.deleteMany({ _id: { $in: invalidIds } });
    }

    if (validCartItems.length === 0) {
      return res.status(400).json({
        success: false,
        zero: true,
        message: "All items in your cart are out of stock.",
      });
    }

    // Check for items with insufficient stock
    const insufficientItems = validCartItems.filter(
      (item) => item.quantity > item.productId.count
    );
    if (insufficientItems.length > 0) {
      const errorMsg = insufficientItems
        .map(
          (item) =>
            `${item.productId.name || "Product"} has ${
              item.productId.count
            } in stock but you opted for ${item.quantity}`
        )
        .join(" ");
      return res
        .status(400)
        .json({ success: false, message: errorMsg, countError: true });
    }

    if (invalidCartItems.length > 0 && !confirm) {
      return res.json({
        success: false,
        partial: true,
        message:
          "Some items in your order are out of stock. Do you wish to proceed with the available items?",
      });
    }

    // Calculate totals for valid items
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
    let totalAfterDiscount = totalOriginalPrice - totalDiscountAmount;
    let deliveryCharge = totalAfterDiscount >= 500 ? 0 : 50;
    let finalTotal = totalAfterDiscount + deliveryCharge;

    // Coupon processing (if couponCode is provided)
    let couponApplied = null;
    if (couponCode && couponCode.trim() !== "") {
      const coupon = await Coupon.findOne({ coupon_code: couponCode.trim() });
      if (!coupon) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid coupon code." });
      }
      if (!coupon.active || coupon.is_deleted) {
        return res
          .status(400)
          .json({ success: false, message: "Coupon is not active." });
      }

      // Check if the user has already used this coupon
      const alreadyUsed = await CouponUsage.findOne({
        user_id: userId,
        coupon_id: coupon._id,
      });
      if (alreadyUsed) {
        return res.status(400).json({
          success: false,
          message: "You have already used this coupon.",
        });
      }

      // Check order qualification: order final total must be at least the coupon's min order value
      if (finalTotal < coupon.min_order_value) {
        return res.status(400).json({
          success: false,
          message: `Order total must be at least ₹${coupon.min_order_value} to use this coupon.`,
        });
      }

      // Calculate coupon discount amount
      let couponDiscount = 0;
      if (coupon.discount_type === "percentage") {
        couponDiscount = totalOriginalPrice * (coupon.discount_value / 100);
      } else if (coupon.discount_type === "fixed") {
        couponDiscount = coupon.discount_value;
      }
      // Add coupon discount on top of the existing product-level discount
      totalDiscountAmount = totalDiscountAmount + couponDiscount;
      couponApplied = coupon._id;

      // Recalculate totals with the additional coupon discount
      totalAfterDiscount = totalOriginalPrice - totalDiscountAmount;
      deliveryCharge = totalAfterDiscount >= 500 ? 0 : 50;
      finalTotal = totalAfterDiscount + deliveryCharge;
    }

    // Fetch shipping address snapshot
    const addressDoc = await Address.findById(addressId).lean();
    if (!addressDoc) {
      return res
        .status(400)
        .json({ success: false, message: "Shipping address not found." });
    }

    // Create a new order
    const newOrder = new Order({
      total_items: totalItems,
      order_items: validCartItems.map((item) => ({
        products: item.productId._id,
        quantity: item.quantity,
      })),
      address: {
        name: addressDoc.name,
        address_line: addressDoc.address_line,
        landmark: addressDoc.landmark,
        city: addressDoc.city,
        state: addressDoc.state,
        pincode: addressDoc.pincode,
        phone: addressDoc.phone,
        alt_phone: addressDoc.alt_phone,
        address_type: addressDoc.address_type,
      },
      user_id: userId,
      status: "Confirmed",
      selling_price: totalOriginalPrice,
      total_selling_price: totalAfterDiscount,
      coupon_applied: couponApplied,
      delivery_charge: deliveryCharge,
      final_amount: finalTotal,
      total_discount: totalDiscountAmount,
      payment_type: paymentMethod,
    });

    await newOrder.save();

    // If a coupon was applied, create a coupon usage record
    if (couponApplied) {
      const newCouponUsage = new CouponUsage({
        user_id: userId,
        order_id: newOrder._id,
        coupon_id: couponApplied,
        used_at: new Date(), // Mark usage time
      });
      await newCouponUsage.save();
    }

    // Reduce stock for each valid item
    await Promise.all(
      validCartItems.map(async (item) => {
        const updatedProduct = await Product.findByIdAndUpdate(
          item.productId._id,
          { $inc: { count: -item.quantity } },
          { new: true }
        );
        let newStock;
        if (updatedProduct.count === 0) {
          newStock = "Out of stock";
        } else if (updatedProduct.count <= 5) {
          newStock = "Limited stock";
        } else {
          newStock = "In stock";
        }
        if (updatedProduct.stock !== newStock) {
          await Product.findByIdAndUpdate(updatedProduct._id, {
            stock: newStock,
          });
        }
      })
    );

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

const orders = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    let query = { user_id: userId };

    if (req.query.statusFilter) {
      query.status = req.query.statusFilter;
    }

    if (req.query.yearFilter && req.query.yearFilter === "2025") {
      const start = new Date(2025, 0, 1);
      const end = new Date(2025, 11, 31, 23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    const ordersData = await Order.find(query)
      .populate({ path: "order_items.products" })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

    if (req.xhr || req.query.ajax) {
      return res.json({
        orders: ordersData,
        totalPages,
        currentPage: page,
      });
    }

    return res.render("user/ordersPage", {
      orders: ordersData,
      totalPages,
      currentPage: page,
      selectedStatus: req.query.statusFilter || "",
      selectedYear: req.query.yearFilter || "",
    });
  } catch (err) {
    console.log("Error in orders controller", err);
    res.status(500).send("Server Error");
  }
};

const cancelOrder = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { reason } = req.body;
    const { id } = req.params;

    let order = await Order.findById(id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Only allow cancellation if status is "Confirmed" or "In transit"
    if (order.status !== "Confirmed" && order.status !== "In transit") {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled at this stage",
      });
    }

    // Create a cancellation record
    const cancelRecord = new Cancel({
      user_id: userId,
      order_id: id,
      reason: reason || null,
    });
    await cancelRecord.save();

    // Update the order status to "Cancelled"
    order.status = "Cancelled";
    await order.save();

    // Return the purchased quantity back to the product's stock.
    await Promise.all(
      order.order_items.map(async (item) => {
        const updatedProduct = await Product.findByIdAndUpdate(
          item.products,
          { $inc: { count: item.quantity } },
          { new: true }
        );

        let newStock;
        if (updatedProduct.count === 0) {
          newStock = "Out of stock";
        } else if (updatedProduct.count <= 5) {
          newStock = "Limited stock";
        } else {
          newStock = "In stock";
        }

        if (updatedProduct.stock !== newStock) {
          await Product.findByIdAndUpdate(updatedProduct._id, {
            stock: newStock,
          });
        }
      })
    );

    return res.json({
      success: true,
      message: "Order cancelled",
    });
  } catch (error) {
    console.error("Error in cancelOrder controller:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const userId = req.user.id;
    const { couponCode } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res
        .status(400)
        .json({ success: false, message: "Your cart is empty." });
    }

    const cartItems = await CartItem.find({ cartId: cart._id }).populate(
      "productId"
    );
    if (!cartItems || cartItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Your cart is empty." });
    }

    // Use only valid items (in stock)
    const validCartItems = cartItems.filter(
      (item) => item.productId && item.productId.count > 0
    );
    if (validCartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All items in your cart are out of stock.",
      });
    }

    // Calculate totals for valid items
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
    let totalAfterDiscount = totalOriginalPrice - totalDiscountAmount;
    let deliveryCharge = totalAfterDiscount >= 500 ? 0 : 50;
    let finalTotal = totalAfterDiscount + deliveryCharge;

    // If a coupon code is provided, validate and apply it
    if (couponCode && couponCode.trim() !== "") {
      const coupon = await Coupon.findOne({ coupon_code: couponCode.trim() });
      if (!coupon) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid coupon code" });
      }
      if (!coupon.active || coupon.is_deleted) {
        return res
          .status(400)
          .json({ success: false, message: "Coupon is not active" });
      }
      // Check if the user has already used this coupon
      const alreadyUsed = await CouponUsage.findOne({
        user_id: userId,
        coupon_id: coupon._id,
      });
      if (alreadyUsed) {
        return res.status(400).json({
          success: false,
          message: "You have already used this coupon",
        });
      }
      // Check order qualification: final total must be at least the coupon's min order value
      if (finalTotal < coupon.min_order_value) {
        return res.status(400).json({
          success: false,
          message: `Order total must be at least ₹${coupon.min_order_value} to use this coupon`,
        });
      }
      // Calculate coupon discount amount
      let couponDiscount = 0;
      if (coupon.discount_type === "percentage") {
        couponDiscount = totalOriginalPrice * (coupon.discount_value / 100);
      } else if (coupon.discount_type === "fixed") {
        couponDiscount = coupon.discount_value;
      }

      totalDiscountAmount += couponDiscount;

      totalAfterDiscount = totalOriginalPrice - totalDiscountAmount;
      deliveryCharge = totalAfterDiscount >= 500 ? 0 : 50;
      finalTotal = totalAfterDiscount + deliveryCharge;
    }

    return res.json({
      success: true,
      message: "Coupon applied.",
      checkoutData: {
        totalItems,
        totalOriginalPrice,
        totalDiscountAmount,
        totalAfterDiscount,
        deliveryCharge,
        finalTotal,
      },
    });
  } catch (err) {
    console.error("Error in applyCoupon:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  orderSummary,
  proceedToBuy,
  orders,
  cancelOrder,
  applyCoupon,
};
