document.addEventListener("DOMContentLoaded", () => {
  const sortRadios = document.getElementsByName("sortOrder");
  const dateFilter = document.getElementById("dateFilter");
  const clearFilterButton = document.getElementById("clearFilter");
  const filterBtn = document.getElementById("toggleFilters");
  const filterSec = document.getElementById("filterControls");

  const fetchTransactions = async () => {
    // Determine the selected sort order
    let sortOrder;
    sortRadios.forEach((radio) => {
      if (radio.checked) {
        sortOrder = radio.value;
      }
    });
    const dateValue = dateFilter.value;
    let query = `?sortOrder=${sortOrder}`;
    if (dateValue) {
      query += `&date=${dateValue}`;
    }

    try {
      const response = await axios.get(`/user/wallet${query}`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      const transactions = response.data.transactions;
      updateTransactionsTable(transactions);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  const updateTransactionsTable = (transactions) => {
    const tableBody = document.querySelector("#transactionsTable tbody");
    if (!tableBody) {
      console.error(
        "Table body not found. Ensure your HTML includes a <tbody> element inside the element with ID 'transactionsTable'."
      );
      return;
    }
    tableBody.innerHTML = "";

    // If a date filter is selected and no transactions returned, show message
    if (transactions.length === 0 && dateFilter.value) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="5" class="text-center">No transactions during this date</td>`;
      tableBody.appendChild(tr);
    } else {
      transactions.forEach((transaction, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${new Date(transaction.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}</td>
            <td>${new Date(transaction.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}</td>
            <td>${transaction.type}</td>
            <td>₹${transaction.amount}</td>
            <td>${transaction.description || ""}</td>
          `;
        tableBody.appendChild(tr);
      });
    }
  };

  // Listen for changes on the radio buttons and date input
  sortRadios.forEach((radio) => {
    radio.addEventListener("change", fetchTransactions);
  });

  dateFilter.addEventListener("change", fetchTransactions);

  // Clear filter event listener
  clearFilterButton.addEventListener("click", () => {
    // Reset sort order to default: descending order
    document.querySelector(
      'input[name="sortOrder"][value="desc"]'
    ).checked = true;
    // Clear date input
    dateFilter.value = "";
    fetchTransactions();
  });

  filterBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (filterSec.classList.contains("d-none")) {
      filterSec.classList.remove("d-none");
    } else {
      filterSec.classList.add("d-none");
    }
  });
});
