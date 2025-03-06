const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const { WalletTransaction } = require("../../models/walletSchemas");

const dashboard = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $unwind: "$order_items" },
      {
        $group: {
          _id: "$order_items.product",
          totalQuantity: { $sum: "$order_items.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          name: "$product.name",
          totalQuantity: 1,
          _id: 0,
        },
      },
    ]);

    const topCategories = await Order.aggregate([
      { $unwind: "$order_items" },
      {
        $lookup: {
          from: "products",
          localField: "order_items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          totalQuantity: { $sum: "$order_items.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: "$_id",
          totalQuantity: 1,
          _id: 0,
        },
      },
    ]);

    const topRatedProducts = await Product.find({ avg_rating: { $ne: null } })
      .sort({ avg_rating: -1, rating_count: -1 })
      .limit(10)
      .select("name -_id");

    const { filter, fromDate, toDate } = req.query;
    let query = {};
    let startDate, endDate;
    let currentFilter = filter;
    const now = new Date();

    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      currentFilter = "custom";
    } else if (filter) {
      if (filter === "weekly") {
        // Current week: Sunday to Saturday
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else if (filter === "monthly") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (filter === "yearly") {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else {
        currentFilter = "monthly";
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }
    } else {
      currentFilter = "monthly";
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }
    query.createdAt = { $gte: startDate, $lte: endDate };

    const orders = await Order.find(query).populate("user_id");

    const validOrders = orders.filter(
      (order) => !(order.status === "Cancelled" && order.payment_type === "COD")
    );
    const totalOrders = orders.length;

    const totalDiscount = orders.reduce((acc, order) => {
      let discount = order.total_discount;
      if (order.status === "Cancelled" && order.payment_type === "COD") {
        const productDiscount = order.order_items.reduce(
          (sum, item) => sum + item.discount_at_purchase,
          0
        );
        discount = discount - productDiscount;
      }
      return acc + discount;
    }, 0);

    const totalFinalAmount = validOrders.reduce(
      (acc, order) => acc + order.final_amount,
      0
    );
    const totalDeliveryCharge = validOrders.reduce(
      (acc, order) => acc + order.delivery_charge,
      0
    );

    let walletTransactionQuery = {
      type: "credit",
      order: { $ne: null },
      createdAt: { $gte: startDate, $lte: endDate },
    };
    const refundAggregate = await WalletTransaction.aggregate([
      { $match: walletTransactionQuery },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRefund =
      refundAggregate.length > 0 ? refundAggregate[0].total : 0;

    const totalRevenue = totalFinalAmount - totalRefund - totalDeliveryCharge;

    const getKey = (date) => {
      if (currentFilter === "weekly") {
        return date.toLocaleDateString("en-US", { weekday: "long" });
      } else if (currentFilter === "monthly") {
        return date.getDate().toString();
      } else if (currentFilter === "yearly") {
        return date.toLocaleDateString("en-US", { month: "long" });
      } else if (currentFilter === "custom") {
        let dd = date.getDate().toString().padStart(2, "0");
        let mm = (date.getMonth() + 1).toString().padStart(2, "0");
        let yy = date.getFullYear().toString().slice(-2);
        return `${dd}-${mm}-${yy}`;
      }
    };

    const ordersRevenueMap = {};
    const ordersCountMap = {};
    validOrders.forEach((order) => {
      const key = getKey(new Date(order.createdAt));
      const revenue = order.final_amount - order.delivery_charge;
      ordersRevenueMap[key] = (ordersRevenueMap[key] || 0) + revenue;
      ordersCountMap[key] = (ordersCountMap[key] || 0) + 1;
    });

    const refundsMap = {};
    const refunds = await WalletTransaction.find(walletTransactionQuery);
    refunds.forEach((refund) => {
      const key = getKey(new Date(refund.createdAt));
      refundsMap[key] = (refundsMap[key] || 0) + refund.amount;
    });

    const discountMap = {};
    orders.forEach((order) => {
      const key = getKey(new Date(order.createdAt));
      let discount = order.total_discount;
      if (order.status === "Cancelled" && order.payment_type === "COD") {
        const productDiscount = order.order_items.reduce(
          (sum, item) => sum + item.discount_at_purchase,
          0
        );
        discount = discount - productDiscount;
      }
      discountMap[key] = (discountMap[key] || 0) + discount;
    });

    let labels = [];
    if (currentFilter === "weekly") {
      labels = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
    } else if (currentFilter === "monthly") {
      const daysInMonth = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        0
      ).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        labels.push(d.toString());
      }
    } else if (currentFilter === "yearly") {
      labels = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
    } else if (currentFilter === "custom") {
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      for (let i = 0; i <= diffDays; i++) {
        let labelDate = new Date(startDate);
        labelDate.setDate(startDate.getDate() + i);
        let dd = labelDate.getDate().toString().padStart(2, "0");
        let mm = (labelDate.getMonth() + 1).toString().padStart(2, "0");
        let yy = labelDate.getFullYear().toString().slice(-2);
        labels.push(`${dd}-${mm}-${yy}`);
      }
    }

    const chartData = labels.map((label) => {
      const revenueFromOrders = ordersRevenueMap[label] || 0;
      const refundAmount = refundsMap[label] || 0;
      const netRevenue = revenueFromOrders - refundAmount;
      const discount = discountMap[label] || 0;
      const ordersCount = ordersCountMap[label] || 0;
      return { label, netRevenue, discount, refundAmount, ordersCount };
    });

    return res.render("adminPanel/dashboard", {
      topProducts,
      topCategories,
      topRatedProducts,
      chartData,
      totalRevenue,
      totalDiscount,
      totalOrders,
      totalRefund,
      currentFilter,
      fromDate: startDate,
      toDate: endDate,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { dashboard };
