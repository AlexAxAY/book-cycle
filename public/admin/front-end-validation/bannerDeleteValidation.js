document.querySelectorAll(".banner-delete").forEach((button) => {
  button.addEventListener("click", async (e) => {
    e.preventDefault();
    const alertElement = document.querySelector(".alert.alertText");
    const alertText = alertElement;

    const id = e.currentTarget.dataset.bannerId;

    try {
      const response = await axios.delete(`/admin/all-banners/${id}`);
      if (response.data.success) {
        alertElement.classList.remove("d-none", "alert-danger");
        alertElement.classList.add("alert-success");
        alertElement.textContent =
          response.data.message || "Deleted successfully!";
        setTimeout(() => {
          window.location.href = "/admin/all-banners";
        }, 1000);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete banner. Try again.";

      alertElement.classList.remove("d-none", "alert-success");
      alertElement.classList.add("alert-danger");
      alertElement.textContent = errorMessage;
    }

    setTimeout(() => {
      alertElement.classList.add("d-none");
      alertElement.textContent = "";
    }, 2000);
  });
});
