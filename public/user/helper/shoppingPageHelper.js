document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("filter-btn").addEventListener("click", function () {
    document.getElementById("filter-section").classList.toggle("d-none");
  });

  const searchForm = document.querySelector('form[role="search"]');
  if (searchForm) {
    searchForm.addEventListener("submit", handleSearch);
  }

  // Filter Handler
  const applyFiltersBtn = document.getElementById("apply-filters");
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", handleFilters);
  }

  // Clear Filters Handler
  const clearFiltersBtn = document.getElementById("clear_filters");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", handleClearFilters);
  }

  // Event delegation for product click events
  document.querySelector(".product-grid").addEventListener("click", (e) => {
    if (e.target.closest(".to-product")) {
      const button = e.target.closest(".to-product");
      const id = button.getAttribute("data-id-info");
      window.location.href = `/user/shop/product/${id}`;
    }
  });

  // On the shopping page only, attach a delegated add-to-cart handler.
  // (On home and single product pages, your separate add-to-cart helper file handles this.)
  if (window.location.pathname.includes("/user/shop")) {
    document.querySelector(".row.mt-4").addEventListener("click", async (e) => {
      const btn = e.target.closest(".add-to-cart-btn");
      if (!btn) return;

      const productId = btn.dataset.productId;
      console.log(productId);

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

// Search Handler
async function handleSearch(e) {
  e.preventDefault();
  const searchInput = e.target.querySelector('input[type="search"]');
  try {
    const response = await axios.get("/user/shop", {
      params: { search: searchInput.value.trim() },
    });
    updateProducts(response.data.products);
  } catch (error) {
    console.error("Search error:", error);
  }
}

// Filter Handler
async function handleFilters() {
  const minPriceValue = document.getElementById("min-price").value;
  const maxPriceValue = document.getElementById("max-price").value;
  const ratingValueStr = document.getElementById("rating").value; // Get rating input as string

  const minPrice = parseFloat(minPriceValue);
  const maxPrice = parseFloat(maxPriceValue);

  // Validate that the price values are not negative
  if (minPriceValue.trim() !== "" && !isNaN(minPrice) && minPrice < 0) {
    const alertBox = document.querySelector(".alert-bad");
    alertBox.classList.remove("d-none");
    alertBox.textContent = "Minimum price cannot be negative.";
    setTimeout(() => {
      alertBox.classList.add("d-none");
    }, 2000);
    return;
  }
  if (maxPriceValue.trim() !== "" && !isNaN(maxPrice) && maxPrice < 0) {
    const alertBox = document.querySelector(".alert-bad");
    alertBox.classList.remove("d-none");
    alertBox.textContent = "Maximum price cannot be negative.";
    setTimeout(() => {
      alertBox.classList.add("d-none");
    }, 2000);
    return;
  }

  // Validate rating if provided
  let ratingNum;
  if (ratingValueStr.trim() !== "") {
    ratingNum = Number(ratingValueStr.trim());
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      const alertBox = document.querySelector(".alert-bad");
      alertBox.classList.remove("d-none");
      alertBox.textContent = "Rating must be between 1 and 5.";
      setTimeout(() => {
        alertBox.classList.add("d-none");
      }, 2000);
      return;
    }
  }

  // Build the filters object
  const filters = {
    category: document.getElementById("category").value,
  };

  // Include rating in filters if provided and valid
  if (ratingValueStr.trim() !== "") {
    filters.rating = ratingNum;
  }

  // Include search query if present
  const searchInput = document.querySelector('input[type="search"]');
  if (searchInput && searchInput.value.trim() !== "") {
    filters.search = searchInput.value.trim();
  }

  if (minPriceValue.trim() !== "" && !isNaN(minPrice)) {
    filters.minPrice = minPrice;
  }
  if (maxPriceValue.trim() !== "" && !isNaN(maxPrice)) {
    filters.maxPrice = maxPrice;
  }

  if (
    filters.minPrice !== undefined &&
    filters.maxPrice !== undefined &&
    filters.minPrice > filters.maxPrice
  ) {
    const alertBox = document.querySelector(".alert-bad");
    alertBox.classList.remove("d-none");
    alertBox.textContent = "Minimum price cannot be greater than maximum price";
    setTimeout(() => {
      alertBox.classList.add("d-none");
    }, 2000);
    return;
  }

  const sortRadio = document.querySelector('input[name="sort"]:checked');
  if (sortRadio) {
    filters.sort = sortRadio.value;
  }

  try {
    const response = await axios.get("/user/shop", {
      params: filters,
    });
    updateProducts(response.data.products);
  } catch (error) {
    console.error("Filter error:", error);
  }
}

// Clear Filters Handler
async function handleClearFilters() {
  // Reset filter input fields to default values
  document.getElementById("min-price").value = "";
  document.getElementById("max-price").value = "";
  document.getElementById("category").value = "";
  document.getElementById("rating").value = "";

  // Clear sort radio buttons
  const sortRadios = document.querySelectorAll('input[name="sort"]');
  sortRadios.forEach((radio) => (radio.checked = false));

  // Clear search input if needed
  const searchInput = document.querySelector('input[type="search"]');
  if (searchInput) {
    searchInput.value = "";
  }

  // Fetch all products (clearing any applied filters)
  try {
    const response = await axios.get("/user/shop");
    updateProducts(response.data.products);
  } catch (error) {
    console.error("Error clearing filters:", error);
  }
}

// Update products grid
function updateProducts(products) {
  const productsGrid = document.querySelector(".row.mt-4");
  if (!productsGrid) {
    console.error("Products grid not found!");
    return;
  }

  productsGrid.innerHTML = "";

  products.forEach((product) => {
    const productHtml = `
        <div class="col-12 col-sm-6 col-md-3 col-lg-3 col-xl-2 mb-4">
          <div class="card">
            <div id="carousel${
              product._id
            }" class="carousel slide to-product" data-bs-ride="carousel" data-id-info="${
      product._id
    }">
              <div class="carousel-inner">
                ${product.images
                  .map(
                    (img, index) => `
                  <div class="carousel-item ${index === 0 ? "active" : ""}">
                    <img src="${
                      img.original_url
                    }" class="d-block w-100" alt="Book Image"
                      style="max-height: 300px; min-height: 300px; border-radius: 10px; object-fit: cover !important;">
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
                <small class="text-success">
                  (${product.discount} ${
      product.discount_type === "fixed" ? "₹" : "%"
    } off)
                </small>
              </p>
              <p class="card-text p-0 m-0">
                <small>${product.avg_rating || "Awaiting Review"}</small>
              </p>
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

// Get stock color
function getStockColor(stock) {
  const colors = {
    "In stock": "green",
    "Limited stock": "#fb8500",
    "Out of stock": "red",
  };
  return colors[stock] || "black";
}

// Show alert function
function showAlert(element, message, type) {
  element.textContent = message;
  element.classList.remove("d-none");
  setTimeout(() => {
    element.classList.add("d-none");
  }, 2000);
}
