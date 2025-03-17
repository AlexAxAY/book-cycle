document.addEventListener("DOMContentLoaded", function () {
  const currentStatus = document
    .getElementById("currentStatus")
    .innerText.trim();
  const statusSelect = document.getElementById("orderStatusSelect");

  const alertGood = document.querySelector(".alert-good");
  const alertBad = document.querySelector(".alert-bad");

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

  statusSelect.innerHTML = "";
  options.forEach((opt) => {
    const optionElement = document.createElement("option");
    optionElement.value = opt;
    optionElement.text = opt;
    statusSelect.appendChild(optionElement);
  });

  const id = window.location.pathname.split("/").pop();
  const statusForm = document.getElementById("statusForm");

  const cancelReasonModal = new bootstrap.Modal(
    document.getElementById("cancelReasonModal")
  );
  const cancelReasonInput = document.getElementById("cancelReasonInput");
  const confirmCancelButton = document.getElementById("confirmCancelButton");

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

  confirmCancelButton.addEventListener("click", function () {
    const reason = cancelReasonInput.value;
    updateStatus("Cancelled", reason);
    cancelReasonModal.hide();
  });
});
