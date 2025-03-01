document.addEventListener("DOMContentLoaded", function () {
  // Attach change event to the filter select element
  const filterSelect = document.getElementById("filter");
  const filterForm = document.getElementById("filterForm");
  if (filterSelect && filterForm) {
    filterSelect.addEventListener("change", function () {
      filterForm.submit();
    });
  }

  // Retrieve chart data from the canvas data attribute
  const canvasEl = document.getElementById("salesChart");
  const chartDataAttr = canvasEl.getAttribute("data-chart");
  const chartData = JSON.parse(chartDataAttr);

  const labels = chartData.map((data) => data.label);
  const netRevenueData = chartData.map((data) => data.netRevenue);
  const discountData = chartData.map((data) => data.discount);
  const refundData = chartData.map((data) => data.refundAmount);
  const ordersCountData = chartData.map((data) => data.ordersCount);

  const ctx = canvasEl.getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Net Revenue",
          data: netRevenueData,
          backgroundColor: "#1a472a",
          borderColor: "#006400",
          borderWidth: 0.5,
          pointBackgroundColor: "#006400",
          pointRadius: 2,
          tension: 0,
        },
        {
          label: "Total Discount",
          data: discountData,
          backgroundColor: "#b22222",
          borderColor: "#8b0000",
          borderWidth: 0.5,
          pointBackgroundColor: "#8b0000",
          pointRadius: 2,
          tension: 0,
        },
        {
          label: "Total Refunds",
          data: refundData,
          backgroundColor: "#003366",
          borderColor: "#00008b",
          borderWidth: 0.5,
          pointBackgroundColor: "#00008b",
          pointRadius: 2,
          tension: 0,
        },
        {
          label: "Total Orders",
          data: ordersCountData,
          backgroundColor: "#ffff00",
          borderColor: "#9b870c",
          borderWidth: 0.5,
          pointBackgroundColor: "#9b870c",
          pointRadius: 2,
          tension: 0,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
});
