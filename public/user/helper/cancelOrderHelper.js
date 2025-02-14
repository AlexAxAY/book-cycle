document.addEventListener("DOMContentLoaded", () => {
  // Get modal elements
  const openCancelModalBtn = document.getElementById("openCancelModal");
  const cancelModal = document.getElementById("cancelModal");
  const closeModalBtn = document.getElementById("closeModal");
  const confirmCancelBtn = document.getElementById("confirmCancelBtn");
  const cancelReasonField = document.getElementById("cancelReason");
  const alertBad = document.querySelector(".alert-bad");
  const alertGood = document.querySelector(".alert-good");

  if (openCancelModalBtn) {
    openCancelModalBtn.addEventListener("click", () => {
      cancelModal.style.display = "block";
    });
  }
  closeModalBtn.addEventListener("click", () => {
    cancelModal.style.display = "none";
  });

  // Handle the confirm cancellation button click
  confirmCancelBtn.addEventListener("click", async () => {
    const reason = cancelReasonField.value;
    const id = window.location.pathname.split("/").pop();
    console.log("id from back:", id);

    try {
      const response = await axios.post(`/user/order/${id}`, {
        reason: reason,
      });

      if (response.data.success) {
        alertGood.textContent = response.data.message;
        alertGood.classList.remove("d-none");
        cancelModal.style.display = "none";
        setTimeout(() => {
          location.reload();
        }, 500);
      } else {
        alertBad.textContent = response.data.message;
        alertBad.classList.remove("d-none");
        setTimeout(() => {
          alertBad.classList.add("d-none");
        }, 1500);
      }
    } catch (err) {
      console.error("Cancellation error:", err);
      alertBad.textContent =
        (err.response && err.response.data.message) ||
        "Cancellation failed. Please try again.";
      alertBad.classList.remove("d-none");
      setTimeout(() => {
        alertBad.classList.add("d-none");
      }, 1500);
    }
  });
});
