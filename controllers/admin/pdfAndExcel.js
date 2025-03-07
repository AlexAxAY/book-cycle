const ExcelJS = require("exceljs");
const moment = require("moment");
const ejs = require("ejs");
const puppeteer = require("puppeteer");
const path = require("path");

async function generateExcelReport({
  orders,
  totalRevenue,
  totalDiscount,
  totalRefund,
  totalOrders,
}) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sales Report");

  worksheet.columns = [
    { header: "Order ID", key: "orderId", width: 25 },
    { header: "Date", key: "date", width: 15 },
    { header: "User", key: "user", width: 20 },
    { header: "Product Count", key: "productCount", width: 15 },
    { header: "Price", key: "price", width: 15 },
    { header: "Payment Method", key: "paymentMethod", width: 20 },
    { header: "Status", key: "status", width: 15 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF004466" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  orders.forEach((order) => {
    const row = worksheet.addRow({
      orderId: order._id.toString(),
      date: moment(order.createdAt).format("DD/MM/YY"),
      user: order.user_id.name,
      productCount: order.order_items.length,
      price: order.final_amount,
      paymentMethod: order.payment_type,
      status: order.status,
    });
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
  });

  worksheet.addRow([]);

  const summaryData = [
    ["Total Revenue", totalRevenue],
    ["Total Discount", totalDiscount],
    ["Total Refund", totalRefund],
    ["Total Orders", totalOrders],
  ];
  summaryData.forEach((data) => {
    const row = worksheet.addRow(data);
    row.font = { bold: true };
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFCCE5FF" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

async function generatePDFReport(data) {
  return new Promise((resolve, reject) => {
    const templatePath = path.join(
      __dirname,
      "../../views/adminPanel/salesReportPdf.ejs"
    );

    ejs.renderFile(templatePath, data, async (err, html) => {
      if (err) {
        console.error("Error rendering PDF template", err);
        return reject(err);
      }

      try {
        const browser = await puppeteer.launch({
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();

        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
        });
        await browser.close();
        resolve(pdfBuffer);
      } catch (err2) {
        console.error("Error generating PDF with Puppeteer", err2);
        reject(err2);
      }
    });
  });
}

module.exports = { generateExcelReport, generatePDFReport };
