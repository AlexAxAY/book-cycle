// /admin/helper/blockUserHelper.js

document.addEventListener("DOMContentLoaded", () => {
  // Extract the user ID from the URL (assumes the last part is the ID)
  const userId = window.location.pathname.split("/").pop();

  // Get references to UI elements
  const blockUserBtn = document.getElementById("blockUserBtn");
  const unblockUserBtn = document.getElementById("unblockUserBtn");
  const blockReasonTextArea = document.getElementById("blockReason");
  const alertGood = document.querySelector(".alert-good");
  const alertBad = document.querySelector(".alert-bad");

  /**
   * Displays an alert message in the provided element for 3 seconds.
   * @param {Element} element - The DOM element where the alert will be shown.
   * @param {string} message - The message to display.
   */
  function showAlert(element, message) {
    element.textContent = message;
    element.classList.remove("d-none");
    setTimeout(() => {
      element.classList.add("d-none");
    }, 3000);
  }

  // Listener for the block button inside the modal
  if (blockUserBtn) {
    blockUserBtn.addEventListener("click", async () => {
      const reason = blockReasonTextArea.value.trim();
      if (!reason) {
        showAlert(alertBad, "Please provide a reason for blocking.");
        return;
      }

      try {
        // Send a PATCH request to block the user with the provided reason
        await axios.patch(`/admin/users/block/${userId}`, { reason });
        showAlert(alertGood, "User blocked successfully.");
        // Optionally, reload the page after a short delay to reflect the changes
        setTimeout(() => location.reload(), 1500);
      } catch (error) {
        console.error("Error blocking user:", error);
        const errMsg =
          error.response?.data?.message || "Failed to block the user.";
        showAlert(alertBad, errMsg);
      }
    });
  }

  // Listener for the unblock button
  if (unblockUserBtn) {
    unblockUserBtn.addEventListener("click", async () => {
      try {
        // Send a PATCH request to unblock the user
        await axios.patch(`/admin/users/unblock/${userId}`);
        showAlert(alertGood, "User unblocked successfully.");
        // Optionally, reload the page after a short delay to reflect the changes
        setTimeout(() => location.reload(), 1500);
      } catch (error) {
        console.error("Error unblocking user:", error);
        const errMsg =
          error.response?.data?.message || "Failed to unblock the user.";
        showAlert(alertBad, errMsg);
      }
    });
  }
});
