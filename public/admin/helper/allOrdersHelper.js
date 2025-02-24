document.addEventListener("DOMContentLoaded", function () {
  // Get filter elements
  const timePeriodSelect = document.querySelector(
    'select[aria-label="Filter by time period"]'
  );
  const fromDateInput = document.getElementById("fromDate");
  const toDateInput = document.getElementById("toDate");
  const clearFiltersButton = document.getElementById("clearFilters");
  const tableBody = document.querySelector("table tbody");

  // On page load, reset filters (if any values are preserved)
  timePeriodSelect.selectedIndex = 0;
  fromDateInput.value = "";
  toDateInput.value = "";

  // Helper function to update the table with offers
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

        // Create a table row for each offer.
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

  // Function to fetch filtered offers only if a filter is applied
  async function fetchFilteredOffers() {
    const filterPeriod = timePeriodSelect.value;
    const fromDate = fromDateInput.value;
    const toDate = toDateInput.value;

    // Only apply AJAX filtering if at least one filter value is present.
    if (!filterPeriod && !fromDate && !toDate) {
      return; // Do nothing—full offers remain as rendered.
    }

    try {
      const response = await axios.get("/admin/offers", {
        params: { ajax: true, filterPeriod, fromDate, toDate },
      });
      renderOffers(response.data.offers);
    } catch (error) {
      console.error("Error fetching filtered offers:", error);
    }
  }

  // Event listeners for filters: when the user selects a filter, fetch the filtered offers.
  timePeriodSelect.addEventListener("change", fetchFilteredOffers);
  fromDateInput.addEventListener("change", fetchFilteredOffers);
  toDateInput.addEventListener("change", fetchFilteredOffers);

  // Clear filters button resets the inputs and refetches full offers.
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
        console.error("Error fetching full offers:", error);
      });
  });
});
