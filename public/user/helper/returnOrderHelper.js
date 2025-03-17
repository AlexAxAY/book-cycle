function showErrorAlert(message) {
  const alertDiv = document.querySelector(".alert-bad");
  alertDiv.textContent = message;
  alertDiv.classList.remove("d-none");
  setTimeout(() => {
    alertDiv.classList.add("d-none");
  }, 3000);
}

function showSuccessAlert(message) {
  const alertDiv = document.querySelector(".alert-good");
  alertDiv.textContent = message;
  alertDiv.classList.remove("d-none");
  setTimeout(() => {
    alertDiv.classList.add("d-none");
  }, 3000);
}

function openReturnModal(productId, productName, productQuantity) {
  const modal = document.getElementById("returnModal");

  modal.dataset.productId = productId;
  modal.dataset.productName = productName;
  modal.dataset.productQuantity = productQuantity;

  const productInfoEl = document.getElementById("returnProductInfo");
  if (productInfoEl) {
    productInfoEl.textContent = `Returning: ${productName} (Quantity: ${productQuantity})`;
  }

  document
    .querySelectorAll('input[name="returnReasonOption"]')
    .forEach((radio) => {
      radio.checked = false;
    });
  const textarea = document.getElementById("returnReason");
  textarea.value = "";
  textarea.style.display = "none";

  modal.classList.remove("d-none");
}

const id = window.location.pathname.split("/").pop();

document.addEventListener("DOMContentLoaded", () => {
  const closeModalBtn = document.getElementById("returnCloseModal");
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      console.log("Return modal close clicked");
      const modal = document.getElementById("returnModal");
      if (modal) {
        modal.classList.add("d-none");
      }
    });
  } else {
    showErrorAlert("Error");
  }

  document.querySelectorAll(".return-order-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.getAttribute("data-product-id");
      const productName = button.getAttribute("data-product-name");
      const productQuantity = button.getAttribute("data-product-quantity");
      openReturnModal(productId, productName, productQuantity);
    });
  });

  document
    .querySelectorAll('input[name="returnReasonOption"]')
    .forEach((radio) => {
      radio.addEventListener("change", (e) => {
        if (e.target.value === "other") {
          document.getElementById("returnReason").style.display = "block";
        } else {
          document.getElementById("returnReason").style.display = "none";
          document.getElementById("returnReason").value = "";
        }
      });
    });

  document
    .getElementById("submitReturn")
    .addEventListener("click", async () => {
      const modal = document.getElementById("returnModal");
      const productId = modal.dataset.productId;
      const selectedRadio = document.querySelector(
        'input[name="returnReasonOption"]:checked'
      );

      if (!selectedRadio) {
        showErrorAlert("Please select a return reason.");
        return;
      }

      let reason;

      if (selectedRadio.value === "other") {
        reason = document.getElementById("returnReason").value.trim();
        if (!reason) {
          showErrorAlert("Please provide a reason in the text box.");
          return;
        }
      } else {
        reason = selectedRadio.value;
      }

      try {
        const response = await axios.post(`/user/order/return/${id}`, {
          productId,
          reason,
        });

        if (response.data.success) {
          showSuccessAlert(
            response.data.message || "Return request submitted successfully."
          );
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          showErrorAlert(
            response.data.message || "Failed to submit return request."
          );
        }
      } catch (error) {
        showErrorAlert(
          "An error occurred while processing your return request."
        );
      } finally {
        modal.classList.add("d-none");
        document.getElementById("returnReason").value = "";
      }
    });
});
