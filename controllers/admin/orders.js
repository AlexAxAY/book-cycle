const Order = require("../../models/orderSchema");
const Cancel = require("../../models/cancelSchema");
const Product = require("../../models/productSchema");
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

module.exports = { allOrders, getSingleOrder, updateOrderStatus };
