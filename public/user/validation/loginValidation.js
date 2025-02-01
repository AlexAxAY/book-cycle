document
  .getElementById("login-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    // Clear previous alerts
    const alertBad = document.querySelector(".alert-bad");
    const alertGood = document.querySelector(".alert-good");
    alertBad.classList.add("d-none");
    alertGood.classList.add("d-none");

    // Remove any existing timeouts
    clearTimeout(window.alertTimeout);

    // Validate input fields
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alertBad.textContent = "Both email and password are required.";
      alertBad.classList.remove("d-none");

      if (!email) document.getElementById("email").classList.add("is-invalid");
      if (!password)
        document.getElementById("password").classList.add("is-invalid");

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

    try {
      const response = await axios.post("/user/login", {
        email,
        password,
      });

      if (response.data.success) {
        alertGood.textContent = "Login successful! Redirecting...";
        alertGood.classList.remove("d-none");

        // Hide alert after 3 seconds and redirect to dashboard
        window.alertTimeout = setTimeout(() => {
          alertGood.classList.add("d-none");
          window.location.href = "/user/home";
        }, 3000);
      } else {
        throw new Error(response.data.message || "Login failed.");
      }
    } catch (error) {
      alertBad.textContent = error.response?.data?.message || "Login failed.";
      alertBad.classList.remove("d-none");

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
