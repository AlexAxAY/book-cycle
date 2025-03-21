document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const newPassword = document.getElementById("newPassword");
  const confirmNewPassword = document.getElementById("confirmNewPasword");
  const alertGood = document.querySelector(".alert-good");
  const alertBad = document.querySelector(".alert-bad");

  function showAlert(message, type) {
    const alertBox = type === "good" ? alertGood : alertBad;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
    setTimeout(() => alertBox.classList.add("d-none"), 3000);
  }

  [newPassword, confirmNewPassword].forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("is-invalid");
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const newPass = newPassword.value.trim();
    const confirmPass = confirmNewPassword.value.trim();

    if (!newPass || !confirmPass) {
      [newPassword, confirmNewPassword].forEach((input) => {
        if (!input.value.trim()) input.classList.add("is-invalid");
      });
      showAlert("All fields are required.", "bad");
      return;
    }

    if (newPass.length < 10) {
      newPassword.classList.add("is-invalid");
      showAlert(`New password must be at least 10 characters long.`, "bad");
      return;
    }

    if (newPass !== confirmPass) {
      confirmNewPassword.classList.add("is-invalid");
      showAlert("Passwords do not match.", "bad");
      return;
    }

    try {
      const response = await axios.patch("/user/set-password", {
        newPassword: newPass,
        confirmPass: confirmPass,
      });

      if (response.data.success) {
        showAlert(response.data.message, "good");
        form.reset();
        setTimeout(() => {
          window.location.href = "/user/home";
        }, 1500);
      } else {
        showAlert(response.data.message, "bad");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Something went wrong!";
      showAlert(errorMessage, "bad");
    }
  });
});
