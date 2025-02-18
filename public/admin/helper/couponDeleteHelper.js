document.addEventListener("DOMContentLoaded", () => {
  let id = null;
  const deleteButtons = document.querySelectorAll(".delete-btn");
  const confirmDeleteBtn = document.getElementById("confirmDelete");
  const alertGood = document.querySelector(".alert-good");
  const alertBad = document.querySelector(".alert-bad");

  const confirmModalEl = document.getElementById("confirmDeleteModal");
  const confirmModal = new bootstrap.Modal(confirmModalEl);

  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      id = btn.getAttribute("data-id");
      confirmModal.show();
    });
  });

  confirmDeleteBtn.addEventListener("click", async () => {
    if (!id) return;

    try {
      const response = await axios.delete(`/admin/coupon/${id}`);
      confirmModal.hide();

      alertGood.textContent =
        response.data.message || "Coupon deleted successfully!";
      alertGood.classList.remove("d-none");

      setTimeout(() => {
        alertGood.classList.add("d-none");
        window.location.reload();
      }, 1000);
    } catch (error) {
      confirmModal.hide();
      alertBad.textContent =
        error.response?.data?.message || "Error deleting coupon.";
      alertBad.classList.remove("d-none");

      setTimeout(() => {
        alertBad.classList.add("d-none");
      }, 2000);
    }
  });
});
