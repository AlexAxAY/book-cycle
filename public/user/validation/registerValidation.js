document
  .getElementById("signup-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    // Clear previous alerts
    const alertBad = document.querySelector(".alert-bad");
    const alertGood = document.querySelector(".alert-good");
    alertBad.classList.add("d-none");
    alertGood.classList.add("d-none");

    // Remove any existing timeouts
    clearTimeout(window.alertTimeout);

    document.querySelectorAll(".form-control").forEach((input) => {
      input.classList.remove("is-invalid");
    });

    // Validate input fields
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document
      .getElementById("Confirm_password")
      .value.trim();

    if (!name || !email || !password || !confirmPassword) {
      alertBad.textContent = "All fields are required.";
      alertBad.classList.remove("d-none");

      document.querySelectorAll(".form-control").forEach((input) => {
        if (!input.value.trim()) {
          input.classList.add("is-invalid");
        }
      });

      // Hide alert after 3 seconds
      window.alertTimeout = setTimeout(() => {
        alertBad.classList.add("d-none");
      }, 3000);

      return;
    }

    // Email validation (must end with @gmail.com)
    if (!email.endsWith("@gmail.com")) {
      alertBad.textContent =
        "Please enter a valid email address (e.g., example@gmail.com).";
      alertBad.classList.remove("d-none");
      document.getElementById("email").classList.add("is-invalid");

      // Hide alert after 3 seconds
      window.alertTimeout = setTimeout(() => {
        alertBad.classList.add("d-none");
      }, 3000);

      return;
    }

    // Password length validation (must be 10 or more characters)
    if (password.length < 10) {
      alertBad.textContent = "Password must be at least 10 characters long.";
      alertBad.classList.remove("d-none");
      document.getElementById("password").classList.add("is-invalid");

      // Hide alert after 3 seconds
      window.alertTimeout = setTimeout(() => {
        alertBad.classList.add("d-none");
      }, 3000);

      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      alertBad.textContent = "Passwords do not match.";
      alertBad.classList.remove("d-none");
      document.getElementById("password").classList.add("is-invalid");
      document.getElementById("Confirm_password").classList.add("is-invalid");

      // Hide alert after 3 seconds
      window.alertTimeout = setTimeout(() => {
        alertBad.classList.add("d-none");
      }, 3000);

      return;
    }

    try {
      const response = await axios.post("/user/register", {
        name,
        email,
        password,
        confirmPassword,
      });

      if (response.data.success) {
        localStorage.setItem(
          "pendingUser",
          JSON.stringify({
            email: response.data.email,
            otpExpiresAt: response.data.otpExpiresAt,
          })
        );

        alertGood.textContent =
          "Registration successful! Please verify your email with the OTP sent.";
        alertGood.classList.remove("d-none");

        setTimeout(() => {
          alertGood.classList.add("d-none");
          window.location.href = response.data.redirectTo || "/user/verify-otp";
        }, 3000);
      } else {
        throw new Error(response.data.message || "Registration failed.");
      }
    } catch (error) {
      alertBad.textContent =
        error.response?.data?.message || "Registration failed.";
      alertBad.classList.remove("d-none");

      // Highlight invalid fields if the backend provides specific field errors
      if (error.response?.data?.errors) {
        for (const field in error.response.data.errors) {
          const inputField = document.getElementById(field);
          if (inputField) {
            inputField.classList.add("is-invalid");
          }
        }
      }

      // Hide alert after 3 seconds
      window.alertTimeout = setTimeout(() => {
        alertBad.classList.add("d-none");
      }, 3000);
    }
  });

// Remove "is-invalid" class when user starts typing
document.querySelectorAll(".form-control").forEach((input) => {
  input.addEventListener("input", function () {
    this.classList.remove("is-invalid");
  });
});
