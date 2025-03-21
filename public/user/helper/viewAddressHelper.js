async function deleteAddress(addressId) {
  try {
    const response = await axios.delete(`/user/manage-address/${addressId}`);
    if (response.data.success) {
      showAlert(
        response.data.message || "Address deleted successfully!",
        "good"
      );
      setTimeout(() => location.reload(), 1500);
    }
  } catch (error) {
    showAlert(
      error?.response?.data?.message ||
        "Failed to delete address. Please try again.",
      "bad"
    );
  }
}

function showAlert(message, type) {
  const alertBox =
    type === "good"
      ? document.querySelector(".alert-good")
      : document.querySelector(".alert-bad");

  alertBox.textContent = message;
  alertBox.classList.remove("d-none");
  alertBox.style.opacity = "1";

  setTimeout(() => {
    alertBox.style.opacity = "0";
    setTimeout(() => alertBox.classList.add("d-none"), 500);
  }, 2000);
}

document.addEventListener("DOMContentLoaded", () => {
  const deleteButtons = document.querySelectorAll(".delete-icon");

  deleteButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const addressId = event.target.dataset.id;
      document
        .getElementById("confirmDeleteBtn")
        .setAttribute("data-id", addressId);
      const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
      modal.show();
    });
  });

  document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
    const addressId = document
      .getElementById("confirmDeleteBtn")
      .getAttribute("data-id");
    deleteAddress(addressId);
  });
});
