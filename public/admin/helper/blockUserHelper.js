document.addEventListener("DOMContentLoaded", () => {
  const userId = window.location.pathname.split("/").pop();

  const blockUserBtn = document.getElementById("blockUserBtn");
  const unblockUserBtn = document.getElementById("unblockUserBtn");
  const blockReasonTextArea = document.getElementById("blockReason");
  const alertGood = document.querySelector(".alert-good");
  const alertBad = document.querySelector(".alert-bad");

  function showAlert(element, message) {
    element.textContent = message;
    element.classList.remove("d-none");
    setTimeout(() => {
      element.classList.add("d-none");
    }, 3000);
  }

  if (blockUserBtn) {
    blockUserBtn.addEventListener("click", async () => {
      const reason = blockReasonTextArea.value.trim();
      if (!reason) {
        showAlert(alertBad, "Please provide a reason for blocking.");
        return;
      }

      try {
        await axios.patch(`/admin/users/block/${userId}`, { reason });
        showAlert(alertGood, "User blocked successfully.");

        setTimeout(() => location.reload(), 1500);
      } catch (error) {
        const errMsg =
          error.response?.data?.message || "Failed to block the user.";
        showAlert(alertBad, errMsg);
      }
    });
  }

  if (unblockUserBtn) {
    unblockUserBtn.addEventListener("click", async () => {
      try {
        await axios.patch(`/admin/users/unblock/${userId}`);
        showAlert(alertGood, "User unblocked successfully.");

        setTimeout(() => location.reload(), 1500);
      } catch (error) {
        const errMsg =
          error.response?.data?.message || "Failed to unblock the user.";
        showAlert(alertBad, errMsg);
      }
    });
  }
});
