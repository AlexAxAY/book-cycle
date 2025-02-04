document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("signup-form");
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("Confirm_password");
  const alertBad = document.querySelector(".alert-bad");
  const alertGood = document.querySelector(".alert-good");

  // Retrieve user ID from local storage
  const storedData = localStorage.getItem("stayBack");
  const userId = storedData ? JSON.parse(storedData).stayBack : null;

  if (!userId) {
    window.location.href = "/user/login";
    return;
  }

  // Remove "is-invalid" class when the user starts typing
  [passwordInput, confirmInput].forEach((input) => {
    input.addEventListener("input", function () {
      if (input.value.trim() !== "") {
        input.classList.remove("is-invalid");
      }
    });
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Reset previous alerts
    alertBad.classList.add("d-none");
    alertGood.classList.add("d-none");
    alertBad.innerText = "";
    alertGood.innerText = "";

    let valid = true;
    const password = passwordInput.value.trim();
    const confirmPassword = confirmInput.value.trim();

    // **1. Check if both fields are empty**
    if (!password || !confirmPassword) {
      alertBad.innerText = "Both fields are required.";
      alertBad.classList.remove("d-none");
      if (!password) passwordInput.classList.add("is-invalid");
      if (!confirmPassword) confirmInput.classList.add("is-invalid");
      valid = false;
    }

    // **2. Check if password length is at least 10**
    if (password.length > 0 && password.length < 10) {
      alertBad.innerText = "Password must be at least 10 characters long.";
      alertBad.classList.remove("d-none");
      passwordInput.classList.add("is-invalid");
      valid = false;
    }

    // **3. Check if passwords match**
    if (password && confirmPassword && password !== confirmPassword) {
      alertBad.innerText = "Passwords do not match.";
      alertBad.classList.remove("d-none");
      confirmInput.classList.add("is-invalid");
      valid = false;
    }

    if (!valid) {
      // **Make alert disappear after 3 seconds**
      setTimeout(() => {
        alertBad.classList.add("d-none");
      }, 3000);
      return;
    }

    try {
      const response = await axios.patch(`/user/set-password/${userId}`, {
        password: password,
      });

      if (response.data.success) {
        alertGood.innerText =
          response.data.message || "Password updated successfully.";
        alertGood.classList.remove("d-none");

        localStorage.removeItem("stayBack");

        // **Hide success alert after 3 seconds**
        setTimeout(() => {
          alertGood.classList.add("d-none");
          window.location.href = "/user/home";
        }, 3000);
      } else {
        alertBad.innerText =
          response.data.message || "Error updating password.";
        alertBad.classList.remove("d-none");

        // **Hide error alert after 3 seconds**
        setTimeout(() => {
          alertBad.classList.add("d-none");
        }, 3000);
      }
    } catch (error) {
      alertBad.innerText = "Server error. Please try again.";
      alertBad.classList.remove("d-none");

      // **Hide error alert after 3 seconds**
      setTimeout(() => {
        alertBad.classList.add("d-none");
      }, 3000);
    }
  });
});
