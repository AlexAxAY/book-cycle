document.addEventListener("DOMContentLoaded", () => {
  let selectedCategoryId = null;

  // Get modal, buttons, and placeholders
  const deleteModal = new bootstrap.Modal(
    document.getElementById("deleteCategoryModal")
  );
  const confirmDeleteButton = document.getElementById("confirmDeleteButton");
  const categoryNamePlaceholder = document.getElementById(
    "categoryNamePlaceholder"
  );

  // Alert elements
  const successAlert = document.querySelector(".alert-good");
  const errorAlert = document.querySelector(".alert-bad");

  // Function to show alerts
  function showDltAlert(alertElement, message) {
    alertElement.textContent = message;
    alertElement.classList.remove("d-none");
    setTimeout(() => {
      alertElement.classList.add("d-none");
    }, 3000); // Hide after 3 seconds
  }

  // Add event listener to delete buttons
  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", function () {
      selectedCategoryId = this.getAttribute("data-id"); // Store category ID
      const categoryName = this.getAttribute("data-name"); // Get category name

      // Set the category name in the modal
      categoryNamePlaceholder.textContent = categoryName;

      // Show the modal
      deleteModal.show();
    });
  });

  // When confirm delete is clicked
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
      console.error(error);
      showDltAlert(
        errorAlert,
        "An error occurred while deleting the category."
      );
    }
  });
});
