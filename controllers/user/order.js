const { Cart, CartItem } = require("../../models/cartSchemas");
const { Coupon, CouponUsage } = require("../../models/couponSchemas");
const { Wallet, WalletTransaction } = require("../../models/walletSchemas");
const Order = require("../../models/orderSchema");
const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const Product = require("../../models/productSchema");
const Cancel = require("../../models/cancelSchema");
const Rating = require("../../models/ratingSchema");
const ejs = require("ejs");
const path = require("path");
const puppeteer = require("puppeteer");
const moment = require("moment");
const razorpayInstance = require("../../services/razorpay");
const {
  generateCustomWalletId,
  generateCustomOrderId,
} = require("../../services/randomOrderId");

const orderSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate({
        path: "order_items.product",
      })
      .populate("coupon_applied");

    if (!order) {
      const error = new Error("Order not found");
      error.statusCode = 404;
      throw error;
    }
    const productIds = order.order_items.map((item) => item.product._id);

    const ratings = await Rating.find({
      user_id: req.user ? req.user.id : null,
      product_id: { $in: productIds },
    });

    const ratedProducts = {};
    ratings.forEach((rating) => {
      ratedProducts[rating.product_id.toString()] = true;
    });

    // Format order dates
    const orderCreated = moment(order.updatedAt).format("MMMM Do YYYY, h:mm A");
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

    const totalBeforeCoupon = order.order_items.reduce(
      (acc, item) => acc + item.quantity * item.final_price_at_purchase,
      0
    );
    const couponDiscountValue = totalBeforeCoupon - order.final_amount;

    const totalProductDiscount = order.order_items.reduce(
      (acc, item) => acc + item.discount_at_purchase * item.quantity,
      0
    );

    return res.render("user/orderSummary", {
      order,
      orderCreated,
      orderInTransit,
      orderShipped,
      orderDelivered,
      orderCancelled,
      cancel,
      ratedProducts,
      couponDiscountValue,
      totalProductDiscount,
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to record wallet deduction.
async function recordWalletDeduction(userId, orderId, walletAmount) {
  if (walletAmount && walletAmount > 0) {
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await Wallet.create({ user: userId, balance: 0 });
    }
    wallet.balance -= walletAmount;
    await wallet.save();

    await WalletTransaction.create({
      wallet: wallet._id,
      type: "debit",
      amount: walletAmount,
      order: orderId,
      description: "Wallet used for order payment",
      custom_wallet_id: generateCustomWalletId(),
    });
  }
}

const proceedToBuy = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { addressId, paymentMethod, couponCode, resumedOrder, orderId } =
      req.body;

    if (!addressId) {
      return res
        .status(400)
        .json({ success: false, message: "Address is required." });
    }

    let validCartItems = [];
    let cart;
    let pendingOrder;

    if (resumedOrder && orderId) {
      pendingOrder = await Order.findOne({
        _id: orderId,
        user_id: userId,
        status: "Pending",
      }).populate("order_items.product");
      if (!pendingOrder) {
        return res
          .status(400)
          .json({ success: false, message: "Pending order not found" });
      }
      validCartItems = pendingOrder.order_items
        .filter((item) => item.product)
        .map((item) => ({
          productId: item.product,
          quantity: item.quantity,
        }));
      for (const item of validCartItems) {
        const freshProduct = await Product.findById(item.productId._id);
        if (!freshProduct) {
          return res.status(400).json({
            success: false,
            message: `Product not found for an item in your order.`,
          });
        }
        if (item.quantity > freshProduct.count) {
          return res.status(400).json({
            success: false,
            message: `${freshProduct.name} now has only ${freshProduct.count} in stock, but you ordered ${item.quantity}.`,
          });
        }
        item.productId = freshProduct;
      }
    } else {
      cart = await Cart.findOne({ userId });
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
      validCartItems = cartItems.filter(
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
          message: "All items in your cart are out of stock.",
        });
      }
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
    }

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
      if (finalTotal < coupon.min_order_value) {
        return res.status(400).json({
          success: false,
          message: `Order total must be at least ₹${coupon.min_order_value} to use this coupon.`,
        });
      }
      let couponDiscount = 0;
      if (coupon.discount_type === "percentage") {
        couponDiscount = totalAfterDiscount * (coupon.discount_value / 100);
      } else if (coupon.discount_type === "fixed") {
        couponDiscount = coupon.discount_value;
      }
      totalDiscountAmount += couponDiscount;
      totalAfterDiscount -= couponDiscount;
      couponApplied = coupon._id;
      deliveryCharge = totalAfterDiscount >= 500 ? 0 : 50;
      finalTotal = totalAfterDiscount + deliveryCharge;
    }

    if (paymentMethod !== "Razorpay" && finalTotal > 1000) {
      return res.status(400).json({
        success: false,
        message:
          "Cash on Delivery is not allowed for orders above ₹1000. Please choose online payment method.",
      });
    }

    const addressDoc = await Address.findById(addressId).lean();
    if (!addressDoc) {
      return res
        .status(400)
        .json({ success: false, message: "Shipping address not found." });
    }

    const orderData = {
      total_items: totalItems,
      order_items: validCartItems.map((item) => {
        const price = item.productId.price;
        let discount = 0;
        if (item.productId.discount_type === "percentage") {
          discount = price * (item.productId.discount / 100);
        } else if (item.productId.discount_type === "fixed") {
          discount = item.productId.discount;
        }
        const finalPrice = price - discount;
        return {
          product: item.productId._id,
          quantity: item.quantity,
          price_at_purchase: price,
          discount_at_purchase: discount,
          final_price_at_purchase: finalPrice,
          return_status: "Not requested",
          return_reason: null,
        };
      }),
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
      status: paymentMethod === "Razorpay" ? "Pending" : "Confirmed",
      selling_price: totalOriginalPrice,
      total_selling_price: totalAfterDiscount,
      coupon_applied: couponApplied,
      delivery_charge: deliveryCharge,
      final_amount: finalTotal,
      total_discount: totalDiscountAmount,
      payment_type: paymentMethod,
      custom_order_id: generateCustomOrderId(),
    };

    let walletAppliedAmount =
      req.body.walletApplied && req.body.walletAmount
        ? req.body.walletAmount
        : 0;
    let razorpayAmount = finalTotal - walletAppliedAmount;
    if (razorpayAmount < 0) razorpayAmount = 0;

    if (paymentMethod === "Razorpay") {
      let existingOrder;
      if (resumedOrder && pendingOrder) {
        existingOrder = pendingOrder;
        existingOrder.total_items = orderData.total_items;
        existingOrder.order_items = orderData.order_items;
        existingOrder.address = orderData.address;
        existingOrder.selling_price = orderData.selling_price;
        existingOrder.total_selling_price = orderData.total_selling_price;
        existingOrder.coupon_applied = orderData.coupon_applied;
        existingOrder.delivery_charge = orderData.delivery_charge;
        existingOrder.final_amount = orderData.final_amount;
        existingOrder.total_discount = orderData.total_discount;
        existingOrder.payment_type = orderData.payment_type;
        await existingOrder.save();
      } else {
        existingOrder = await Order.findOne({
          user_id: userId,
          payment_type: "Razorpay",
          status: "Pending",
        });
        if (existingOrder) {
          if (!existingOrder.custom_order_id) {
            existingOrder.custom_order_id = generateCustomOrderId();
          }
          existingOrder.total_items = orderData.total_items;
          existingOrder.order_items = orderData.order_items;
          existingOrder.address = orderData.address;
          existingOrder.selling_price = orderData.selling_price;
          existingOrder.total_selling_price = orderData.total_selling_price;
          existingOrder.coupon_applied = orderData.coupon_applied;
          existingOrder.delivery_charge = orderData.delivery_charge;
          existingOrder.final_amount = orderData.final_amount;
          existingOrder.total_discount = orderData.total_discount;
          existingOrder.payment_type = orderData.payment_type;
          await existingOrder.save();
        }
      }
      if (!existingOrder || !existingOrder.razorpay_order_id) {
        if (!existingOrder) {
          existingOrder = new Order(orderData);
          await existingOrder.save();
        }
        const options = {
          amount: razorpayAmount * 100,
          currency: "INR",
          receipt: `receipt_${existingOrder._id}`,
          payment_capture: 1,
        };
        const razorpayOrder = await razorpayInstance.orders.create(options);
        existingOrder.razorpay_order_id = razorpayOrder.id;
        await existingOrder.save();
      }
      return res.json({
        success: true,
        razorpay: true,
        orderId: existingOrder._id,
        razorpayOrderId: existingOrder.razorpay_order_id,
        amount: razorpayAmount * 100,
        key: process.env.RAZORPAY_KEY_ID,
      });
    } else {
      let finalOrder;
      if (resumedOrder && pendingOrder) {
        finalOrder = pendingOrder;
        finalOrder.total_items = orderData.total_items;
        finalOrder.order_items = orderData.order_items;
        finalOrder.address = orderData.address;
        finalOrder.selling_price = orderData.selling_price;
        finalOrder.total_selling_price = orderData.total_selling_price;
        finalOrder.coupon_applied = orderData.coupon_applied;
        finalOrder.delivery_charge = orderData.delivery_charge;
        finalOrder.final_amount = orderData.final_amount;
        finalOrder.total_discount = orderData.total_discount;
        finalOrder.payment_type = orderData.payment_type;
        finalOrder.status = "Confirmed";
        await finalOrder.save();
      } else {
        finalOrder = new Order(orderData);
        await finalOrder.save();
      }
      if (couponApplied) {
        const newCouponUsage = new CouponUsage({
          user_id: userId,
          order_id: finalOrder._id,
          coupon_id: couponApplied,
          used_at: new Date(),
        });
        await newCouponUsage.save();
      }
      if (walletAppliedAmount > 0) {
        await recordWalletDeduction(
          userId,
          finalOrder._id,
          walletAppliedAmount
        );
      }
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
      if (resumedOrder && pendingOrder) {
        if (!cart) {
          cart = await Cart.findOne({ userId });
        }
        if (cart) {
          const orderProductIds = pendingOrder.order_items
            .map((item) => (item.product ? item.product.toString() : null))
            .filter((id) => id !== null);
          if (orderProductIds.length > 0) {
            await CartItem.deleteMany({
              cartId: cart._id,
              productId: { $in: orderProductIds },
            });
          }
        }
      } else if (cart) {
        await CartItem.deleteMany({ cartId: cart._id });
      }
      return res.json({
        success: true,
        message: "Order placed successfully.",
        orderId:
          resumedOrder && pendingOrder ? pendingOrder._id : finalOrder._id,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const orders = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const user = await User.findById({ _id: userId });
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    let query = { user_id: userId };

    if (req.query.statusFilter) {
      query.status = req.query.statusFilter;
    }

    if (req.query.timeFilter) {
      switch (req.query.timeFilter) {
        case "thisWeek": {
          const start = moment().startOf("week").toDate();
          const end = moment().endOf("week").toDate();
          query.createdAt = { $gte: start, $lte: end };
          break;
        }
        case "thisMonth": {
          const start = moment().startOf("month").toDate();
          const end = moment().endOf("month").toDate();
          query.createdAt = { $gte: start, $lte: end };
          break;
        }
        case "thisYear": {
          const start = moment().startOf("year").toDate();
          const end = moment().endOf("year").toDate();
          query.createdAt = { $gte: start, $lte: end };
          break;
        }
        case "previous": {
          const end = moment().startOf("year").toDate();
          query.createdAt = { $lt: end };
          break;
        }
      }
    } else if (req.query.yearFilter) {
      const year = parseInt(req.query.yearFilter);
      if (!isNaN(year)) {
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31, 23, 59, 59, 999);
        query.createdAt = { $gte: start, $lte: end };
      }
    }

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    const ordersData = await Order.find(query)
      .populate({ path: "order_items.product" })
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
      selectedTime: req.query.timeFilter || "",
      userCreatedYear: user.createdAt.getFullYear(),
      currentYear: new Date().getFullYear(),
    });
  } catch (err) {
    next(err);
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

    if (order.status !== "Confirmed" && order.status !== "In transit") {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled at this stage",
      });
    }

    const cancelRecord = new Cancel({
      user_id: userId,
      order_id: id,
      reason: reason || null,
    });
    await cancelRecord.save();

    order.status = "Cancelled";
    await order.save();

    // Wallet Refund Logic
    let refundAmount = 0;
    if (order.payment_type === "Razorpay") {
      refundAmount = order.final_amount;
    } else {
      const walletDebits = await WalletTransaction.find({
        order: order._id,
        type: "debit",
      });
      walletDebits.forEach((txn) => {
        refundAmount += txn.amount;
      });
    }

    if (refundAmount > 0) {
      let wallet = await Wallet.findOne({ user: order.user_id });
      if (!wallet) {
        wallet = await Wallet.create({ user: order.user_id, balance: 0 });
      }
      wallet.balance += refundAmount;
      await wallet.save();

      await WalletTransaction.create({
        wallet: wallet._id,
        type: "credit",
        amount: refundAmount,
        order: order._id,
        description: "Refund on order cancellation",
        custom_wallet_id: generateCustomWalletId(),
      });
    }

    await Promise.all(
      order.order_items.map(async (item) => {
        const updatedProduct = await Product.findByIdAndUpdate(
          item.product,
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

    const validCartItems = cartItems.filter(
      (item) => item.productId && item.productId.count > 0
    );
    if (validCartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All items in your cart are out of stock.",
      });
    }

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
    let couponDiscount = 0;

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

      // Check if coupon has already been used by the user
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

      if (finalTotal < coupon.min_order_value) {
        return res.status(400).json({
          success: false,
          message: `Order total must be at least ₹${coupon.min_order_value} to use this coupon`,
        });
      }

      if (coupon.discount_type === "percentage") {
        couponDiscount = totalAfterDiscount * (coupon.discount_value / 100);
      } else if (coupon.discount_type === "fixed") {
        couponDiscount = coupon.discount_value;
      }

      totalAfterDiscount -= couponDiscount;
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
        couponDiscount,
        totalAfterDiscount,
        deliveryCharge,
        finalTotal,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const requestReturn = async (req, res) => {
  try {
    const id = req.params.id;
    const { productId, reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "A valid reason is required",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Return requests are only allowed for delivered orders",
      });
    }

    const orderItem = order.order_items.find(
      (item) => item.product.toString() === productId
    );
    if (!orderItem) {
      return res.status(404).json({
        success: false,
        message: "Product not found in order.",
      });
    }

    if (orderItem.return_status !== "Not requested") {
      return res.status(400).json({
        success: false,
        message:
          "Return request has already been submitted or processed for this product",
      });
    }

    orderItem.return_status = "Requested";
    orderItem.return_reason = reason;

    await order.save();

    return res.json({
      success: true,
      message: "Return request submitted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = await Wallet.findOne({ user: userId });
    const balance = wallet ? wallet.balance : 0;
    return res.json({ balance });
  } catch (error) {
    return res.status(500).json({
      balance: 0,
      message: "Error fetching wallet balance.",
    });
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate({ path: "order_items.product" })
      .populate("coupon_applied");

    if (!order) {
      console.log("order not found!");
      return res.status(404).send("Order not found");
    }

    const productIds = order.order_items.map((item) => item.product._id);
    const ratings = await Rating.find({
      user_id: req.user ? req.user.id : null,
      product_id: { $in: productIds },
    });
    const ratedProducts = {};
    ratings.forEach((rating) => {
      ratedProducts[rating.product_id.toString()] = true;
    });

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

    const totalBeforeCoupon = order.order_items.reduce(
      (acc, item) => acc + item.quantity * item.final_price_at_purchase,
      0
    );
    const couponDiscountValue = totalBeforeCoupon - order.final_amount;
    const totalProductDiscount = order.order_items.reduce(
      (acc, item) => acc + item.discount_at_purchase * item.quantity,
      0
    );

    const invoiceHtml = await ejs.renderFile(
      path.join(__dirname, "../../views/user/PDFOrderSummary.ejs"),
      {
        order,
        orderCreated,
        orderInTransit,
        orderShipped,
        orderDelivered,
        orderCancelled,
        ratedProducts,
        couponDiscountValue,
        totalProductDiscount,
      }
    );

    // Launch Puppeteer.
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    await page.setContent(invoiceHtml, { waitUntil: "networkidle0" });

    await new Promise((resolve) => setTimeout(resolve, 500));

    await page.emulateMediaType("print");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
      preferCSSPageSize: true,
    });

    await browser.close();

    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="invoice.pdf"',
      "Content-Length": pdfBuffer.length,
    });
    return res.end(pdfBuffer, "binary");
  } catch (err) {
    return res.status(500).render("utils/userErrorPage", {
      statusCode: 500,
      message: "Server error!",
    });
  }
};

module.exports = {
  orderSummary,
  proceedToBuy,
  orders,
  cancelOrder,
  applyCoupon,
  requestReturn,
  getWalletBalance,
  downloadInvoice,
};
