// Function to show custom alerts
const showBlockAlert = (message, type) => {
  const alertElement =
    type === "success"
      ? document.querySelector(".alert-good")
      : document.querySelector(".alert-bad");

  alertElement.textContent = message;
  alertElement.classList.remove("d-none");

  setTimeout(() => {
    alertElement.classList.add("d-none");
  }, 3000);
};

// Opens the modal with appropriate settings for block or unblock action
const openModalForAction = (userId, userName, action) => {
  const blockUserNameEl = document.getElementById("blockUserName");
  blockUserNameEl.textContent = userName;

  const modalTitle = document.getElementById("blockUserModalLabel");
  const actionTypeText = document.getElementById("actionTypeText");
  const confirmBlockButton = document.getElementById("confirmBlockButton");
  const reasonContainer = document.getElementById("reasonContainer");
  const blockReasonEl = document.getElementById("blockReason");

  if (action === "block") {
    modalTitle.textContent = "Confirm Block User";
    actionTypeText.textContent = "block";
    reasonContainer.style.display = "block";
    confirmBlockButton.textContent = "Block";
    blockReasonEl.value = "";
  } else if (action === "unblock") {
    modalTitle.textContent = "Confirm Unblock User";
    actionTypeText.textContent = "unblock";
    reasonContainer.style.display = "none";
    confirmBlockButton.textContent = "Unblock";
  }

  confirmBlockButton.setAttribute("data-user-id", userId);
  confirmBlockButton.setAttribute("data-action", action);

  const modalEl = document.getElementById("blockUserModal");
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
};

// Attach event listeners to block buttons
document.querySelectorAll(".block-btn").forEach((button) => {
  button.addEventListener("click", () => {
    openModalForAction(
      button.getAttribute("data-user-id"),
      button.getAttribute("data-user-name"),
      "block"
    );
  });
});

// Attach event listeners to unblock buttons
document.querySelectorAll(".unblock-btn").forEach((button) => {
  button.addEventListener("click", () => {
    openModalForAction(
      button.getAttribute("data-user-id"),
      button.getAttribute("data-user-name"),
      "unblock"
    );
  });
});

// When the confirm button is clicked, send the appropriate PATCH request.
document.getElementById("confirmBlockButton").addEventListener("click", () => {
  const userId = confirmBlockButton.getAttribute("data-user-id");
  const action = confirmBlockButton.getAttribute("data-action");
  let request;

  if (action === "block") {
    const reason = document.getElementById("blockReason").value.trim();
    if (!reason) {
      showBlockAlert("Please provide a reason for blocking the user.", "error");
      return;
    }
    request = axios.patch(`/admin/users/block/${userId}`, { reason });
  } else if (action === "unblock") {
    request = axios.patch(`/admin/users/unblock/${userId}`);
  }

  if (request) {
    request
      .then((response) => {
        bootstrap.Modal.getInstance(
          document.getElementById("blockUserModal")
        ).hide();
        showBlockAlert("Action completed successfully!", "success");
        setTimeout(() => location.reload(), 1500);
      })
      .catch((error) => {
        console.error(error);
        showBlockAlert(
          "An error occurred while processing the request.",
          "error"
        );
      });
  }
});
