// Utility function to show custom alerts
function showBlockAlert(type, message) {
  // type should be either 'error' or 'success'
  const alertDiv = document.querySelector(
    type === "error" ? ".alert-bad" : ".alert-good"
  );
  alertDiv.textContent = message;
  alertDiv.classList.remove("d-none");

  // Optionally, you can style the alertDiv further or use a fade out effect.
  setTimeout(() => {
    alertDiv.classList.add("d-none");
  }, 3000); // Hide after 3 seconds
}

// Utility function to reset the modal to its default (block) state.
function resetModal() {
  // Show the reason container
  document.getElementById("reasonContainer").style.display = "block";
  // Set the action text to "block"
  document.getElementById("actionTypeText").textContent = "block";
  // Set the confirm button text to "Block"
  const confirmBtn = document.getElementById("confirmBlockButton");
  confirmBtn.textContent = "Block";
  // Set the action type data attribute to block (default)
  confirmBtn.setAttribute("data-action-type", "block");
  // Clear the block reason textarea
  document.getElementById("blockReason").value = "";
}

// Attach click event to all block buttons
document.querySelectorAll(".block-btn").forEach(function (button) {
  button.addEventListener("click", function () {
    const userId = this.getAttribute("data-user-id");
    const userName = this.getAttribute("data-user-name");

    // Set the username in the modal text
    document.getElementById("blockUserName").textContent = userName;
    // Reset the modal to default block state
    resetModal();

    // Store the user ID and action in the confirm button
    const confirmBtn = document.getElementById("confirmBlockButton");
    confirmBtn.setAttribute("data-user-id", userId);
    confirmBtn.setAttribute("data-action-type", "block");

    // Show the modal (using Bootstrap 5)
    const modal = new bootstrap.Modal(
      document.getElementById("blockUserModal")
    );
    modal.show();
  });
});

// Attach click event to all unblock buttons
document.querySelectorAll(".unblock-btn").forEach(function (button) {
  button.addEventListener("click", function () {
    const userId = this.getAttribute("data-user-id");
    const userName = this.getAttribute("data-user-name");

    // Set the username in the modal text
    document.getElementById("blockUserName").textContent = userName;
    // Change the action text to "unblock"
    document.getElementById("actionTypeText").textContent = "unblock";
    // Hide the reason container because unblocking does not require a reason
    document.getElementById("reasonContainer").style.display = "none";

    // Update the confirm button for unblocking
    const confirmBtn = document.getElementById("confirmBlockButton");
    confirmBtn.textContent = "Unblock";
    confirmBtn.setAttribute("data-user-id", userId);
    confirmBtn.setAttribute("data-action-type", "unblock");

    // Show the modal
    const modal = new bootstrap.Modal(
      document.getElementById("blockUserModal")
    );
    modal.show();
  });
});

// Confirm button event listener for both block and unblock actions.
document
  .getElementById("confirmBlockButton")
  .addEventListener("click", function () {
    const actionType = this.getAttribute("data-action-type");
    const userId = this.getAttribute("data-user-id");

    // Reference to the modal element for later closing
    const modalEl = document.getElementById("blockUserModal");
    const modalInstance = bootstrap.Modal.getInstance(modalEl);

    if (actionType === "block") {
      const reason = document.getElementById("blockReason").value.trim();
      if (!reason) {
        showBlockAlert(
          "error",
          "Please provide a reason for blocking the user."
        );
        return;
      }
      // Send a PATCH request to block the user.
      axios
        .patch(`/admin/users/block/${userId}`, { reason: reason })
        .then(function (response) {
          // Hide the modal and display a success message
          modalInstance.hide();
          showBlockAlert(
            "success",
            response.data.message || "User blocked successfully."
          );
          // Optionally reload after a short delay
          setTimeout(() => {
            location.reload();
          }, 1500);
        })
        .catch(function (error) {
          console.error(error);
          const message =
            (error.response &&
              error.response.data &&
              error.response.data.message) ||
            "An error occurred while processing the block request.";
          showBlockAlert("error", message);
        });
    } else if (actionType === "unblock") {
      // Send a PATCH request to unblock the user.
      axios
        .patch(`/admin/users/unblock/${userId}`)
        .then(function (response) {
          // Hide the modal and display a success message
          modalInstance.hide();
          showBlockAlert(
            "success",
            response.data.message || "User unblocked successfully."
          );
          // Optionally reload after a short delay
          setTimeout(() => {
            location.reload();
          }, 1500);
        })
        .catch(function (error) {
          console.error(error);
          const message =
            (error.response &&
              error.response.data &&
              error.response.data.message) ||
            "An error occurred while processing the unblock request.";
          showBlockAlert("error", message);
        });
    }
  });
