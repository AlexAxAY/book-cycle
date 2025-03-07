const Order = require("../../models/orderSchema");
const { WalletTransaction } = require("../../models/walletSchemas");
const moment = require("moment");
const {
  generateExcelReport,
  generatePDFReport,
} = require("../admin/pdfAndExcel");

const salesReportPage = async (req, res) => {
  try {
    const { filter, fromDate, toDate, page } = req.query;
    const currentPage = parseInt(page) || 1;
    const limit = 30;
    const skip = (currentPage - 1) * limit;

    let query = {};
    let startDate, endDate;

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

    const ordersCount = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate("user_id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const validOrders = orders.filter(
      (order) => !(order.status === "Cancelled" && order.payment_type === "COD")
    );

    const totalOrders = ordersCount;

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

    const totalRevenue = totalFinalAmount - totalRefund - totalDeliveryCharge;

    const totalPages = Math.ceil(totalOrders / limit);

    if (req.xhr) {
      return res.json({
        orders,
        totalRevenue,
        totalDiscount,
        totalOrders,
        totalRefund,
        currentPage,
        totalPages,
      });
    } else {
      return res.render("adminPanel/salesReport", {
        orders,
        moment,
        totalRevenue,
        totalDiscount,
        totalOrders,
        totalRefund,
        currentPage,
        totalPages,
        filter,
        fromDate,
        toDate,
      });
    }
  } catch (err) {
    console.error("Error in salesReportPage controller:", err);
    return res.status(500).send("Internal Server Error");
  }
};

const downloadSalesReportPDF = async (req, res) => {
  try {
    const { filter, fromDate, toDate } = req.query;
    let query = {};
    let startDate, endDate;

    // Build query based on custom date range or filter value.
    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
      query.createdAt = { $gte: startDate, $lte: endDate };
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
    const totalOrders = orders.length;

    // For revenue, exclude orders that are cancelled and paid via COD.
    const validOrders = orders.filter(
      (order) => !(order.status === "Cancelled" && order.payment_type === "COD")
    );

    // Calculate total discount across all orders.
    // For cancelled COD orders, subtract the individual product discounts.
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

    // Sum up final amount only from valid orders.
    const totalFinalAmount = validOrders.reduce(
      (acc, order) => acc + order.final_amount,
      0
    );
    const totalDeliveryCharge = validOrders.reduce(
      (acc, order) => acc + order.delivery_charge,
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

    // Calculate total revenue.
    const totalRevenue = totalFinalAmount - totalRefund - totalDeliveryCharge;

    // Prepare data for the PDF.
    const data = {
      orders,
      totalRevenue,
      totalDiscount,
      totalOrders,
      totalRefund,
      moment,
    };

    // Generate the PDF using the separate module.
    const pdfBuffer = await generatePDFReport(data);

    // Send the PDF as a downloadable attachment.
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="sales_report.pdf"',
      "Content-Length": pdfBuffer.length,
    });
    return res.end(pdfBuffer, "binary");
  } catch (err) {
    console.error("Error generating PDF:", err);
    return res.status(500).send("Internal Server Error");
  }
};

const downloadSalesReportExcel = async (req, res) => {
  try {
    const { filter, fromDate, toDate } = req.query;
    let query = {};
    let startDate, endDate;

    // Use the same filtering logic.
    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
      query.createdAt = { $gte: startDate, $lte: endDate };
    } else if (filter) {
      const now = new Date();
      let start, end;
      if (filter === "1") {
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
      } else if (filter === "2") {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        start = new Date(yesterday);
        start.setHours(0, 0, 0, 0);
        end = new Date(yesterday);
        end.setHours(23, 59, 59, 999);
      } else if (filter === "3") {
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      } else if (filter === "4") {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      } else if (filter === "5") {
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

    // Fetch orders and calculate aggregates.
    const orders = await Order.find(query).populate("user_id");
    const totalOrders = orders.length;

    // Calculate total discount.
    // For orders that are cancelled and paid via COD, subtract the sum of individual product discounts.
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

    // For revenue calculation, exclude orders that are cancelled and paid via COD.
    const validOrders = orders.filter(
      (order) => !(order.status === "Cancelled" && order.payment_type === "COD")
    );
    const totalFinalAmount = validOrders.reduce(
      (acc, order) => acc + order.final_amount,
      0
    );
    const totalDeliveryCharge = validOrders.reduce(
      (acc, order) => acc + order.delivery_charge,
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

    const totalRevenue = totalFinalAmount - totalRefund - totalDeliveryCharge;

    // Use the separate module to generate the Excel report.
    const buffer = await generateExcelReport({
      orders,
      totalRevenue,
      totalDiscount,
      totalRefund,
      totalOrders,
    });

    // Set headers and send the buffer.
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="sales_report.xlsx"',
    });
    return res.send(buffer);
  } catch (err) {
    console.error("Error generating Excel report:", err);
    return res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  salesReportPage,
  downloadSalesReportPDF,
  downloadSalesReportExcel,
};
