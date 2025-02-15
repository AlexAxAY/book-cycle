document.addEventListener("DOMContentLoaded", function () {
  const currentStatus = document
    .getElementById("currentStatus")
    .innerText.trim();
  const statusSelect = document.getElementById("orderStatusSelect");

  // Custom alerts
  const alertGood = document.querySelector(".alert-good");
  const alertBad = document.querySelector(".alert-bad");

  // Determine allowed options based on the current status (remove current status itself)
  let options = [];
  if (currentStatus === "Confirmed") {
    options = ["In transit", "Cancelled"];
  } else if (currentStatus === "In transit") {
    options = ["Shipped", "Cancelled"];
  } else if (currentStatus === "Shipped") {
    options = ["Delivered"];
  } else if (currentStatus === "Delivered" || currentStatus === "Cancelled") {
    options = [];
  }

  // Populate the select element only if options exist.
  statusSelect.innerHTML = "";
  options.forEach((opt) => {
    const optionElement = document.createElement("option");
    optionElement.value = opt;
    optionElement.text = opt;
    statusSelect.appendChild(optionElement);
  });

  // Get the order id from the URL (last part of the pathname)
  const id = window.location.pathname.split("/").pop();
  const statusForm = document.getElementById("statusForm");

  // Reference to the cancellation modal and its elements
  const cancelReasonModal = new bootstrap.Modal(
    document.getElementById("cancelReasonModal")
  );
  const cancelReasonInput = document.getElementById("cancelReasonInput");
  const confirmCancelButton = document.getElementById("confirmCancelButton");

  // Function to perform the status update via axios
  const updateStatus = async (status, reason = null) => {
    try {
      const response = await axios.post(`/admin/order/${id}`, {
        status,
        reason,
      });
      if (response.data.success) {
        alertGood.textContent = response.data.message;
        alertGood.classList.remove("d-none");
        document.getElementById("currentStatus").innerText = status;
        setTimeout(() => {
          alertGood.classList.add("d-none");
          location.reload();
        }, 1500);
      } else {
        alertBad.textContent = "Error: " + response.data.message;
        alertBad.classList.remove("d-none");
        setTimeout(() => {
          alertBad.classList.add("d-none");
        }, 1500);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alertBad.textContent = "An error occurred while updating the status.";
      alertBad.classList.remove("d-none");
      setTimeout(() => {
        alertBad.classList.add("d-none");
      }, 1500);
    }
  };

  statusForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const selectedStatus = statusSelect.value;
    if (selectedStatus === "Cancelled") {
      cancelReasonInput.value = "";
      cancelReasonModal.show();
    } else {
      updateStatus(selectedStatus);
    }
  });

  // When admin confirms cancellation reason in the modal, send update request
  confirmCancelButton.addEventListener("click", function () {
    const reason = cancelReasonInput.value;
    updateStatus("Cancelled", reason);
    cancelReasonModal.hide();
  });
});
