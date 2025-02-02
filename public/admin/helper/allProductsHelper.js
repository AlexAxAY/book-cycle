// Toggle filter options when clicking the filter button
document.getElementById("filter-btn").addEventListener("click", () => {
  const filters = document.getElementById("filter-options");
  filters.classList.toggle("d-none");
});

// ---- Input Validation ----

// Get references for the new price inputs and the other filters
const minPriceInput = document.getElementById("min-price");
const maxPriceInput = document.getElementById("max-price");
const discountInput = document.getElementById("discount");
const ratingInput = document.getElementById("rating");

// Validate min price
minPriceInput.addEventListener("input", () => {
  // Always non-negative
  if (minPriceInput.value < 0) {
    minPriceInput.classList.add("is-invalid");
  } else {
    minPriceInput.classList.remove("is-invalid");
  }
  // Also check relationship with maxPrice if provided
  validatePriceRange();
});

// Validate max price
maxPriceInput.addEventListener("input", () => {
  // Always non-negative
  if (maxPriceInput.value < 0) {
    maxPriceInput.classList.add("is-invalid");
  } else {
    maxPriceInput.classList.remove("is-invalid");
  }
  // Also check relationship with minPrice if provided
  validatePriceRange();
});

// Function to check that min price is not greater than max price
function validatePriceRange() {
  const minVal = parseFloat(minPriceInput.value);
  const maxVal = parseFloat(maxPriceInput.value);
  // Only validate if both have a value
  if (!isNaN(minVal) && !isNaN(maxVal)) {
    if (minVal > maxVal) {
      minPriceInput.classList.add("is-invalid");
      maxPriceInput.classList.add("is-invalid");
    } else {
      minPriceInput.classList.remove("is-invalid");
      maxPriceInput.classList.remove("is-invalid");
    }
  }
}

// Validate discount (should be between 0 and 100)
discountInput.addEventListener("input", () => {
  const value = parseFloat(discountInput.value);
  if (isNaN(value) || value < 0 || value > 100) {
    discountInput.classList.add("is-invalid");
  } else {
    discountInput.classList.remove("is-invalid");
  }
});

// Validate rating (should be between 0 and 5)
ratingInput.addEventListener("input", () => {
  const value = parseFloat(ratingInput.value);
  if (isNaN(value) || value < 0 || value > 5) {
    ratingInput.classList.add("is-invalid");
  } else {
    ratingInput.classList.remove("is-invalid");
  }
});

// ---- Form Submission Handling ----

// Filter Form Submission
document.getElementById("filterForm").addEventListener("submit", function (e) {
  let isValid = true;

  // Validate min and max price values (if provided)
  const minVal = parseFloat(minPriceInput.value);
  const maxVal = parseFloat(maxPriceInput.value);
  if (minPriceInput.value && minVal < 0) {
    minPriceInput.classList.add("is-invalid");
    isValid = false;
  }
  if (maxPriceInput.value && maxVal < 0) {
    maxPriceInput.classList.add("is-invalid");
    isValid = false;
  }
  if (minPriceInput.value && maxPriceInput.value && minVal > maxVal) {
    minPriceInput.classList.add("is-invalid");
    maxPriceInput.classList.add("is-invalid");
    isValid = false;
  }

  // Validate discount again
  const discVal = parseFloat(discountInput.value);
  if (discountInput.value && (discVal < 0 || discVal > 100)) {
    discountInput.classList.add("is-invalid");
    isValid = false;
  }

  // Validate rating again
  const rateVal = parseFloat(ratingInput.value);
  if (ratingInput.value && (rateVal < 0 || rateVal > 5)) {
    ratingInput.classList.add("is-invalid");
    isValid = false;
  }

  if (!isValid) {
    // Prevent form submission if any validations fail
    e.preventDefault();
  }
});

// Search Form Submission (for product name search)
// Assumes that the search input has a "name" attribute, e.g., name="search"
document.getElementById("search-form").addEventListener("submit", function (e) {
  // If needed, you could trim the value or check for emptiness.
  // Here we let the form submit normally.
});
