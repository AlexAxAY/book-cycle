document.addEventListener("DOMContentLoaded", () => {
  const deleteButtons = document.querySelectorAll(".dlt-item");

  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const id = btn.getAttribute("data-product-id");
      if (id) {
        console.log("id is there", id);
      }

      try {
        const response = await axios.delete(`/user/wishlist/${id}`);

        if (response.data.success) {
          const alertGood = document.querySelector(".alert-good");
          alertGood.textContent =
            response.data.message || "Item removed from wishlist successfully!";
          alertGood.classList.remove("d-none");

          btn.closest(".border").remove();

          setTimeout(() => {
            alertGood.classList.add("d-none");
            window.location.reload();
          }, 2000);
        } else {
          const alertBad = document.querySelector(".alert-bad");
          alertBad.textContent =
            response.data.message || "Something went wrong!";
          alertBad.classList.remove("d-none");

          setTimeout(() => {
            alertBad.classList.add("d-none");
          }, 2000);
        }
      } catch (error) {
        console.log("Error occurred:", error);
        const alertBad = document.querySelector(".alert-bad");
        alertBad.textContent =
          error.response?.data?.message || "Something went wrong!";
        alertBad.classList.remove("d-none");

        setTimeout(() => {
          alertBad.classList.add("d-none");
        }, 2000);
      }
    });
  });
});
