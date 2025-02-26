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

// Modified openReturnModal accepts extra parameters to show product info.
function openReturnModal(productId, productName, productQuantity) {
  const modal = document.getElementById("returnModal");
  if (!modal) {
    console.error("Return modal not found.");
    return;
  }
  // Store product data in the modal's dataset.
  modal.dataset.productId = productId;
  modal.dataset.productName = productName;
  modal.dataset.productQuantity = productQuantity;

  // Update modal content to display product info.
  const productInfoEl = document.getElementById("returnProductInfo");
  if (productInfoEl) {
    productInfoEl.textContent = `Returning: ${productName} (Quantity: ${productQuantity})`;
  }

  // Reset radio selection and hide the textarea.
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
console.log("Extracted order id:", id);

document.addEventListener("DOMContentLoaded", () => {
  // Close modal on click.
  const closeModalBtn = document.getElementById("returnCloseModal");
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      console.log("Return modal close clicked");
      const modal = document.getElementById("returnModal");
      if (modal) {
        modal.classList.add("d-none");
        console.log("Return modal should be hidden now.");
      }
    });
  } else {
    console.error("Return modal close element not found.");
  }

  // Set up click event on return-order buttons.
  document.querySelectorAll(".return-order-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.getAttribute("data-product-id");
      const productName = button.getAttribute("data-product-name");
      const productQuantity = button.getAttribute("data-product-quantity");
      openReturnModal(productId, productName, productQuantity);
    });
  });

  // Listen for changes on the radio buttons to show/hide the textarea.
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

  // Update submit event to validate based on radio selection.
  document
    .getElementById("submitReturn")
    .addEventListener("click", async () => {
      const modal = document.getElementById("returnModal");
      const productId = modal.dataset.productId;
      const selectedRadio = document.querySelector(
        'input[name="returnReasonOption"]:checked'
      );

      // Validate that a reason has been selected.
      if (!selectedRadio) {
        showErrorAlert("Please select a return reason.");
        return;
      }

      let reason;
      // If "Other" is selected, require a non-empty description.
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
        console.error(error);
      } finally {
        // Close modal and clear the custom reason textarea.
        modal.classList.add("d-none");
        document.getElementById("returnReason").value = "";
      }
    });
});
