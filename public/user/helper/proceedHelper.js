document
  .getElementById("proceedToBuyBtn")
  .addEventListener("click", function () {
    const addressId = getSelectedAddressId();

    if (!addressId) {
      showAlert(".alert-bad", "Please select a shipping address.");
      return;
    }

    axios
      .post("/user/checkout", { addressId })
      .then((response) => {
        if (response.data.success) {
          showAlert(".alert-good", "Order placed successfully!");

          setTimeout(() => {
            window.location.href = `/user/orders/${response.data.orderId}`;
          }, 500);
        } else if (!response.data.success && response.data.zero) {
          showAlert(".alert-good", response.data.message);
          setTimeout(() => {
            window.location.href = "/user/carts";
          }, 1000);
        } else if (response.data.partial) {
          const confirmModal = new bootstrap.Modal(
            document.getElementById("confirmModal")
          );
          confirmModal.show();

          document.getElementById("confirmProceed").onclick = function () {
            axios
              .post("/user/checkout", { addressId, confirm: true })
              .then((resp) => {
                if (resp.data.success) {
                  showAlert(
                    ".alert-good",
                    "Order placed successfully with available items!"
                  );

                  setTimeout(() => {
                    window.location.href = `/user/orders/${response.data.orderId}`;
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
        console.error("Error placing order:", error);
        showAlert(".alert-bad", "An error occurred. Please try again later.");
      });
  });

function showAlert(selector, message) {
  const alertEl = document.querySelector(selector);
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
