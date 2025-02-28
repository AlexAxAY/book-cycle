const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const { WalletTransaction } = require("../../models/walletSchemas");

const dashboard = async (req, res) => {
  try {
    // 1. Dashboard Aggregations

    // Top 10 Best Selling Products (only product name and total quantity)
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

    // Top 10 Categories by Orders (only category name and total quantity)
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

    // Top 10 Rated Products (only product name)
    const topRatedProducts = await Product.find({ avg_rating: { $ne: null } })
      .sort({ avg_rating: -1, rating_count: -1 })
      .limit(10)
      .select("name -_id");

    // ==========================
    // 2. Sales Chart Calculations
    // ==========================
    const { filter, fromDate, toDate } = req.query;
    let query = {};
    let startDate, endDate;
    let currentFilter = filter; // expected values: "weekly", "monthly", "yearly"
    const now = new Date();

    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
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
        // Default to monthly if unknown filter
        currentFilter = "monthly";
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }
    } else {
      // Default to monthly if no filter provided
      currentFilter = "monthly";
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }
    query.createdAt = { $gte: startDate, $lte: endDate };

    // Fetch orders within the date range (for revenue, discount, and orders count).
    const orders = await Order.find(query).populate("user_id");

    // Exclude orders that are cancelled and paid via COD for revenue calculations.
    const validOrders = orders.filter(
      (order) => !(order.status === "Cancelled" && order.payment_type === "COD")
    );
    const totalOrders = orders.length;

    // Calculate total discount overall (for summary card if needed)
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

    // Sum up final amount and delivery charge from valid orders.
    const totalFinalAmount = validOrders.reduce(
      (acc, order) => acc + order.final_amount,
      0
    );
    const totalDeliveryCharge = validOrders.reduce(
      (acc, order) => acc + order.delivery_charge,
      0
    );

    // Fetch refunds from WalletTransaction.
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

    // Calculate total revenue.
    const totalRevenue = totalFinalAmount - totalRefund - totalDeliveryCharge;

    // Helper function to bucket dates based on the filter.
    const getKey = (date) => {
      if (currentFilter === "weekly") {
        return date.toLocaleDateString("en-US", { weekday: "long" });
      } else if (currentFilter === "monthly") {
        return date.getDate().toString();
      } else if (currentFilter === "yearly") {
        return date.toLocaleDateString("en-US", { month: "long" });
      } else {
        return date.toISOString().split("T")[0];
      }
    };

    // Group orders to calculate revenue and orders count per time bucket.
    const ordersRevenueMap = {};
    const ordersCountMap = {};
    validOrders.forEach((order) => {
      const key = getKey(new Date(order.createdAt));
      const revenue = order.final_amount - order.delivery_charge;
      ordersRevenueMap[key] = (ordersRevenueMap[key] || 0) + revenue;
      ordersCountMap[key] = (ordersCountMap[key] || 0) + 1;
    });

    // Group refunds similarly.
    const refundsMap = {};
    const refunds = await WalletTransaction.find(walletTransactionQuery);
    refunds.forEach((refund) => {
      const key = getKey(new Date(refund.createdAt));
      refundsMap[key] = (refundsMap[key] || 0) + refund.amount;
    });

    // Compute discount per bucket (using all orders).
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

    // Prepare a consistent set of labels for the chart.
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
    }

    // Build chart data for each label.
    const chartData = labels.map((label) => {
      const revenueFromOrders = ordersRevenueMap[label] || 0;
      const refundAmount = refundsMap[label] || 0;
      const netRevenue = revenueFromOrders - refundAmount;
      const discount = discountMap[label] || 0;
      const ordersCount = ordersCountMap[label] || 0;
      return { label, netRevenue, discount, refundAmount, ordersCount };
    });

    // ==========================
    // 3. Render the Dashboard View
    // ==========================
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
