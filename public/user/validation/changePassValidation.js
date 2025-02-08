document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const currentPassword = document.getElementById("currentPassword");
  const newPassword = document.getElementById("newPassword");
  const confirmNewPassword = document.getElementById("confirmNewPasword");
  const alertGood = document.querySelector(".alert-good");
  const alertBad = document.querySelector(".alert-bad");

  // Function to show alerts
  function showvalAlert(message, type) {
    const alertBox = type === "good" ? alertGood : alertBad;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
    setTimeout(() => alertBox.classList.add("d-none"), 3000);
  }

  // Remove validation error when typing
  [currentPassword, newPassword, confirmNewPassword].forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("is-invalid");
    });
  });

  // Form submission
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent page reload

    // Get input values
    const currentPass = currentPassword.value.trim();
    const newPass = newPassword.value.trim();
    const confirmPass = confirmNewPassword.value.trim();

    // Check if all fields are filled
    if (!currentPass || !newPass || !confirmPass) {
      [currentPassword, newPassword, confirmNewPassword].forEach((input) => {
        if (!input.value.trim()) input.classList.add("is-invalid");
      });
      showvalAlert("All fields are mandatory.", "bad");
      return;
    }

    if (currentPass === newPass) {
      newPassword.classList.add("is-invalid");
      showvalAlert("Current password and new password is same.", "bad");
      return;
    }

    // Check if new password matches confirm password
    if (newPass !== confirmPass) {
      confirmNewPassword.classList.add("is-invalid");
      showvalAlert("New password and confirm password do not match.", "bad");
      return;
    }

    if (newPass.length < 10) {
      newPassword.classList.add("is-invalid");
      showvalAlert(`New password must be at least 10 characters long.`, "bad");
      return;
    }

    // If valid, send request
    try {
      const response = await axios.patch("/user/change-password", {
        currentPassword: currentPass,
        newPassword: newPass,
        confirmPass: confirmPass, // Matching the backend key name
      });

      if (response.data.success) {
        showvalAlert(response.data.message, "good");
        form.reset(); // Clear the form on success
      } else {
        showvalAlert(response.data.message, "bad");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Something went wrong!";
      showvalAlert(errorMessage, "bad");
    }
  });
});
