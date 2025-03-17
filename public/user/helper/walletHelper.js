document.addEventListener("DOMContentLoaded", () => {
  const sortRadios = document.getElementsByName("sortOrder");
  const dateFilter = document.getElementById("dateFilter");
  const clearFilterButton = document.getElementById("clearFilter");
  const filterBtn = document.getElementById("toggleFilters");
  const filterSec = document.getElementById("filterControls");

  const fetchTransactions = async (page = 1) => {
    let sortOrder;
    sortRadios.forEach((radio) => {
      if (radio.checked) {
        sortOrder = radio.value;
      }
    });

    const dateValue = dateFilter.value;
    let query = `?sortOrder=${sortOrder}&page=${page}&limit=30`;
    if (dateValue) {
      query += `&date=${dateValue}`;
    }

    try {
      const response = await axios.get(`/user/wallet${query}`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      const { transactions, totalPages, currentPage } = response.data;

      updateTransactionsTable(transactions);
      updatePaginationControls(totalPages, currentPage);
    } catch (err) {
      alert("An error occured!");
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

    if (transactions.length === 0 && dateFilter.value) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="5" class="text-center">No transactions during this date</td>`;
      tableBody.appendChild(tr);
    } else {
      transactions.forEach((transaction) => {
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
            <td>₹${transaction.amount.toFixed(2)}</td>
            <td>${transaction.description || ""}</td>
          `;
        tableBody.appendChild(tr);
      });
    }
  };

  sortRadios.forEach((radio) => {
    radio.addEventListener("change", () => fetchTransactions());
  });

  dateFilter.addEventListener("change", () => fetchTransactions());

  clearFilterButton.addEventListener("click", () => {
    document.querySelector(
      'input[name="sortOrder"][value="desc"]'
    ).checked = true;

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

  fetchTransactions();
});

const updatePaginationControls = (totalPages, currentPage) => {
  const prevButton = document.getElementById("prevPage");
  const nextButton = document.getElementById("nextPage");
  const currentPageDisplay = document.getElementById("currentPage");

  currentPageDisplay.textContent = `Page ${currentPage} of ${totalPages}`;

  prevButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= totalPages;

  prevButton.onclick = () => fetchTransactions(currentPage - 1);
  nextButton.onclick = () => fetchTransactions(currentPage + 1);
};
