document.addEventListener("DOMContentLoaded", function () {
  const statusRadios = document.querySelectorAll('input[name="statusFilter"]');
  const yearRadios = document.querySelectorAll('input[name="yearFilter"]');
  const timeRadios = document.querySelectorAll('input[name="timeFilter"]');
  let paginationLinks = document.querySelectorAll(".pagination-link");

  function getFilters() {
    const statusEl = document.querySelector(
      'input[name="statusFilter"]:checked'
    );
    const yearEl = document.querySelector('input[name="yearFilter"]:checked');
    const timeEl = document.querySelector('input[name="timeFilter"]:checked');
    return {
      status: statusEl ? statusEl.value : "",
      year: yearEl ? yearEl.value : "",
      time: timeEl ? timeEl.value : "",
      page: 1,
    };
  }

  async function fetchOrders(filters) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("statusFilter", filters.status);
      if (filters.year) params.append("yearFilter", filters.year);
      if (filters.time) params.append("timeFilter", filters.time);
      if (filters.page) params.append("page", filters.page);
      params.append("ajax", true);

      const response = await axios.get("/user/orders?" + params.toString());
      const data = response.data;
      renderOrders(data.orders);
      renderPagination(data.totalPages, data.currentPage, filters);
    } catch (error) {}
  }

  function renderOrders(orders) {
    const ordersContainer = document.getElementById("orders-container");
    let html = "";
    if (orders.length > 0) {
      orders.forEach((order) => {
        let orderItemsHTML = "";
        order.order_items.forEach((item) => {
          orderItemsHTML += `<p class="m-0">🕮 ${
            item.product.name
          } <small class = "text-muted">(${item.quantity} ${
            item.quantity > 1 ? "books" : "book"
          })</small></p>
`;
        });

        const linkText =
          order.status === "Cancelled" || order.status === "Delivered"
            ? "View order"
            : "Track your order";
        let statusHTML = "";
        if (order.status === "Delivered") {
          statusHTML = `<p class="mb-0 m-3 text-success status"> Delivered <span style="color: green">⬤</span> </p>`;
        } else if (order.status === "Cancelled") {
          statusHTML = `<p class="mb-0 m-3 text-danger status"> Cancelled <span style="color: red">⬤</span> </p>`;
        }

        html += `<div class="order-container row mb-2">
                  <div class="col-auto">
                      <img style="width: 70px" src="${
                        order.order_items[0].product.images[0].cropped_url ||
                        order.order_items[0].product.images[0].original_url
                      }" alt="Book Image" class="order-image" />
                  </div>
                  <div class="col">
                      <div class="order-details">
                          <div class="row">
                              <div class="col-md-4">
                                  <div class="row h-100" style="align-items: center">${orderItemsHTML}</div>
                              </div>
                              <div class="col-md-4">
                                  <div class="row h-100" style="align-items: center">
                                      <p class="m-0 text-center">₹ ${
                                        order.selling_price
                                      }</p>
                                  </div>
                              </div>
                              <div class="col-md-4 d-flex align-items-center">
                                  <div class="d-flex h-100 w-100" style="align-items: center; flex-direction: column">
                                      <a href="/user/order/${
                                        order._id
                                      }" style="text-decoration: none;" class="track-btn">${linkText}</a>
                                      ${statusHTML}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>`;
      });
    } else {
      html = `<div class="text-center">
              <h2>No orders yet</h2>
              <a class="btn btn-primary" href="/user/shop">Shop</a>
          </div>`;
    }
    ordersContainer.innerHTML = html;
  }

  function renderPagination(totalPages, currentPage, filters) {
    const paginationContainer = document.getElementById("pagination-container");
    let html = '<ul class="pagination justify-content-center">';
    for (let i = 1; i <= totalPages; i++) {
      html += `<li class="page-item ${currentPage == i ? "active" : ""}">
              <a class="page-link pagination-link" href="#" data-page="${i}">${i}</a>
          </li>`;
    }
    html += "</ul>";
    paginationContainer.innerHTML = html;
    document.querySelectorAll(".pagination-link").forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        filters.page = this.getAttribute("data-page");
        fetchOrders(filters);
      });
    });
  }

  function setupListeners() {
    [...statusRadios, ...yearRadios, ...timeRadios].forEach((radio) => {
      radio.addEventListener("change", () => {
        const filters = getFilters();
        fetchOrders(filters);
      });
    });

    paginationLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const filters = getFilters();
        filters.page = this.getAttribute("data-page");
        fetchOrders(filters);
      });
    });

    const clearBtn = document.querySelector(".clear-btn");
    clearBtn.addEventListener("click", () => {
      document
        .querySelectorAll(
          'input[name="statusFilter"], input[name="yearFilter"], input[name="timeFilter"]'
        )
        .forEach((radio) => {
          radio.checked = false;
        });
      fetchOrders({ status: "", year: "", time: "", page: 1 });
    });
  }

  setupListeners();
});
