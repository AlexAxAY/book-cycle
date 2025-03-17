document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const emailInput = document.getElementById("email");
  const alertGood = document.querySelector(".alert-good");
  const alertBad = document.querySelector(".alert-bad");

  function showAlert(message, type) {
    const alertBox = type === "good" ? alertGood : alertBad;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");

    setTimeout(() => alertBox.classList.add("d-none"), 3000);
  }

  emailInput.addEventListener("input", () => {
    emailInput.classList.remove("is-invalid");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const emailValue = emailInput.value.trim();

    if (!emailValue) {
      emailInput.classList.add("is-invalid");
      showAlert("Email is required.", "bad");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      emailInput.classList.add("is-invalid");
      showAlert("Please enter a valid email address.", "bad");
      return;
    }

    try {
      const response = await axios.post("/user/forgot-password", {
        email: emailValue,
      });

      if (response.data.success) {
        showAlert(response.data.message, "good");
        localStorage.setItem(
          "pendingUser",
          JSON.stringify({
            email: response.data.email,
            otpExpiresAt: response.data.otpExpiresAt,
            token: response.data.token,
            purpose: response.data.purpose,
          })
        );
        setTimeout(() => {
          window.location.href = response.data.redirectTo || "/user/verify-otp";
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
