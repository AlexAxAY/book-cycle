document.addEventListener("DOMContentLoaded", () => {
  const filterSelect = document.querySelector(".form-select");
  const fromDateInput = document.getElementById("fromDate");
  const toDateInput = document.getElementById("toDate");
  const clearFiltersBtn = document.getElementById("clearFilters");
  const tableBody = document.querySelector("table tbody");

  const totalRevenueEl = document.getElementById("totalRevenue");
  const totalDiscountEl = document.getElementById("totalDiscount");
  const totalRefundEl = document.getElementById("totalRefund");
  const totalOrdersEl = document.getElementById("totalOrders");

  async function fetchOrders() {
    const filter = filterSelect.value;
    const fromDate = fromDateInput.value;
    const toDate = toDateInput.value;

    const downloadPDFButton = document.getElementById("downloadPDF");
    const downloadExcelButton = document.getElementById("downloadExcel");

    const params = new URLSearchParams({ filter, fromDate, toDate });
    downloadPDFButton.href = `/admin/sales-report/pdf-download?${params.toString()}`;
    downloadExcelButton.href = `/admin/sales-report/excel-download?${params.toString()}`;

    try {
      const response = await axios.get("/admin/sales-report", {
        params: { filter, fromDate, toDate },
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });

      const orders = response.data.orders;
      tableBody.innerHTML = "";
      if (orders.length > 0) {
        orders.forEach((order) => {
          const formattedDate = moment(order.createdAt).format("DD/MM/YY");
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${order.custom_order_id}</td>
            <td>${formattedDate}</td>
            <td>${order.user_id.name}</td>
            <td>${order.order_items.length}</td>
            <td>₹${order.final_amount}</td>
            <td>${order.payment_type}</td>
            <td>${order.status}</td>
          `;
          tableBody.appendChild(row);
        });
      } else {
        const noDataRow = document.createElement("tr");
        noDataRow.innerHTML = `<td colspan="7" class="text-center">No details available</td>`;
        tableBody.appendChild(noDataRow);
      }

      if (totalRevenueEl) {
        totalRevenueEl.textContent =
          "₹" + response.data.totalRevenue.toFixed(2);
      }
      if (totalDiscountEl) {
        totalDiscountEl.textContent =
          "₹" + response.data.totalDiscount.toFixed(2);
      }
      if (totalRefundEl) {
        totalRefundEl.textContent = "₹" + response.data.totalRefund.toFixed(2);
      }
      if (totalOrdersEl) {
        totalOrdersEl.textContent = response.data.totalOrders;
      }
    } catch (error) {
      alert("Error!");
    }
  }

  filterSelect.addEventListener("change", fetchOrders);
  fromDateInput.addEventListener("change", fetchOrders);
  toDateInput.addEventListener("change", fetchOrders);

  clearFiltersBtn.addEventListener("click", () => {
    filterSelect.selectedIndex = 0;
    fromDateInput.value = "";
    toDateInput.value = "";
    fetchOrders();
  });
});
