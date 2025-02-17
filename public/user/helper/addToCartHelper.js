document.addEventListener("DOMContentLoaded", () => {
  const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");
  const successAlert = document.querySelector(".alert-good");
  const errorAlert = document.querySelector(".alert-bad");

  addToCartButtons.forEach((button) => {
    button.addEventListener("click", async function () {
      const productId = this.dataset.productId;
      console.log(productId);

      try {
        const response = await axios.post(`/user/cart/${productId}`);
        if (response.data.success) {
          showAlert(successAlert, response.data.message, "good");
        } else {
          showAlert(errorAlert, response.data.message, "bad");
        }
      } catch (error) {
        console.error("Error adding to cart:", error.response || error);

        const status = error.response?.status;

        if (status === 403 || status === 401) {
          const errorMessage =
            error.response?.data?.message ||
            "User not logged in, redirecting...";
          showAlert(errorAlert, errorMessage, "bad");
          setTimeout(() => {
            window.location.href = "/user/login";
          }, 1000);
        } else {
          const errorMessage =
            error.response?.data?.message || "Failed to add product to cart";
          showAlert(errorAlert, errorMessage, "bad");
        }
      }
    });
  });

  function showAlert(element, message, type) {
    element.textContent = message;
    element.classList.remove("d-none");

    setTimeout(() => {
      element.classList.add("d-none");
    }, 1000);
  }
});

window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    window.location.reload();
  }
});
