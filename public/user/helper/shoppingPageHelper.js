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
  const filters = {
    category: document.getElementById("category").value,
    minPrice: document.getElementById("min-price").value,
    maxPrice: document.getElementById("max-price").value,
    rating: document.getElementById("rating").value,
  };

  // Validate filters (optional)
  if (
    filters.minPrice &&
    filters.maxPrice &&
    filters.minPrice > filters.maxPrice
  ) {
    alert("Minimum price cannot be greater than maximum price.");
    return;
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

// Update products grid
function updateProducts(products) {
  const productsGrid = document.querySelector(".row.mt-4");
  if (!productsGrid) {
    console.error("Products grid not found!");
    return;
  }

  productsGrid.innerHTML = ""; // Clear current products

  products.forEach((product) => {
    const productHtml = `
      <div class="col-12 col-sm-6 col-md-3 col-lg-3 col-xl-2 mb-4">
        <div class="card">
          <div id="carousel${
            product._id
          }" class="carousel slide" data-bs-ride="carousel">
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
    }) off
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
            <a href="/product/${
              product._id
            }" class="btn btn-dark btn-sm">Add to cart</a>
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
