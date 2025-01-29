document.getElementById("filter-btn").addEventListener("click", () => {
  const filters = document.getElementById("filter-options");
  if (filters.classList.contains("d-none")) {
    filters.classList.remove("d-none");
  } else {
    filters.classList.add("d-none");
  }
});

// input validation
const price = document.getElementById("price");
const discount = document.getElementById("discount");
const rating = document.getElementById("rating");

price.addEventListener("input", () => {
  if (price.value < 0) {
    price.classList.add("is-invalid");
  } else {
    price.classList.remove("is-invalid");
  }
});

discount.addEventListener("input", () => {
  if (discount.value < 0 || discount.value > 100) {
    discount.classList.add("is-invalid");
  } else {
    discount.classList.remove("is-invalid");
  }
});

rating.addEventListener("input", () => {
  if (rating.value < 0 || rating.value > 5) {
    rating.classList.add("is-invalid");
  } else {
    rating.classList.remove("is-invalid");
  }
});

// submit validation
document.getElementById("filterForm").addEventListener("submit", function (e) {
  let isValid = true;

  // Price Validation
  const price = document.getElementById("price");
  if (price.value && price.value < 0) {
    price.classList.add("is-invalid");
    isValid = false;
  } else {
    price.classList.remove("is-invalid");
  }

  // Discount Validation
  const discount = document.getElementById("discount");
  if (discount.value && (discount.value < 0 || discount.value > 100)) {
    discount.classList.add("is-invalid");
    isValid = false;
  } else {
    discount.classList.remove("is-invalid");
  }

  // Rating Validation
  const rating = document.getElementById("rating");
  if (rating.value && (rating.value < 0 || rating.value > 5)) {
    rating.classList.add("is-invalid");
    isValid = false;
  } else {
    rating.classList.remove("is-invalid");
  }

  // Prevent form submission if validation fails
  if (!isValid) {
    e.preventDefault();
  }
});
