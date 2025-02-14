const Order = require("../../models/orderSchema");
const Cancel = require("../../models/cancelSchema");
const moment = require("moment");

const allOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: "order_items.products",
      })
      .populate("user_id");
    return res.render("adminPanel/allOrdersPage", { orders });
  } catch (err) {
    console.log("Error from allOrders conmtroller from admin", err);
  }
};

const getSingleOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate("user_id")
      .populate({ path: "order_items.products" });
    if (!order) {
      return res.status(404).send("Order not found");
    }
    const cancel = await Cancel.findOne({ order_id: id });
    let orderCancelled = null;

    const orderCreated = moment(order.createdAt).format("MMMM Do YYYY, h:mm A");
    if (cancel) {
      orderCancelled = moment(cancel.createdAt).format("MMMM Do YYYY, h:mm A");
    }
    return res.render("adminPanel/singleOrder", {
      order,
      orderCreated,
      orderCancelled,
      cancel,
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

    if (status === "Cancelled") {
      const cancelRecord = new Cancel({
        user_id: req.user ? req.user.id : null,
        order_id: id,
        reason: reason || null,
      });
      await cancelRecord.save();
    }

    order.status = status;
    await order.save();

    return res.json({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (err) {
    console.error("Error in updateOrderStatus:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { allOrders, getSingleOrder, updateOrderStatus };
