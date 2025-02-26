const Order = require("../../models/orderSchema");
const Cancel = require("../../models/cancelSchema");
const Product = require("../../models/productSchema");
const { Wallet, WalletTransaction } = require("../../models/walletSchemas");
const moment = require("moment");

const allOrders = async (req, res) => {
  try {
    const { status, name } = req.query;
    let query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    let totalOrders = 0;
    let orders = [];

    if (name) {
      let allOrders = await Order.find(query)
        .populate({ path: "order_items.product" })
        .populate("user_id")
        .sort({ _id: -1 });

      allOrders = allOrders.filter((order) => {
        const userName = order.user_id.name || order.user_id.email;
        return userName.toLowerCase().includes(name.toLowerCase());
      });

      totalOrders = allOrders.length;
      orders = allOrders.slice((page - 1) * limit, page * limit);
    } else {
      totalOrders = await Order.countDocuments(query);
      orders = await Order.find(query)
        .populate({ path: "order_items.product" })
        .populate("user_id")
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    }

    const totalPages = Math.ceil(totalOrders / limit);

    return res.render("adminPanel/allOrdersPage", {
      orders,
      totalPages,
      currentPage: page,
      status: status || "all",
      name: name || "",
    });
  } catch (err) {
    console.log("Error from allOrders controller from admin", err);
    res.status(500).send("Server Error");
  }
};

const getSingleOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate("user_id")
      .populate({ path: "order_items.product" });
    if (!order) {
      return res.status(404).send("Order not found");
    }
    const cancel = await Cancel.findOne({ order_id: id });
    let orderCancelled = null;

    const orderCreated = moment(order.createdAt).format("MMMM Do YYYY, h:mm A");
    if (cancel) {
      orderCancelled = moment(cancel.createdAt).format("MMMM Do YYYY, h:mm A");
    }

    let orderDelivered = null;
    if (order.status === "Delivered") {
      orderDelivered = moment(order.deliveredAt).format("MMMM Do YYYY, h:mm A");
    }

    const returnDecisions = order.order_items.filter((item) =>
      ["Approved", "Rejected"].includes(item.return_status)
    );

    return res.render("adminPanel/singleOrder", {
      order,
      orderCreated,
      orderCancelled,
      orderDelivered,
      cancel,
      returnDecisions,
    });
  } catch (err) {
    console.error("Error in getSingleOrder:", err);
    return res.status(500).send("Server error");
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    let validTransitions = [];
    if (order.status === "Confirmed") {
      validTransitions = ["In transit", "Cancelled"];
    } else if (order.status === "In transit") {
      validTransitions = ["Shipped", "Cancelled"];
    } else if (order.status === "Shipped") {
      validTransitions = ["Delivered"];
    } else {
      return res.status(400).json({
        success: false,
        message: "Order status cannot be changed from this state",
      });
    }

    if (!validTransitions.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status transition" });
    }

    // If the new status is "Cancelled", create a cancellation record
    if (status === "Cancelled") {
      const cancelRecord = new Cancel({
        user_id: req.user ? req.user.id : null,
        order_id: id,
        reason: reason || null,
      });
      await cancelRecord.save();
    }

    // Set the corresponding timestamp based on the status transition
    if (status === "In transit") {
      order.inTransitAt = new Date();
    } else if (status === "Shipped") {
      order.shippedAt = new Date();
    } else if (status === "Delivered") {
      order.deliveredAt = new Date();
    }

    // Update the order status
    order.status = status;
    await order.save();

    if (status === "Cancelled") {
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
    }

    return res.json({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (err) {
    console.error("Error in updateOrderStatus:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const handleReturnDecision = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { productId, decision, adminMessage } = req.body;

    // Validate admin decision
    if (!["Approved", "Rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Invalid decision value.",
      });
    }

    if (!adminMessage) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reason to the user.",
      });
    }

    // Retrieve the order and populate coupon and user details
    const order = await Order.findById(orderId)
      .populate("coupon_applied")
      .populate("user_id");
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Check that the order's status is "Delivered"
    if (order.status !== "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Return decisions can only be processed for delivered orders.",
      });
    }

    // Find the order item corresponding to the given productId
    const orderItem = order.order_items.find(
      (item) => item.product.toString() === productId
    );
    if (!orderItem) {
      return res.status(404).json({
        success: false,
        message: "Product not found in order.",
      });
    }

    // Ensure that the return request is still in "Requested" state
    if (orderItem.return_status !== "Requested") {
      return res.status(400).json({
        success: false,
        message: "Return request is not in a valid state for processing.",
      });
    }

    // For Rejected decision: update status and save admin message
    if (decision === "Rejected") {
      orderItem.return_status = "Rejected";
      orderItem.admin_message = adminMessage;
      await order.save();
      return res.json({
        success: true,
        message: "Return request rejected.",
      });
    }

    // 1. Total final price for all order items after individual product discounts.
    const sumFinal = order.order_items.reduce((sum, item) => {
      return sum + item.final_price_at_purchase * item.quantity;
    }, 0);

    // 2. Coupon discount amount (if a coupon is applied).
    let couponDiscountAmount = 0;
    if (order.coupon_applied) {
      couponDiscountAmount = sumFinal - order.final_amount;
    }

    // 3. For the returned product, calculate its total final price.
    const productTotalFinal =
      orderItem.final_price_at_purchase * orderItem.quantity;

    // 4. Refund amount: the returned product's total final price minus half of the coupon discount.
    const refundAmount = productTotalFinal - couponDiscountAmount / 2;

    orderItem.return_status = "Approved";
    orderItem.admin_message = adminMessage;
    await order.save();

    // Update the product inventory: return the quantity to the product's stock.
    const product = await Product.findById(productId);
    if (product) {
      product.count += orderItem.quantity;

      if (product.count === 0) {
        product.stock = "Out of stock";
      } else if (product.count < 5) {
        product.stock = "Limited stock";
      } else {
        product.stock = "In stock";
      }

      await product.save();
    }

    // Update the user's wallet (order.user_id holds the user's _id).
    let wallet = await Wallet.findOne({ user: order.user_id });
    if (!wallet) {
      wallet = await Wallet.create({ user: order.user_id, balance: 0 });
    }
    wallet.balance += refundAmount;
    await wallet.save();

    // Log the wallet transaction.
    await WalletTransaction.create({
      wallet: wallet._id,
      type: "credit",
      amount: refundAmount,
      order: order._id,
      description: `Refund for return of product ${product.name}`,
    });

    return res.json({
      success: true,
      message: `Return approved. Refund of ₹${refundAmount.toFixed(
        2
      )} has been credited to the user's wallet.`,
    });
  } catch (error) {
    console.error("Error processing return decision:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

module.exports = {
  allOrders,
  getSingleOrder,
  updateOrderStatus,
  handleReturnDecision,
};
