// Save a copy of the original order summary from the DOM.
const originalOrderSummary = {
  totalItems: document.getElementById("totalItems").textContent,
  totalOriginalPrice: document.getElementById("totalOriginalPrice").textContent,
  totalDiscountAmount: document.getElementById("totalDiscountAmount")
    .textContent,
  totalAfterDiscount: document.getElementById("totalAfterDiscount").textContent,
  deliveryCharge: document.getElementById("deliveryCharge").textContent,
  finalTotal: document.getElementById("finalTotal").textContent,
};

// Global variables to track wallet application and coupon state.
window.appliedCoupon = "";
let walletApplied = false;
let appliedWalletAmount = 0;
// Initially, set originalFinalTotal from the rendered final total.
let originalFinalTotal = parseFloat(
  originalOrderSummary.finalTotal.replace("₹", "").trim()
);

// Optionally, fetch and display the current wallet balance on page load.
async function fetchAndDisplayWalletBalance() {
  try {
    const response = await axios.get("/user/wallet-balance", {
      withCredentials: true,
    });
    const walletBalance = response.data.balance;
    document.getElementById("currentWalletBalance").textContent =
      "Wallet Balance: ₹ " + walletBalance.toFixed(2);
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    document.getElementById("currentWalletBalance").textContent =
      "Wallet Balance: Error fetching balance";
  }
}
fetchAndDisplayWalletBalance();

// Function to revert wallet application (used by the clear button)
function clearWalletApplication() {
  // Reset the displayed totals to the original (coupon-adjusted) values.
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
    "₹ " + originalFinalTotal.toFixed(2);

  // Clear wallet-related variables and messages.
  walletApplied = false;
  appliedWalletAmount = 0;
  document.getElementById("walletAppliedInfo").textContent = "";
  // Re-enable the apply wallet button.
  document.getElementById("applyWalletBtn").disabled = false;
  // Hide the clear wallet button.
  document.getElementById("clearWalletBtn").classList.add("d-none");
}

// Apply wallet when the button is clicked.
document
  .getElementById("applyWalletBtn")
  .addEventListener("click", async () => {
    try {
      // If a coupon is already applied, no problem—use the updated originalFinalTotal.
      const response = await axios.get("/user/wallet-balance", {
        withCredentials: true,
      });
      const walletBalance = response.data.balance;

      if (walletBalance && walletBalance > 0) {
        // Use the current (coupon-adjusted) originalFinalTotal as base.
        let baseTotal = originalFinalTotal;
        // Apply up to the wallet balance but not more than the base total.
        let walletToApply = Math.min(walletBalance, baseTotal);
        appliedWalletAmount = walletToApply;

        // New estimated total = base total minus applied wallet amount.
        let newFinalTotal = baseTotal - walletToApply;
        // Update the UI:
        document.getElementById("finalTotal").textContent =
          "₹ " + newFinalTotal.toFixed(2);
        document.getElementById("walletAppliedInfo").textContent =
          "Wallet applied: ₹ " +
          walletToApply.toFixed(2) +
          ". Remaining wallet balance: ₹ " +
          (walletBalance - walletToApply).toFixed(2);

        walletApplied = true;
        // Disable the apply wallet button.
        document.getElementById("applyWalletBtn").disabled = true;
        // Show the clear wallet button.
        document.getElementById("clearWalletBtn").classList.remove("d-none");
      } else {
        showAlert(".alert-bad", "Your wallet balance is zero.");
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      showAlert(
        ".alert-bad",
        "An error occurred while fetching wallet balance."
      );
    }
  });

// Clear wallet button event.
document
  .getElementById("clearWalletBtn")
  .addEventListener("click", clearWalletApplication);

// Coupon application code.
document
  .getElementById("applyCouponBtn")
  .addEventListener("click", async function () {
    const couponInput = document.getElementById("couponCode");
    const couponFeedback = document.getElementById("couponFeedback");
    const couponCode = couponInput.value.trim();

    // If wallet is applied when coupon is being applied, clear the wallet first.
    if (walletApplied) {
      clearWalletApplication();
    }

    if (!couponCode) {
      couponFeedback.textContent = "Please enter a coupon code.";
      couponFeedback.style.color = "red";
      couponFeedback.classList.remove("d-none");
      // Revert order summary to original
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

        // **Key change:** Update the base total to be the coupon-applied total.
        originalFinalTotal = parseFloat(data.finalTotal);

        window.appliedCoupon = couponCode;
        couponFeedback.textContent = "Coupon applied";
        couponFeedback.style.color = "green";
        couponFeedback.classList.remove("d-none");
      } else {
        // Revert order summary if coupon fails.
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
        window.appliedCoupon = "";
        couponFeedback.textContent = response.data.message;
        couponFeedback.style.color = "red";
        couponFeedback.classList.remove("d-none");
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 400) {
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
          window.appliedCoupon = "";
        }
        couponFeedback.textContent = error.response.data.message;
        couponFeedback.style.color = "red";
        couponFeedback.classList.remove("d-none");
      } else {
        showAlert(
          ".alert-bad",
          "An unexpected error occurred. Please try again later."
        );
      }
    }
  });

// Proceed to Buy button remains unchanged.
// It should send the applied wallet info (walletApplied, appliedWalletAmount) along with couponCode.
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
        walletApplied: walletApplied,
        walletAmount: appliedWalletAmount,
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
                walletApplied: walletApplied,
                walletAmount: appliedWalletAmount,
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
