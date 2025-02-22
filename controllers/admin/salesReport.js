const Order = require("../../models/orderSchema");
const { WalletTransaction } = require("../../models/walletSchemas");
const moment = require("moment");

const salesReportPage = async (req, res) => {
  try {
    const { filter, fromDate, toDate } = req.query;
    let query = {};
    let startDate, endDate;

    // Build query based on custom date range or filter value.
    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
      query.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    } else if (filter) {
      const now = new Date();
      let start, end;
      if (filter === "1") {
        // Today
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
      } else if (filter === "2") {
        // Yesterday
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        start = new Date(yesterday);
        start.setHours(0, 0, 0, 0);
        end = new Date(yesterday);
        end.setHours(23, 59, 59, 999);
      } else if (filter === "3") {
        // This Week (assuming week starts on Sunday)
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      } else if (filter === "4") {
        // This Month
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      } else if (filter === "5") {
        // This Year
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      }
      if (start && end) {
        startDate = start;
        endDate = end;
        query.createdAt = { $gte: startDate, $lte: endDate };
      }
    }

    // Fetch orders based on the query.
    const orders = await Order.find(query).populate("user_id");

    // Calculate total orders, total discount, and total final amount.
    const totalOrders = orders.length;
    const totalDiscount = orders.reduce(
      (acc, order) => acc + order.total_discount,
      0
    );
    const totalFinalAmount = orders.reduce(
      (acc, order) => acc + order.final_amount,
      0
    );

    let walletTransactionQuery = { type: "credit", order: { $ne: null } };
    if (startDate && endDate) {
      walletTransactionQuery.createdAt = { $gte: startDate, $lte: endDate };
    }

    const refundAggregate = await WalletTransaction.aggregate([
      { $match: walletTransactionQuery },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRefund =
      refundAggregate.length > 0 ? refundAggregate[0].total : 0;

    const totalRevenue = totalFinalAmount - totalRefund;

    if (req.xhr) {
      return res.json({
        orders,
        totalRevenue,
        totalDiscount,
        totalOrders,
        totalRefund,
      });
    } else {
      return res.render("adminPanel/salesReport", {
        orders,
        moment,
        totalRevenue,
        totalDiscount,
        totalOrders,
        totalRefund,
      });
    }
  } catch (err) {
    console.error("Error in salesReportPage controller:", err);
    return res.status(500).send("Internal Server Error");
  }
};

module.exports = { salesReportPage };
