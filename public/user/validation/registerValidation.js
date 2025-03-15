document
  .getElementById("signup-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const alertBad = document.querySelector(".alert-bad");
    const alertGood = document.querySelector(".alert-good");
    alertBad.classList.add("d-none");
    alertGood.classList.add("d-none");
    clearTimeout(window.alertTimeout);

    document.querySelectorAll(".form-control").forEach((input) => {
      input.classList.remove("is-invalid");
    });

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document
      .getElementById("Confirm_password")
      .value.trim();
    const referralCode = document.getElementById("referralCode").value.trim();

    if (!name || !email || !password || !confirmPassword) {
      alertBad.textContent = "All fields are required";
      alertBad.classList.remove("d-none");
      document.querySelectorAll(".form-control").forEach((input) => {
        if (!input.value.trim()) {
          if (!input.classList.contains("ref")) {
            input.classList.add("is-invalid");
          }
        }
      });
      window.alertTimeout = setTimeout(() => {
        alertBad.classList.add("d-none");
      }, 3000);
      return;
    }

    const allowedDomains = [
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "hotmail.com",
    ];
    const emailRegex = new RegExp(
      `^[a-zA-Z0-9._%+-]+@(${allowedDomains.join("|")})$`
    );
    if (!emailRegex.test(email)) {
      alertBad.textContent =
        "Please enter a valid email address (e.g., example@gmail.com, example@yahoo.com)";
      alertBad.classList.remove("d-none");
      document.getElementById("email").classList.add("is-invalid");
      window.alertTimeout = setTimeout(() => {
        alertBad.classList.add("d-none");
      }, 3000);
      return;
    }

    if (password.length < 10) {
      alertBad.textContent = "Password must be at least 10 characters long.";
      alertBad.classList.remove("d-none");
      document.getElementById("password").classList.add("is-invalid");
      window.alertTimeout = setTimeout(() => {
        alertBad.classList.add("d-none");
      }, 3000);
      return;
    }

    if (password !== confirmPassword) {
      alertBad.textContent = "Passwords do not match.";
      alertBad.classList.remove("d-none");
      document.getElementById("password").classList.add("is-invalid");
      document.getElementById("Confirm_password").classList.add("is-invalid");
      window.alertTimeout = setTimeout(() => {
        alertBad.classList.add("d-none");
      }, 3000);
      return;
    }

    if (referralCode) {
      const referralRegex = /^RF[A-Za-z0-9]{8}$/;
      if (!referralRegex.test(referralCode)) {
        alertBad.textContent = "Invalid referral code format";
        alertBad.classList.remove("d-none");
        document.getElementById("referralCode").classList.add("is-invalid");
        window.alertTimeout = setTimeout(() => {
          alertBad.classList.add("d-none");
        }, 3000);
        return;
      }
    }

    try {
      const response = await axios.post("/user/register", {
        name,
        email,
        password,
        confirmPassword,
        referralCode,
      });

      if (response.data.success) {
        localStorage.setItem(
          "pendingUser",
          JSON.stringify({
            email: response.data.email,
            otpExpiresAt: response.data.otpExpiresAt,
            token: response.data.token,
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

      if (error.response?.data?.errors) {
        for (const field in error.response.data.errors) {
          const inputField = document.getElementById(field);
          if (inputField) {
            inputField.classList.add("is-invalid");
          }
        }
      }
      window.alertTimeout = setTimeout(() => {
        alertBad.classList.add("d-none");
      }, 3000);
    }
  });

document.querySelectorAll(".form-control").forEach((input) => {
  input.addEventListener("input", function () {
    this.classList.remove("is-invalid");
  });
});
