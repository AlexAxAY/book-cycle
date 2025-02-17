document.addEventListener("DOMContentLoaded", () => {
  const wishButtons = document.querySelectorAll(".add-to-wish-btn");

  wishButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const productId = btn.getAttribute("data-product-id");

      try {
        const response = await axios.post(`/user/wishlist/${productId}`);

        if (response.data.success) {
          const alertGood = document.querySelector(".alert-good");
          alertGood.textContent =
            response.data.message || "Product added to wishlist successfully!";
          alertGood.classList.remove("d-none");

          setTimeout(() => {
            alertGood.classList.add("d-none");
          }, 2000);
        } else {
          handleAlert(response.data.message || "Something went wrong!", false);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          handleAlert(error.response?.data?.message || "Please login!", false);
          setTimeout(() => {
            window.location.href = "/user/login";
          }, 1000);
        } else {
          handleAlert(
            error.response?.data?.message || "Something went wrong!",
            false
          );
        }
      }
    });
  });

  function handleAlert(message, isSuccess) {
    const alertElement = isSuccess
      ? document.querySelector(".alert-good")
      : document.querySelector(".alert-bad");

    alertElement.textContent = message;
    alertElement.classList.remove("d-none");

    setTimeout(() => {
      alertElement.classList.add("d-none");
    }, 2000);
  }
});
