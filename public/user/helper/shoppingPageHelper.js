// Global object to maintain current query parameters (filters, sort, search, page)
let currentParams = {};

// Initialize event listeners after DOM load
document.addEventListener("DOMContentLoaded", () => {
  // Toggle filter section visibility
  document.getElementById("filter-btn").addEventListener("click", () => {
    document.getElementById("filter-section").classList.toggle("d-none");
  });

  // Search handler on form submit
  const searchForm = document.querySelector('form[role="search"]');
  if (searchForm) {
    searchForm.addEventListener("submit", handleSearch);
  }

  // Filter handler
  const applyFiltersBtn = document.getElementById("apply-filters");
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", handleFilters);
  }

  // Clear filters handler
  const clearFiltersBtn = document.getElementById("clear_filters");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", handleClearFilters);
  }

  // Delegated event listener for product card clicks (navigating to product detail)
  document.querySelector(".product-grid").addEventListener("click", (e) => {
    const productCard = e.target.closest(".to-product");
    if (productCard) {
      const id = productCard.getAttribute("data-id-info");
      window.location.href = `/user/shop/product/${id}`;
    }
  });

  // Delegated event listener for pagination links (using data attributes)
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("pagination-link")) {
      e.preventDefault();
      const newPage = Number(e.target.getAttribute("data-page"));
      if (!isNaN(newPage) && newPage >= 1) {
        changePage(newPage);
      }
    }
  });

  // Delegated add-to-cart handler on the shopping page
  if (window.location.pathname.includes("/user/shop")) {
    document.querySelector(".row.mt-4").addEventListener("click", async (e) => {
      const btn = e.target.closest(".add-to-cart-btn");
      if (!btn) return;
      const productId = btn.dataset.productId;
      try {
        const response = await axios.post(`/user/cart/${productId}`);
        if (response.data.success) {
          showAlert(
            document.querySelector(".alert-good"),
            response.data.message,
            "good"
          );
        } else {
          showAlert(
            document.querySelector(".alert-bad"),
            response.data.message,
            "bad"
          );
        }
      } catch (error) {
        console.error("Error adding to cart:", error.response || error);
        const status = error.response?.status;
        if (status === 403 || status === 401) {
          const errorMessage =
            error.response?.data?.message ||
            "User not logged in, redirecting...";
          showAlert(document.querySelector(".alert-bad"), errorMessage, "bad");
          setTimeout(() => {
            window.location.href = "/user/login";
          }, 500);
        } else {
          const errorMessage =
            error.response?.data?.message || "Failed to add product to cart";
          showAlert(document.querySelector(".alert-bad"), errorMessage, "bad");
        }
      }
    });
  }
});

// Search Handler: updates global state with search term, preserves other filters
async function handleSearch(e) {
  e.preventDefault();
  const searchInput = e.target.querySelector('input[type="search"]');
  if (searchInput && searchInput.value.trim() !== "") {
    currentParams.search = searchInput.value.trim();
  } else {
    delete currentParams.search;
  }
  // Reset to page 1 when performing a new search
  currentParams.page = 1;
  fetchProducts();
}

// Filter Handler: updates global state with current filter values (merges with existing search/sort)
async function handleFilters() {
  const minPriceValue = document.getElementById("min-price").value;
  const maxPriceValue = document.getElementById("max-price").value;
  const ratingValueStr = document.getElementById("rating").value;
  const category = document.getElementById("category").value;

  // Validate price values
  const minPrice = parseFloat(minPriceValue);
  const maxPrice = parseFloat(maxPriceValue);
  if (minPriceValue.trim() !== "" && !isNaN(minPrice) && minPrice < 0) {
    showTemporaryAlert("Minimum price cannot be negative.");
    return;
  }
  if (maxPriceValue.trim() !== "" && !isNaN(maxPrice) && maxPrice < 0) {
    showTemporaryAlert("Maximum price cannot be negative.");
    return;
  }
  if (
    minPriceValue.trim() !== "" &&
    maxPriceValue.trim() !== "" &&
    !isNaN(minPrice) &&
    !isNaN(maxPrice) &&
    minPrice > maxPrice
  ) {
    showTemporaryAlert("Minimum price cannot be greater than maximum price.");
    return;
  }

  // Validate rating if provided
  let ratingNum;
  if (ratingValueStr.trim() !== "") {
    ratingNum = Number(ratingValueStr.trim());
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      showTemporaryAlert("Rating must be between 1 and 5.");
      return;
    }
  }

  // Update currentParams with filter values
  if (category.trim() !== "") {
    currentParams.category = category;
  } else {
    delete currentParams.category;
  }
  if (ratingValueStr.trim() !== "") {
    currentParams.rating = ratingNum;
  } else {
    delete currentParams.rating;
  }
  if (minPriceValue.trim() !== "") {
    currentParams.minPrice = minPriceValue;
  } else {
    delete currentParams.minPrice;
  }
  if (maxPriceValue.trim() !== "") {
    currentParams.maxPrice = maxPriceValue;
  } else {
    delete currentParams.maxPrice;
  }
  // Update sort if selected
  const sortRadio = document.querySelector('input[name="sort"]:checked');
  if (sortRadio) {
    currentParams.sort = sortRadio.value;
  } else {
    delete currentParams.sort;
  }
  // Reset to page 1 when filters change
  currentParams.page = 1;
  fetchProducts();
}

// Clear Filters Handler: resets global state and input fields
async function handleClearFilters() {
  document.getElementById("min-price").value = "";
  document.getElementById("max-price").value = "";
  document.getElementById("category").value = "";
  document.getElementById("rating").value = "";
  const sortRadios = document.querySelectorAll('input[name="sort"]');
  sortRadios.forEach((radio) => (radio.checked = false));
  const searchInput = document.querySelector('input[type="search"]');
  if (searchInput) {
    searchInput.value = "";
  }
  // Clear global state completely
  currentParams = { page: 1 };
  fetchProducts();
}

// Pagination function: update page in global state and fetch products
function changePage(newPage) {
  currentParams.page = newPage;
  fetchProducts();
}

// Function to send the current query parameters to the server and update products
function fetchProducts() {
  axios
    .get("/user/shop", { params: currentParams })
    .then((response) => {
      updateProducts(response.data.products);
      updatePaginationControls(response.data.currentPage);
    })
    .catch((error) => {
      console.error("Fetch products error:", error);
    });
}

// Function to update the product grid
function updateProducts(products) {
  const productsGrid = document.querySelector(".row.mt-4");
  if (!productsGrid) {
    console.error("Products grid not found!");
    return;
  }
  productsGrid.innerHTML = "";
  products.forEach((product) => {
    let ratingSection;
    if (product.avg_rating) {
      ratingSection = `
        <div class="rating-badge">
          <small>${product.avg_rating}</small>
          <span class="star-icon">★</span>
        </div>
      `;
    } else {
      ratingSection = `<p class="card-text p-0 m-0"><small>Awaiting review</small></p>`;
    }
    const productHtml = `
      <div class="col-12 col-sm-6 col-md-3 col-lg-3 col-xl-2 mb-4">
        <div class="card">
          <div
            id="carousel${product._id}"
            class="carousel slide to-product"
            data-bs-ride="carousel"
            data-id-info="${product._id}"
          >
            <div class="carousel-inner">
              ${product.images
                .map(
                  (img, index) => `
                  <div class="carousel-item ${index === 0 ? "active" : ""}">
                    <img
                      src="${img.original_url}"
                      class="d-block w-100"
                      alt="Product Image"
                      style="max-height: 300px; min-height: 300px; border-radius: 10px; object-fit: cover;"
                    />
                  </div>
                `
                )
                .join("")}
            </div>
          </div>
          <div class="card-body text-center">
            <p class="card-title p-0 m-0"><strong>${product.name}</strong></p>
            <p class="card-text text-primary p-0 m-0">
              ₹${product.final_price}
              <small class="text-success">(${product.discount} ${
      product.discount_type === "fixed" ? "₹" : "%"
    } off)</small>
            </p>
            ${ratingSection}
            <p class="card-text p-0">
              <strong style="color: ${getStockColor(product.stock)}">${
      product.stock
    }</strong>
            </p>
            <button class="btn btn-dark btn-sm add-to-cart-btn" data-product-id="${
              product._id
            }">
              Add to cart
            </button>
          </div>
        </div>
      </div>
    `;
    productsGrid.insertAdjacentHTML("beforeend", productHtml);
  });
}

// Function to update pagination controls (adjusts the "Previous" and "Next" links)
function updatePaginationControls(currentPage) {
  const prevLink = document.querySelector(
    ".pagination-link[data-page]:first-of-type"
  );
  const nextLink = document.querySelector(
    ".pagination-link[data-page]:last-of-type"
  );
  if (prevLink) {
    prevLink.setAttribute("data-page", currentPage - 1);
    prevLink.parentElement.classList.toggle("disabled", currentPage <= 1);
  }
  if (nextLink) {
    nextLink.setAttribute("data-page", currentPage + 1);
  }
}

// Helper to show temporary alerts for validation errors
function showTemporaryAlert(message) {
  const alertBox = document.querySelector(".alert-bad");
  alertBox.classList.remove("d-none");
  alertBox.textContent = message;
  setTimeout(() => {
    alertBox.classList.add("d-none");
  }, 2000);
}

// Helper to determine stock color based on stock status
function getStockColor(stock) {
  const colors = {
    "In stock": "green",
    "Limited stock": "#fb8500",
    "Out of stock": "red",
  };
  return colors[stock] || "black";
}

// Helper to show alerts (for success or error messages)
function showAlert(element, message, type) {
  element.textContent = message;
  element.classList.remove("d-none");
  setTimeout(() => {
    element.classList.add("d-none");
  }, 2000);
}
