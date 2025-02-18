const originalOrderSummary = {
  totalItems: document.getElementById("totalItems").textContent,
  totalOriginalPrice: document.getElementById("totalOriginalPrice").textContent,
  totalDiscountAmount: document.getElementById("totalDiscountAmount")
    .textContent,
  totalAfterDiscount: document.getElementById("totalAfterDiscount").textContent,
  deliveryCharge: document.getElementById("deliveryCharge").textContent,
  finalTotal: document.getElementById("finalTotal").textContent,
};

window.appliedCoupon = "";

document
  .getElementById("applyCouponBtn")
  .addEventListener("click", async function () {
    const couponInput = document.getElementById("couponCode");
    const couponFeedback = document.getElementById("couponFeedback");

    const couponCode = couponInput.value.trim();

    if (!couponCode) {
      couponFeedback.textContent = "Please enter a coupon code.";
      couponFeedback.style.color = "red";
      couponFeedback.classList.remove("d-none");
      return;
    }

    try {
      const response = await axios.post("/user/apply-coupon", { couponCode });

      if (response.data.success) {
        const data = response.data.checkoutData;
        document.getElementById("totalItems").textContent = data.totalItems;
        document.getElementById("totalOriginalPrice").textContent =
          "₹ " + data.totalOriginalPrice.toFixed(2);
        document.getElementById("totalDiscountAmount").textContent =
          "₹ " + data.totalDiscountAmount.toFixed(2);
        document.getElementById("totalAfterDiscount").textContent =
          "₹ " + data.totalAfterDiscount.toFixed(2);
        document.getElementById("deliveryCharge").textContent =
          "₹ " + data.deliveryCharge;
        document.getElementById("finalTotal").textContent =
          "₹ " + data.finalTotal;

        window.appliedCoupon = couponCode;

        couponFeedback.textContent = "Coupon applied";
        couponFeedback.style.color = "green";
        couponFeedback.classList.remove("d-none");
      } else {
        if (window.appliedCoupon) {
          document.getElementById("totalItems").textContent =
            originalOrderSummary.totalItems;
          document.getElementById("totalOriginalPrice").textContent =
            originalOrderSummary.totalOriginalPrice;
          document.getElementById("totalDiscountAmount").textContent =
            originalOrderSummary.totalDiscountAmount;
          document.getElementById("totalAfterDiscount").textContent =
            originalOrderSummary.totalAfterDiscount;
          document.getElementById("deliveryCharge").textContent =
            originalOrderSummary.deliveryCharge;
          document.getElementById("finalTotal").textContent =
            originalOrderSummary.finalTotal;

          window.appliedCoupon = ""; // Reset applied coupon
        }

        couponFeedback.textContent = response.data.message;
        couponFeedback.style.color = "red";
        couponFeedback.classList.remove("d-none");
      }
    } catch (error) {
      console.error(error);

      if (error.response && error.response.status === 400) {
        // If the error is due to coupon validation, show it in `couponFeedback`
        if (
          error.response.data.message.includes("Invalid coupon") ||
          error.response.data.message.includes("not active") ||
          error.response.data.message.includes("already used") ||
          error.response.data.message.includes("Order total must be")
        ) {
          // Revert order summary if an invalid coupon is entered after a valid one
          if (window.appliedCoupon) {
            document.getElementById("totalItems").textContent =
              originalOrderSummary.totalItems;
            document.getElementById("totalOriginalPrice").textContent =
              originalOrderSummary.totalOriginalPrice;
            document.getElementById("totalDiscountAmount").textContent =
              originalOrderSummary.totalDiscountAmount;
            document.getElementById("totalAfterDiscount").textContent =
              originalOrderSummary.totalAfterDiscount;
            document.getElementById("deliveryCharge").textContent =
              originalOrderSummary.deliveryCharge;
            document.getElementById("finalTotal").textContent =
              originalOrderSummary.finalTotal;

            window.appliedCoupon = ""; // Reset applied coupon
          }

          couponFeedback.textContent = error.response.data.message;
          couponFeedback.style.color = "red";
          couponFeedback.classList.remove("d-none");
        } else {
          showAlert(
            ".alert-bad",
            error.response.data.message ||
              "An error occurred. Please try again."
          );
        }
      } else {
        showAlert(
          ".alert-bad",
          "An unexpected error occurred. Please try again later."
        );
      }
    }
  });

document
  .getElementById("proceedToBuyBtn")
  .addEventListener("click", function () {
    const addressId = getSelectedAddressId();
    const paymentMethod = getSelectedPaymentMethod();

    if (!addressId) {
      showAlert(".alert-bad", "Please select a shipping address.");
      return;
    }

    axios
      .post("/user/checkout", {
        addressId,
        paymentMethod,
        couponCode: window.appliedCoupon,
      })
      .then((response) => {
        if (response.data.success) {
          showAlert(".alert-good", "Order placed successfully!");
          setTimeout(() => {
            window.location.replace(`/user/order/${response.data.orderId}`);
          }, 500);
        } else if (response.data.partial) {
          const confirmModal = new bootstrap.Modal(
            document.getElementById("confirmModal")
          );
          confirmModal.show();

          document.getElementById("confirmProceed").onclick = function () {
            axios
              .post("/user/checkout", {
                addressId,
                confirm: true,
                paymentMethod,
                couponCode: window.appliedCoupon,
              })
              .then((resp) => {
                if (resp.data.success) {
                  showAlert(
                    ".alert-good",
                    "Order placed successfully with available items!"
                  );
                  setTimeout(() => {
                    window.location.replace(`/user/order/${resp.data.orderId}`);
                  }, 500);
                } else {
                  showAlert(".alert-bad", resp.data.message);
                }
              })
              .catch((err) => {
                console.error(err);
                showAlert(
                  ".alert-bad",
                  "An error occurred. Please try again later."
                );
              });
          };
        } else {
          showAlert(".alert-bad", response.data.message);
        }
      })
      .catch((error) => {
        if (error.response && error.response.status === 400) {
          const data = error.response.data;
          if (data.zero) {
            showAlert(".alert-bad", data.message);
            setTimeout(() => {
              window.location.href = "/user/cart";
            }, 3000);
          } else if (data.countError) {
            showAlert(".alert-bad", data.message);
            setTimeout(() => {
              window.location.href = "/user/cart";
            }, 3000);
          } else {
            showAlert(
              ".alert-bad",
              data.message || "An error occurred. Please try again later."
            );
          }
        } else {
          console.error("Error placing order:", error);
          showAlert(".alert-bad", "An error occurred. Please try again later.");
        }
      });
  });

function showAlert(selector, message) {
  const alertEl = document.querySelector(selector);
  if (!alertEl) {
    console.error("Alert element not found for selector:", selector);
    return;
  }
  alertEl.textContent = message;
  alertEl.classList.remove("d-none");
  setTimeout(() => {
    alertEl.classList.add("d-none");
  }, 3000);
}

function getSelectedAddressId() {
  const selected = document.querySelector(
    'input[name="selectedAddress"]:checked'
  );
  return selected ? selected.value : null;
}

function getSelectedPaymentMethod() {
  const selected = document.querySelector(
    'input[name="paymentMethod"]:checked'
  );
  return selected ? selected.value : "COD";
}
