document
  .querySelector(".signin-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    let errors = [];

    // Clear previous error styles
    emailInput.classList.remove("is-invalid");
    passwordInput.classList.remove("is-invalid");

    // Frontend validation
    if (!email) {
      emailInput.classList.add("is-invalid");
      errors.push("Email is required");
    }
    if (!password) {
      passwordInput.classList.add("is-invalid");
      errors.push("Password is required");
    }

    if (errors.length > 0) {
      showAlert(errors);
      return;
    }

    loginAdmin({ email, password });
  });

// Input event listeners to clear error styles
document.querySelectorAll(".signin-form input").forEach((input) => {
  input.addEventListener("input", function () {
    this.classList.remove("is-invalid");
  });
});

async function loginAdmin(credentials) {
  try {
    const response = await axios.post("/admin/login", credentials);

    if (response.data.success) {
      // Show success message before redirect
      showAlert([response.data.message], true);
      setTimeout(() => {
        window.location.href = "/admin/products";
      }, 1000);
    } else {
      showAlert([response.data.message]);
    }
  } catch (error) {
    let messages = [];
    if (error.response?.data?.message) {
      messages.push(error.response.data.message);
    } else {
      messages.push("An error occurred during login. Please try again.");
    }
    showAlert(messages);
  }
}

function showAlert(messages, isSuccess = false) {
  const alertBox = document.getElementById("alertBox");
  alertBox.innerHTML = messages.map((msg) => `<p>${msg}</p>`).join("");

  // Update alert styling based on success/error
  alertBox.className = "alert"; // Reset classes
  alertBox.classList.add(isSuccess ? "alert-success" : "alert-danger");
  alertBox.classList.remove("d-none");

  // Hide alert after 2.5 seconds
  setTimeout(() => {
    alertBox.classList.add("d-none");
  }, 2000);
}
