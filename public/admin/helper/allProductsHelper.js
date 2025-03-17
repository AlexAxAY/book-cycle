let currentParams = {};

function initCurrentParams() {
  const params = new URLSearchParams(window.location.search);
  params.forEach((value, key) => {
    currentParams[key] = value;
  });
}
initCurrentParams();

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("filter-btn").addEventListener("click", () => {
    document.getElementById("filter-options").classList.toggle("d-none");
  });

  document
    .getElementById("search-form")
    .addEventListener("submit", handleSearch);
  document
    .getElementById("apply-filters")
    .addEventListener("click", handleFilters);
  document
    .getElementById("clear-btn")
    .addEventListener("click", handleClearFilters);
});

async function handleSearch(e) {
  e.preventDefault();
  const searchInput = e.target.querySelector('input[name="search"]');
  const searchValue = searchInput.value.trim();
  if (searchValue) {
    currentParams.search = searchValue;
  } else {
    delete currentParams.search;
  }

  currentParams.page = 1;
  updatePage();
}

async function handleFilters(e) {
  e.preventDefault();
  const date = document.getElementById("date").value;
  const minPrice = document.getElementById("min-price").value;
  const maxPrice = document.getElementById("max-price").value;
  const discount = document.getElementById("discount").value;
  const rating = document.getElementById("rating").value;
  const used = document.getElementById("used").value;
  const category = document.getElementById("category").value;

  if (date) currentParams.date = date;
  else delete currentParams.date;

  if (minPrice) currentParams["min-price"] = minPrice;
  else delete currentParams["min-price"];

  if (maxPrice) currentParams["max-price"] = maxPrice;
  else delete currentParams["max-price"];

  if (discount) currentParams.discount = discount;
  else delete currentParams.discount;

  if (rating) currentParams.rating = rating;
  else delete currentParams.rating;

  if (used) currentParams.used = used;
  else delete currentParams.used;

  if (category) currentParams.category = category;
  else delete currentParams.category;

  currentParams.page = 1;
  updatePage();
}

async function handleClearFilters(e) {
  e.preventDefault();
  document.getElementById("date").value = "";
  document.getElementById("min-price").value = "";
  document.getElementById("max-price").value = "";
  document.getElementById("discount").value = "";
  document.getElementById("rating").value = "";
  document.getElementById("used").value = "";
  document.getElementById("category").value = "";
  document.querySelector('input[name="search"]').value = "";

  currentParams = { page: 1 };
  updatePage();
}

function updatePage() {
  const queryString = new URLSearchParams(currentParams).toString();
  window.location.href = `/admin/products?${queryString}`;
}
