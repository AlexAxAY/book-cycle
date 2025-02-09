document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const alertGood = document.querySelector(".alert-good");
  const alertBad = document.querySelector(".alert-bad");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");

  // Remove invalid state when user starts typing
  [nameInput, emailInput].forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("is-invalid");
    });
  });

  // Helper to show alerts
  function showAlert(message, type) {
    const alertBox = type === "good" ? alertGood : alertBad;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");

    setTimeout(() => {
      alertBox.classList.add("d-none");
    }, 3000);
  }

  // Helper to validate email format
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    // Gender is optional; if none selected, default to empty string
    const gender =
      document.querySelector('input[name="gender"]:checked')?.value || null;

    // Validate required fields (name & email)
    if (!name || !email) {
      if (!name) nameInput.classList.add("is-invalid");
      if (!email) emailInput.classList.add("is-invalid");
      showAlert("Name and Email are required.", "bad");
      return;
    }

    if (!validateEmail(email)) {
      emailInput.classList.add("is-invalid");
      showAlert("Please enter a valid email address.", "bad");
      return;
    }

    // Prepare data to send
    const formData = { name, email, gender };

    try {
      const response = await axios.patch("/user/profile", formData);

      if (response.data.redirectTo) {
        showAlert(
          response.data.message || "OTP sent for email verification.",
          "good"
        );

        setTimeout(() => {
          window.location.href = response.data.redirectTo || "/user/login";
        }, 1500);
      } else {
        showAlert(
          response.data.message || "Profile updated successfully.",
          "good"
        );

        setTimeout(() => location.reload(), 2000);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage =
        error.response?.data?.message || "Something went wrong!";
      showAlert(errorMessage, "bad");
    }
  });
});
