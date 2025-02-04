// Attach click event to all block buttons
document.querySelectorAll(".block-btn").forEach(function (button) {
  button.addEventListener("click", function () {
    // Retrieve user data from data attributes
    var userId = this.getAttribute("data-user-id");
    var userName = this.getAttribute("data-user-name");

    // Set the username in the modal text
    document.getElementById("blockUserName").textContent = userName;
    // Clear any previous reason text
    document.getElementById("blockReason").value = "";
    // Store the user ID in the confirm button for later use
    document
      .getElementById("confirmBlockButton")
      .setAttribute("data-user-id", userId);

    // Show the modal (using Bootstrap 5)
    var modal = new bootstrap.Modal(document.getElementById("blockUserModal"));
    modal.show();
  });
});

// When the confirm block button is clicked, send an AJAX request to block the user.
document
  .getElementById("confirmBlockButton")
  .addEventListener("click", function () {
    var userId = this.getAttribute("data-user-id");
    var reason = document.getElementById("blockReason").value.trim();

    // Check that a reason is provided
    if (!reason) {
      alert("Please provide a reason for blocking the user.");
      return;
    }

    // Send a POST request using Axios
    axios
      .post(`/admin/users/block/${userId}`, { reason: reason })
      .then(function (response) {
        // On success, hide the modal and reload the page or update the UI accordingly.
        var modalEl = document.getElementById("blockUserModal");
        var modalInstance = bootstrap.Modal.getInstance(modalEl);
        modalInstance.hide();
        location.reload();
      })
      .catch(function (error) {
        console.error(error);
        alert("An error occurred while processing the block request.");
      });
  });
