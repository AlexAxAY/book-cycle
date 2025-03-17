function showBlockAlert(type, message) {
  const alertDiv = document.querySelector(
    type === "error" ? ".alert-bad" : ".alert-good"
  );
  alertDiv.textContent = message;
  alertDiv.classList.remove("d-none");

  setTimeout(() => {
    alertDiv.classList.add("d-none");
  }, 3000);
}

function resetModal() {
  document.getElementById("reasonContainer").style.display = "block";

  document.getElementById("actionTypeText").textContent = "block";

  const confirmBtn = document.getElementById("confirmBlockButton");
  confirmBtn.textContent = "Block";

  confirmBtn.setAttribute("data-action-type", "block");

  document.getElementById("blockReason").value = "";
}

document.querySelectorAll(".block-btn").forEach(function (button) {
  button.addEventListener("click", function () {
    const userId = this.getAttribute("data-user-id");
    const userName = this.getAttribute("data-user-name");

    document.getElementById("blockUserName").textContent = userName;

    resetModal();

    const confirmBtn = document.getElementById("confirmBlockButton");
    confirmBtn.setAttribute("data-user-id", userId);
    confirmBtn.setAttribute("data-action-type", "block");

    const modal = new bootstrap.Modal(
      document.getElementById("blockUserModal")
    );
    modal.show();
  });
});

document.querySelectorAll(".unblock-btn").forEach(function (button) {
  button.addEventListener("click", function () {
    const userId = this.getAttribute("data-user-id");
    const userName = this.getAttribute("data-user-name");

    document.getElementById("blockUserName").textContent = userName;

    document.getElementById("actionTypeText").textContent = "unblock";

    document.getElementById("reasonContainer").style.display = "none";

    const confirmBtn = document.getElementById("confirmBlockButton");
    confirmBtn.textContent = "Unblock";
    confirmBtn.setAttribute("data-user-id", userId);
    confirmBtn.setAttribute("data-action-type", "unblock");

    const modal = new bootstrap.Modal(
      document.getElementById("blockUserModal")
    );
    modal.show();
  });
});

document
  .getElementById("confirmBlockButton")
  .addEventListener("click", function () {
    const actionType = this.getAttribute("data-action-type");
    const userId = this.getAttribute("data-user-id");

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

      axios
        .patch(`/admin/users/block/${userId}`, { reason: reason })
        .then(function (response) {
          modalInstance.hide();
          showBlockAlert(
            "success",
            response.data.message || "User blocked successfully."
          );

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
      axios
        .patch(`/admin/users/unblock/${userId}`)
        .then(function (response) {
          modalInstance.hide();
          showBlockAlert(
            "success",
            response.data.message || "User unblocked successfully."
          );

          setTimeout(() => {
            location.reload();
          }, 1500);
        })
        .catch(function (error) {
          const message =
            (error.response &&
              error.response.data &&
              error.response.data.message) ||
            "An error occurred while processing the unblock request.";
          showBlockAlert("error", message);
        });
    }
  });
