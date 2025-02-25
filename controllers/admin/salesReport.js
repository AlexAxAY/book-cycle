const Order = require("../../models/orderSchema");
const { WalletTransaction } = require("../../models/walletSchemas");
const moment = require("moment");
const {
  generateExcelReport,
  generatePDFReport,
} = require("../admin/pdfAndExcel");

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

    // Calculate total delivery charge from orders.
    const totalDeliveryCharge = orders.reduce(
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

    // Subtract total refund and total delivery charge from total final amount.
    const totalRevenue = totalFinalAmount - totalRefund - totalDeliveryCharge;

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
