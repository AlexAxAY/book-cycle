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
      .post("/user/checkout", { addressId, paymentMethod })
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
              })
              .then((resp) => {
                if (resp.data.success) {
                  showAlert(
                    ".alert-good",
                    "Order placed successfully with available items!"
                  );
                  setTimeout(() => {
                    window.location.replace(
                      `/user/order/${response.data.orderId}`
                    );
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
