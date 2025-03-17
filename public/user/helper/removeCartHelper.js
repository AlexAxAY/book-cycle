document.addEventListener("DOMContentLoaded", () => {
  const removeButtons = document.querySelectorAll(".rm-button");
  const successAlert = document.querySelector(".alert-good");
  const errorAlert = document.querySelector(".alert-bad");

  removeButtons.forEach((button) => {
    button.addEventListener("click", async function () {
      const productId = this.dataset.id;

      try {
        const response = await axios.delete(`/user/cart/${productId}`);

        if (response.data.success) {
          showAlert(successAlert, response.data.message, "good");
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else {
          showAlert(errorAlert, response.data.message, "bad");
        }
      } catch (error) {
        showAlert(errorAlert, "Failed to remove product from cart", "bad");
      }
    });
  });

  function showAlert(element, message, type) {
    element.textContent = message;
    element.classList.remove("d-none");

    setTimeout(() => {
      element.classList.add("d-none");
    }, 3000);
  }
});
