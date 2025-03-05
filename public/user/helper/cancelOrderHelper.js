document.addEventListener("DOMContentLoaded", () => {
  // Get modal elements
  const openCancelModalBtn = document.getElementById("openCancelModal");
  const cancelModal = document.getElementById("cancelModal");
  const closeModalBtn = document.getElementById("closeModal");
  const confirmCancelBtn = document.getElementById("confirmCancelBtn");
  const cancelReasonField = document.getElementById("cancelReason");
  const alertBad = document.querySelector(".alert-bad");
  const alertGood = document.querySelector(".alert-good");

  // Open cancel modal on button click (if the open button exists)
  if (openCancelModalBtn) {
    openCancelModalBtn.addEventListener("click", () => {
      // Reset any previous selection and hide the textarea
      document
        .querySelectorAll('input[name="cancelReasonOption"]')
        .forEach((radio) => {
          radio.checked = false;
        });
      cancelReasonField.value = "";
      cancelReasonField.style.display = "none";
      cancelModal.style.display = "block";
    });
  }

  // Close modal event listener
  closeModalBtn.addEventListener("click", () => {
    cancelModal.style.display = "none";
  });

  // Listen for radio button changes to toggle the custom reason textarea
  document
    .querySelectorAll('input[name="cancelReasonOption"]')
    .forEach((radio) => {
      radio.addEventListener("change", (e) => {
        if (e.target.value === "other") {
          cancelReasonField.style.display = "block";
        } else {
          cancelReasonField.style.display = "none";
          cancelReasonField.value = "";
        }
      });
    });

  // Handle the confirm cancellation button click with validation
  confirmCancelBtn.addEventListener("click", async () => {
    // Get the selected radio option
    const selectedRadio = document.querySelector(
      'input[name="cancelReasonOption"]:checked'
    );
    if (!selectedRadio) {
      alertBad.textContent = "Please select a reason.";
      alertBad.classList.remove("d-none");
      setTimeout(() => {
        alertBad.classList.add("d-none");
      }, 1500);
      return;
    }

    let reason;
    // If "Other" is selected, ensure that the textarea is not empty
    if (selectedRadio.value === "other") {
      reason = cancelReasonField.value.trim();
      if (!reason) {
        alertBad.textContent =
          "Please provide a cancellation reason in the text box.";
        alertBad.classList.remove("d-none");
        setTimeout(() => {
          alertBad.classList.add("d-none");
        }, 1500);
        return;
      }
    } else {
      reason = selectedRadio.value;
    }

    const id = window.location.pathname.split("/").pop();
    console.log("Order id for cancellation:", id);

    try {
      const response = await axios.post(`/user/order/${id}`, {
        reason: reason,
      });

      if (response.data.success) {
        alertGood.textContent =
          response.data.message || "Order cancelled successfully.";
        alertGood.classList.remove("d-none");
        cancelModal.style.display = "none";
        setTimeout(() => {
          location.reload();
        }, 500);
      } else {
        alertBad.textContent =
          response.data.message || "Cancellation failed. Please try again.";
        alertBad.classList.remove("d-none");
        setTimeout(() => {
          alertBad.classList.add("d-none");
        }, 1500);
      }
    } catch (err) {
      console.error("Cancellation error:", err);
      alertBad.textContent =
        (err.response && err.response.data.message) ||
        "Cancellation failed. Please try again.";
      alertBad.classList.remove("d-none");
      setTimeout(() => {
        alertBad.classList.add("d-none");
      }, 1500);
    }
  });
});
