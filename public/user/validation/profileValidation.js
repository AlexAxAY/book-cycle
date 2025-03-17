document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const alertGood = document.querySelector(".alert-good");
  const alertBad = document.querySelector(".alert-bad");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const copyIcon = document.getElementById("copy");

  [nameInput, emailInput].forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("is-invalid");
    });
  });

  function showAlert(message, type) {
    const alertBox = type === "good" ? alertGood : alertBad;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");

    setTimeout(() => {
      alertBox.classList.add("d-none");
    }, 3000);
  }

  copyIcon.addEventListener("click", async () => {
    const msg = document.getElementById("msg");
    try {
      const refCode = document.getElementById("ref-code").innerText.trim();
      await navigator.clipboard.writeText(refCode);
      msg.classList.remove("d-none");
      const smallText = msg.querySelector("small");
      smallText.classList.remove("text-danger");
      smallText.classList.add("text-success");
      setTimeout(() => {
        msg.classList.add("d-none");
      }, 2000);
    } catch (err) {
      msg.classList.remove("d-none");
      const smallText = msg.querySelector("small");
      smallText.classList.remove("text-success");
      smallText.classList.add("text-danger");
      smallText.textContent = "Error!";
      setTimeout(() => {
        msg.classList.add("d-none");
      }, 2000);
    }
  });

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    const gender =
      document.querySelector('input[name="gender"]:checked')?.value || null;

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
      const errorMessage =
        error.response?.data?.message || "Something went wrong!";
      showAlert(errorMessage, "bad");
    }
  });
});
