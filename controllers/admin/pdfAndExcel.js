// services/excelReportGenerator.js
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
  // Create a new Excel workbook and worksheet.
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sales Report");

  // Define columns for orders.
  worksheet.columns = [
    { header: "Order ID", key: "orderId", width: 25 },
    { header: "Date", key: "date", width: 15 },
    { header: "User", key: "user", width: 20 },
    { header: "Product Count", key: "productCount", width: 15 },
    { header: "Price", key: "price", width: 15 },
    { header: "Payment Method", key: "paymentMethod", width: 20 },
    { header: "Status", key: "status", width: 15 },
  ];

  // Style the header row.
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

  // Add a row for each order.
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

  // Add an empty row before the summary.
  worksheet.addRow([]);

  // Add summary rows.
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
        fgColor: { argb: "FFCCE5FF" }, // light blue fill
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

  // Write the workbook to a buffer and return it.
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

async function generatePDFReport(data) {
  return new Promise((resolve, reject) => {
    // Define the path to the EJS template.
    const templatePath = path.join(
      __dirname,
      "../../views/adminPanel/salesReportPdf.ejs"
    );

    // Render the EJS template to an HTML string.
    ejs.renderFile(templatePath, data, async (err, html) => {
      if (err) {
        console.error("Error rendering PDF template", err);
        return reject(err);
      }

      try {
        // Launch Puppeteer with necessary args.
        const browser = await puppeteer.launch({
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();
        // Set the page content with the rendered HTML.
        await page.setContent(html, { waitUntil: "networkidle0" });
        // Generate the PDF with desired options.
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
