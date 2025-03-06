document.addEventListener("DOMContentLoaded", function () {
  function showTheAlert(type, message) {
    const alertEl =
      type === "error"
        ? document.querySelector(".alert-bad")
        : document.querySelector(".alert-good");
    if (alertEl) {
      alertEl.textContent = message;
      alertEl.classList.remove("d-none");

      setTimeout(() => {
        alertEl.classList.add("d-none");
      }, 3000);
    }
  }

  const filterSelect = document.getElementById("filter");
  const filterForm = document.getElementById("filterForm");
  const modalEl = document.getElementById("customDateModal");
  const modal = new bootstrap.Modal(modalEl);

  const initializeChart = () => {
    const canvasEl = document.getElementById("salesChart");
    if (!canvasEl) return;

    const chartDataAttr = canvasEl.getAttribute("data-chart");
    const chartData = JSON.parse(chartDataAttr);

    const labels = chartData.map((data) => data.label);
    const netRevenueData = chartData.map((data) => data.netRevenue);
    const discountData = chartData.map((data) => data.discount);
    const refundData = chartData.map((data) => data.refundAmount);
    const ordersCountData = chartData.map((data) => data.ordersCount);

    const ctx = canvasEl.getContext("2d");

    if (canvasEl.chart) {
      canvasEl.chart.destroy();
    }

    canvasEl.chart = new Chart(ctx, {
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
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0,0,0,0.05)",
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });
  };

  if (filterSelect && filterForm) {
    filterSelect.addEventListener("change", function (e) {
      if (e.target.value === "custom") {
        e.preventDefault();
        modal.show();
      } else {
        const existingFrom = filterForm.querySelector('input[name="fromDate"]');
        const existingTo = filterForm.querySelector('input[name="toDate"]');
        if (existingFrom) existingFrom.remove();
        if (existingTo) existingTo.remove();
        filterForm.submit();
      }
    });
  }

  document
    .getElementById("applyCustomDate")
    ?.addEventListener("click", function () {
      const fromDate = document.getElementById("fromDate").value;
      const toDate = document.getElementById("toDate").value;

      if (!fromDate || !toDate) {
        showTheAlert("error", "Please select both start and end dates");
        return;
      }

      if (new Date(fromDate) > new Date(toDate)) {
        showTheAlert("error", "End date must be after start date");
        return;
      }

      const existingFrom = filterForm.querySelector('input[name="fromDate"]');
      const existingTo = filterForm.querySelector('input[name="toDate"]');
      if (existingFrom) existingFrom.remove();
      if (existingTo) existingTo.remove();

      const fromInput = document.createElement("input");
      fromInput.type = "hidden";
      fromInput.name = "fromDate";
      fromInput.value = fromDate;

      const toInput = document.createElement("input");
      toInput.type = "hidden";
      toInput.name = "toDate";
      toInput.value = toDate;

      filterForm.appendChild(fromInput);
      filterForm.appendChild(toInput);

      filterSelect.value = "custom";
      modal.hide();
      filterForm.submit();
    });

  initializeChart();

  modalEl.addEventListener("hidden.bs.modal", () => {
    document.getElementById("fromDate").value = "";
    document.getElementById("toDate").value = "";

    if (filterSelect.value === "custom") {
      filterSelect.value = "monthly";
    }
  });
});
