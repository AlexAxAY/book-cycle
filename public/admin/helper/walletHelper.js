document.addEventListener("DOMContentLoaded", () => {
  const sortSelect = document.querySelector("select.form-select");
  const fromDateInput = document.getElementById("fromDate");
  const toDateInput = document.getElementById("toDate");
  const clearFiltersBtn = document.getElementById("clearFilters");
  const tableBody = document.querySelector("table tbody");

  const errorAlert = document.querySelector(".alert-bad");

  // Function to show error alert
  function showError(message) {
    errorAlert.textContent = message;
    errorAlert.classList.remove("d-none");
    setTimeout(() => errorAlert.classList.add("d-none"), 3000);
  }

  // Function to fetch and render transactions using Axios
  async function fetchTransactions() {
    const sort = sortSelect.value;
    const fromDate = fromDateInput.value;
    const toDate = toDateInput.value;

    const queryParams = new URLSearchParams();
    if (sort && sort !== "Sort") queryParams.append("sort", sort);
    if (fromDate) queryParams.append("fromDate", fromDate);
    if (toDate) queryParams.append("toDate", toDate);

    try {
      const response = await axios.get(
        `/admin/wallet?${queryParams.toString()}`,
        {
          headers: { "X-Requested-With": "XMLHttpRequest" },
        }
      );
      const { transactions } = response.data;
      renderTable(transactions);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      showError("Error fetching transactions!");
    }
  }

  // Function to render table rows
  function renderTable(transactions) {
    tableBody.innerHTML = "";
    if (!transactions.length) {
      tableBody.innerHTML = `<tr>
            <td colspan="7" class="text-center">No transactions</td>
          </tr>`;
      return;
    }

    transactions.forEach((transaction) => {
      const tr = document.createElement("tr");

      // Id
      const tdId = document.createElement("td");
      tdId.innerHTML = `<small><strong>${transaction.custom_wallet_id}</strong></small>`;
      tr.appendChild(tdId);

      // User
      const tdUser = document.createElement("td");
      tdUser.textContent = transaction.wallet.user.name;
      tr.appendChild(tdUser);

      // Date
      const tdDate = document.createElement("td");
      tdDate.innerHTML = `<small><strong>${moment(transaction.createdAt).format(
        "DD/MM/YY"
      )}</strong></small>`;
      tr.appendChild(tdDate);

      // Time
      const tdTime = document.createElement("td");
      tdTime.textContent = moment(transaction.createdAt).format("hh:mm A");
      tr.appendChild(tdTime);

      // Type
      const tdType = document.createElement("td");
      tdType.innerHTML = `<small><strong>${transaction.type}</strong></small>`;
      tr.appendChild(tdType);

      // Amount
      const tdAmount = document.createElement("td");
      tdAmount.textContent = `₹ ${transaction.amount}`;
      tr.appendChild(tdAmount);

      // Description
      const tdDescription = document.createElement("td");
      tdDescription.innerHTML = `<small><strong>${
        transaction.description || ""
      }</strong></small>`;
      tr.appendChild(tdDescription);

      tableBody.appendChild(tr);
    });
  }

  // Event listeners for filter inputs
  sortSelect.addEventListener("change", fetchTransactions);
  fromDateInput.addEventListener("change", fetchTransactions);
  toDateInput.addEventListener("change", fetchTransactions);

  // Clear button resets filters and fetches all data
  clearFiltersBtn.addEventListener("click", () => {
    sortSelect.selectedIndex = 0;
    fromDateInput.value = "";
    toDateInput.value = "";
    fetchTransactions();
  });
});
