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

  // Event delegation for product click events
  document.querySelector(".product-grid").addEventListener("click", (e) => {
    if (e.target.closest(".to-product")) {
      const button = e.target.closest(".to-product");
      const id = button.getAttribute("data-id-info");
      // Make sure to use backticks to create the URL string
      window.location.href = `/user/shop/product/${id}`;
    }
  });
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
  // Get the raw string values from the input fields
  const minPriceValue = document.getElementById("min-price").value;
  const maxPriceValue = document.getElementById("max-price").value;

  // Parse the values
  const minPrice = parseFloat(minPriceValue);
  const maxPrice = parseFloat(maxPriceValue);

  // Build the filters object
  const filters = {
    category: document.getElementById("category").value,
    rating: document.getElementById("rating").value,
  };

  // Only add minPrice if the field is not empty and the parsed value is valid
  if (minPriceValue.trim() !== "" && !isNaN(minPrice)) {
    filters.minPrice = minPrice;
  }
  // Only add maxPrice if the field is not empty and the parsed value is valid
  if (maxPriceValue.trim() !== "" && !isNaN(maxPrice)) {
    filters.maxPrice = maxPrice;
  }

  // Validate: If both prices are provided, ensure minPrice is not greater than maxPrice
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

  // Get the selected sort option from the radio buttons
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
