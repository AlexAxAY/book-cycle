document.addEventListener("DOMContentLoaded", () => {
  function showAlert(message, type = "error") {
    const alertEl =
      type === "error"
        ? document.querySelector(".alert-bad")
        : document.querySelector(".alert-good");
    if (!alertEl) return;

    // Set the message and show the alert
    alertEl.textContent = message;
    alertEl.classList.remove("d-none");

    setTimeout(() => {
      alertEl.classList.add("d-none");
    }, 3000);
  }

  const plusButtons = document.querySelectorAll(".plus");
  const minusButtons = document.querySelectorAll(".minus");

  plusButtons.forEach((button) => {
    button.addEventListener("click", async function () {
      const cartItemId = this.getAttribute("data-id");
      const quantityInput =
        this.closest(".row").querySelector(".quantity-input");
      let currentQuantity = parseInt(quantityInput.value);

      if (currentQuantity < 3) {
        let newQuantity = currentQuantity + 1;
        quantityInput.value = newQuantity;

        try {
          await axios.put(`/user/cart/${cartItemId}`, {
            quantity: newQuantity,
          });
          updateCartDetails();
        } catch (error) {
          if (
            error.response &&
            error.response.data &&
            error.response.data.message
          ) {
            showAlert(error.response.data.message, "error");
          }
          console.error("Error updating quantity:", error);
          quantityInput.value = currentQuantity;
        }
      }
    });
  });

  // Attach click events for the minus buttons
  minusButtons.forEach((button) => {
    button.addEventListener("click", async function () {
      const cartItemId = this.getAttribute("data-id");
      const quantityInput =
        this.closest(".row").querySelector(".quantity-input");
      let currentQuantity = parseInt(quantityInput.value);

      if (currentQuantity > 1) {
        let newQuantity = currentQuantity - 1;
        quantityInput.value = newQuantity;
        try {
          await axios.put(`/user/cart/${cartItemId}`, {
            quantity: newQuantity,
          });
          updateCartDetails();
        } catch (error) {
          if (
            error.response &&
            error.response.data &&
            error.response.data.message
          ) {
            showAlert(error.response.data.message, "error");
          }
          console.error("Error updating quantity:", error);
          // Optionally revert the UI quantity back on error
          quantityInput.value = currentQuantity;
        }
      }
    });
  });

  // Function to update the Price Details section dynamically
  async function updateCartDetails() {
    try {
      const response = await axios.get("/user/cart-details");
      if (response.data.success) {
        const data = response.data.data;
        // Update the Price Details section (assumes your price details section has class "price-details")
        const priceDetailsEl = document.querySelector(".price-details");
        priceDetailsEl.innerHTML = `
          <div class="row h-100" style="flex-direction: column">
            <div class="col-auto my-2 text-center">
              <h5>Product details</h5>
            </div>
            <div class="col">
              <div class="d-flex h-100 w-100" style="align-items: center">
                <div class="col-6 text-start">
                  <p>Price (${data.totalItems} items)</p>
                  <p>Discount</p>
                  <p>Delivery charges</p>
                  <p><strong>Total amount</strong></p>
                </div>
                <div class="col-6 text-end">
                  <p><small>₹ ${data.totalOriginalPrice.toFixed(2)}</small></p>
                  <p><small>₹ ${data.totalDiscountAmount.toFixed(
                    2
                  )} off (${data.overallDiscountPercentage.toFixed(
          2
        )}% off)</small></p>
                  <p>${
                    data.deliveryCharge === 0
                      ? '<small style="color: green">Free</small>'
                      : `<small>₹ ${data.deliveryCharge}</small>`
                  }</p>
                  <p>₹ ${data.finalTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col mt-3">
              <div class="row my-2">
                <a href="/user/checkout" class="low-button" style="border-radius: 10px; background-color: green; border: none; color: white; text-decoration: none; display: inline-block; text-align: center;">Proceed to buy</a>
              </div>
              <div class="row my-2">
                <a href="/user/shop" class="text-center low-button" style="border-radius: 10px; text-decoration: none; background-color: yellow; border: none; color: black;">Continue Shopping</a>
              </div>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error("Error updating cart details:", error);
    }
  }
});
