document.addEventListener("DOMContentLoaded", function () {
  const timePeriodSelect = document.querySelector(
    'select[aria-label="Filter by time period"]'
  );
  const fromDateInput = document.getElementById("fromDate");
  const toDateInput = document.getElementById("toDate");
  const clearFiltersButton = document.getElementById("clearFilters");
  const tableBody = document.querySelector("table tbody");

  timePeriodSelect.selectedIndex = 0;
  fromDateInput.value = "";
  toDateInput.value = "";

  function renderOffers(offers) {
    tableBody.innerHTML = "";
    if (offers.length > 0) {
      offers.forEach((offer) => {
        let appliedTo = "";
        if (offer.product) {
          appliedTo = offer.product.name;
        } else if (offer.category) {
          appliedTo = offer.category.category || offer.category;
        } else if (offer.allProducts) {
          appliedTo = "All products";
        } else if (offer.allCategories) {
          appliedTo = "All categories";
        }

        const row = document.createElement("tr");
        row.innerHTML = `
              <td>${moment(offer.createdAt).format("DD/MM/YY")}</td>
              <td>${offer.discountType === "percentage" ? "%" : "₹"}</td>
              <td>${offer.discountValue}</td>
              <td>${appliedTo}</td>
            `;
        tableBody.appendChild(row);
      });
    } else {
      tableBody.innerHTML = `<tr><td colspan="4">No offer details</td></tr>`;
    }
  }

  async function fetchFilteredOffers() {
    const filterPeriod = timePeriodSelect.value;
    const fromDate = fromDateInput.value;
    const toDate = toDateInput.value;

    if (!filterPeriod && !fromDate && !toDate) {
      return;
    }

    try {
      const response = await axios.get("/admin/offers", {
        params: { ajax: true, filterPeriod, fromDate, toDate },
      });
      renderOffers(response.data.offers);
    } catch (error) {
      alert("Error");
    }
  }

  timePeriodSelect.addEventListener("change", fetchFilteredOffers);
  fromDateInput.addEventListener("change", fetchFilteredOffers);
  toDateInput.addEventListener("change", fetchFilteredOffers);

  clearFiltersButton.addEventListener("click", function () {
    timePeriodSelect.selectedIndex = 0;
    fromDateInput.value = "";
    toDateInput.value = "";

    axios
      .get("/admin/offers", { params: { ajax: true } })
      .then((response) => {
        renderOffers(response.data.offers);
      })
      .catch((error) => {
        alert("Error");
      });
  });
});
