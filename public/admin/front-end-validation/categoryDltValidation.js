document.addEventListener("DOMContentLoaded", () => {
  let selectedCategoryId = null;

  const deleteModal = new bootstrap.Modal(
    document.getElementById("deleteCategoryModal")
  );
  const confirmDeleteButton = document.getElementById("confirmDeleteButton");
  const categoryNamePlaceholder = document.getElementById(
    "categoryNamePlaceholder"
  );

  const successAlert = document.querySelector(".alert-good");
  const errorAlert = document.querySelector(".alert-bad");

  function showDltAlert(alertElement, message) {
    alertElement.textContent = message;
    alertElement.classList.remove("d-none");
    setTimeout(() => {
      alertElement.classList.add("d-none");
    }, 3000);
  }

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", function () {
      selectedCategoryId = this.getAttribute("data-id");
      const categoryName = this.getAttribute("data-name");

      categoryNamePlaceholder.textContent = categoryName;

      deleteModal.show();
    });
  });

  confirmDeleteButton.addEventListener("click", async () => {
    if (!selectedCategoryId) return;

    try {
      const response = await axios.delete(
        `/admin/manage-category/${selectedCategoryId}`
      );
      if (response.data.success) {
        showDltAlert(successAlert, "Category deleted successfully!");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        showDltAlert(errorAlert, "Error: Unable to delete category.");
      }
    } catch (error) {
      showDltAlert(
        errorAlert,
        "An error occurred while deleting the category."
      );
    }
  });
});
