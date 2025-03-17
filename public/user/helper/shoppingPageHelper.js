let currentParams = {};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("filter-btn").addEventListener("click", () => {
    document.getElementById("filter-section").classList.toggle("d-none");
  });

  const searchForm = document.querySelector('form[role="search"]');
  if (searchForm) {
    searchForm.addEventListener("submit", handleSearch);
  }

  const applyFiltersBtn = document.getElementById("apply-filters");
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", handleFilters);
  }

  const clearFiltersBtn = document.getElementById("clear_filters");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", handleClearFilters);
  }

  document.querySelector(".product-grid").addEventListener("click", (e) => {
    const productCard = e.target.closest(".to-product");
    if (productCard) {
      const id = productCard.getAttribute("data-id-info");
      window.location.href = `/user/shop/product/${id}`;
    }
  });

  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("pagination-link")) {
      e.preventDefault();
      const newPage = Number(e.target.getAttribute("data-page"));
      if (!isNaN(newPage) && newPage >= 1) {
        changePage(newPage);
      }
    }
  });

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

async function handleSearch(e) {
  e.preventDefault();
  const searchInput = e.target.querySelector('input[type="search"]');
  if (searchInput && searchInput.value.trim() !== "") {
    currentParams.search = searchInput.value.trim();
  } else {
    delete currentParams.search;
  }

  currentParams.page = 1;
  fetchProducts();
}

async function handleFilters() {
  const minPriceValue = document.getElementById("min-price").value;
  const maxPriceValue = document.getElementById("max-price").value;
  const ratingValueStr = document.getElementById("rating").value;
  const category = document.getElementById("category").value;

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

  let ratingNum;
  if (ratingValueStr.trim() !== "") {
    ratingNum = Number(ratingValueStr.trim());
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      showTemporaryAlert("Rating must be between 1 and 5.");
      return;
    }
  }

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

  const sortRadio = document.querySelector('input[name="sort"]:checked');
  if (sortRadio) {
    currentParams.sort = sortRadio.value;
  } else {
    delete currentParams.sort;
  }

  currentParams.page = 1;
  fetchProducts();
}

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

  currentParams = { page: 1 };
  fetchProducts();
}

function changePage(newPage) {
  currentParams.page = newPage;
  fetchProducts();
}

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

function showTemporaryAlert(message) {
  const alertBox = document.querySelector(".alert-bad");
  alertBox.classList.remove("d-none");
  alertBox.textContent = message;
  setTimeout(() => {
    alertBox.classList.add("d-none");
  }, 2000);
}

function getStockColor(stock) {
  const colors = {
    "In stock": "green",
    "Limited stock": "#fb8500",
    "Out of stock": "red",
  };
  return colors[stock] || "black";
}

function showAlert(element, message, type) {
  element.textContent = message;
  element.classList.remove("d-none");
  setTimeout(() => {
    element.classList.add("d-none");
  }, 2000);
}
