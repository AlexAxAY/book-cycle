document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const currentPassword = document.getElementById("currentPassword");
  const newPassword = document.getElementById("newPassword");
  const confirmNewPassword = document.getElementById("confirmNewPasword");
  const alertGood = document.querySelector(".alert-good");
  const alertBad = document.querySelector(".alert-bad");

  function showvalAlert(message, type) {
    const alertBox = type === "good" ? alertGood : alertBad;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
    setTimeout(() => alertBox.classList.add("d-none"), 3000);
  }

  [currentPassword, newPassword, confirmNewPassword].forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("is-invalid");
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const currentPass = currentPassword.value.trim();
    const newPass = newPassword.value.trim();
    const confirmPass = confirmNewPassword.value.trim();

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

    try {
      const response = await axios.patch("/user/change-password", {
        currentPassword: currentPass,
        newPassword: newPass,
        confirmPass: confirmPass,
      });

      if (response.data.success) {
        showvalAlert(response.data.message, "good");
        form.reset();
        setTimeout(() => {
          window.location.href = "/user/home";
        }, 1500);
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
