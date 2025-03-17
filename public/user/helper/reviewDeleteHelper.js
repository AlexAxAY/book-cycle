document.addEventListener("DOMContentLoaded", () => {
  let reviewIdToDelete = null;
  const successAlert = document.querySelector(".alert-good");
  const errorAlert = document.querySelector(".alert-bad");

  document.querySelectorAll(".fa-trash").forEach((icon) => {
    icon.addEventListener("click", () => {
      reviewIdToDelete = icon.getAttribute("data-review-id");
      const productName = icon.getAttribute("data-product-name");
      const modalBody = document.querySelector("#staticBackdrop .modal-body");
      modalBody.innerHTML = `Are you sure you want to delete the review for <strong>${productName}</strong>?`;
    });
  });

  document
    .querySelector("#staticBackdrop .btn-danger")
    .addEventListener("click", async () => {
      if (!reviewIdToDelete) return;
      try {
        const response = await axios.delete(`/user/review/${reviewIdToDelete}`);
        if (response.data.success) {
          successAlert.textContent =
            response.data.message || "Review deleted successfully.";
          successAlert.classList.remove("d-none");

          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          errorAlert.textContent =
            response.data.message || "Error deleting review.";
          errorAlert.classList.remove("d-none");

          setTimeout(() => {
            errorAlert.classList.add("d-none");
          }, 3000);
        }
      } catch (error) {
        errorAlert.textContent = "Error deleting review.";
        errorAlert.classList.remove("d-none");
        setTimeout(() => {
          errorAlert.classList.add("d-none");
        }, 3000);
      }
    });
});
