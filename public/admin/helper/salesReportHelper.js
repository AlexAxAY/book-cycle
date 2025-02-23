document.addEventListener("DOMContentLoaded", () => {
  const filterSelect = document.querySelector(".form-select");
  const fromDateInput = document.getElementById("fromDate");
  const toDateInput = document.getElementById("toDate");
  const clearFiltersBtn = document.getElementById("clearFilters");
  const tableBody = document.querySelector("table tbody");

  // Get DOM elements for aggregate metrics.
  const totalRevenueEl = document.getElementById("totalRevenue");
  const totalDiscountEl = document.getElementById("totalDiscount");
  const totalRefundEl = document.getElementById("totalRefund");
  const totalOrdersEl = document.getElementById("totalOrders");

  async function fetchOrders() {
    const filter = filterSelect.value;
    const fromDate = fromDateInput.value;
    const toDate = toDateInput.value;

    try {
      const response = await axios.get("/admin/sales-report", {
        params: { filter, fromDate, toDate },
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });

      // Update the orders table.
      const orders = response.data.orders;
      tableBody.innerHTML = "";
      orders.forEach((order) => {
        const formattedDate = moment(order.createdAt).format("DD/MM/YY");
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${order._id}</td>
            <td>${formattedDate}</td>
            <td>${order.user_id.name}</td>
            <td>${order.order_items.length}</td>
            <td>₹${order.final_amount}</td>
            <td>${order.payment_type}</td>
            <td>${order.status}</td>
          `;
        tableBody.appendChild(row);
      });

      // Update aggregate metrics.
      if (totalRevenueEl) {
        totalRevenueEl.textContent = "₹" + response.data.totalRevenue;
      }
      if (totalDiscountEl) {
        totalDiscountEl.textContent = "₹" + response.data.totalDiscount;
      }
      if (totalRefundEl) {
        totalRefundEl.textContent = "₹" + response.data.totalRefund;
      }
      if (totalOrdersEl) {
        totalOrdersEl.textContent = response.data.totalOrders;
      }
    } catch (error) {
      console.error("Error fetching filtered orders:", error);
    }
  }

  // Trigger fetching orders on filter or date input change.
  filterSelect.addEventListener("change", fetchOrders);
  fromDateInput.addEventListener("change", fetchOrders);
  toDateInput.addEventListener("change", fetchOrders);

  // Clear filters and refresh the table.
  clearFiltersBtn.addEventListener("click", () => {
    filterSelect.selectedIndex = 0;
    fromDateInput.value = "";
    toDateInput.value = "";
    fetchOrders();
  });
});
