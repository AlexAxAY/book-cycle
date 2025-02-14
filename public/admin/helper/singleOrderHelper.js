document.addEventListener("DOMContentLoaded", function () {
  const currentStatus = document
    .getElementById("currentStatus")
    .innerText.trim();
  const statusSelect = document.getElementById("orderStatusSelect");

  // Custom alerts
  const alertGood = document.querySelector(".alert-good");
  const alertBad = document.querySelector(".alert-bad");

  // Determine allowed options based on the current status
  let options = [];
  if (currentStatus === "Confirmed") {
    options = ["Confirmed", "In transit", "Cancelled"];
  } else if (currentStatus === "In transit") {
    options = ["In transit", "Shipped", "Cancelled"];
  } else if (currentStatus === "Shipped") {
    options = ["Shipped", "Delivered"];
  } else if (currentStatus === "Delivered" || currentStatus === "Cancelled") {
    options = [currentStatus];
  }

  // Populate the select element
  statusSelect.innerHTML = "";
  options.forEach((opt) => {
    const optionElement = document.createElement("option");
    optionElement.value = opt;
    optionElement.text = opt;
    if (opt === currentStatus) {
      optionElement.selected = true;
    }
    statusSelect.appendChild(optionElement);
  });

  const id = window.location.pathname.split("/").pop();
  const statusForm = document.getElementById("statusForm");

  statusForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const selectedStatus = statusSelect.value;
    try {
      const response = await axios.post(`/admin/order/${id}`, {
        status: selectedStatus,
      });
      if (response.data.success) {
        alertGood.textContent = response.data.message;
        alertGood.classList.remove("d-none");
        document.getElementById("currentStatus").innerText = selectedStatus;
        setTimeout(() => {
          alertGood.classList.add("d-none");
          location.reload();
        }, 500);
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
  });
});
