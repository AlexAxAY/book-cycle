document.addEventListener("DOMContentLoaded", function () {
  const alertBad = document.querySelector(".alert-bad");
  const alertGood = document.querySelector(".alert-good");
  const otpInput = document.querySelector(".otp-input");
  const verifyBtn = document.querySelector(".otp-btn");
  const resendBtn = document.querySelector(".resend-btn");

  // Retrieve pending user from localStorage
  let pendingUser = JSON.parse(localStorage.getItem("pendingUser"));
  const token = pendingUser?.token;
  const purpose = pendingUser?.purpose;
  // Convert otpExpiresAt to a timestamp (number) if it exists
  let otpExpiresAt = pendingUser?.otpExpiresAt
    ? new Date(pendingUser.otpExpiresAt).getTime()
    : null;

  if (!pendingUser || !pendingUser.email || !otpExpiresAt) {
    window.location.href = "/user/register";
    return;
  }

  // Helper to show alerts
  function showAlert(element, message, isError = true) {
    element.textContent = message;
    element.classList.remove("d-none");
    setTimeout(() => element.classList.add("d-none"), 3000);
  }

  // Calculate the remaining time in seconds
  let timeLeft = Math.floor((otpExpiresAt - Date.now()) / 1000);

  function updateTimerDisplay() {
    verifyBtn.textContent = `Verify OTP (${timeLeft}s)`;
    resendBtn.textContent = `Resend in ${timeLeft}s`;
  }

  function startTimer() {
    resendBtn.classList.add("disabled");
    resendBtn.style.pointerEvents = "none";
    updateTimerDisplay();

    let timer = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();

      if (timeLeft <= 0) {
        clearInterval(timer);
        resendBtn.classList.remove("disabled");
        resendBtn.style.pointerEvents = "auto";
        resendBtn.textContent = "Resend OTP";
      }
    }, 1000);
  }

  // If the stored OTP expiry time is already past, disable the form.
  if (Date.now() > otpExpiresAt) {
    showAlert(alertBad, "Your OTP has expired. Please request a new one.");
    otpInput.disabled = true;
    verifyBtn.disabled = true;
    resendBtn.classList.remove("disabled");
    resendBtn.style.pointerEvents = "auto";
  } else {
    startTimer();
  }

  verifyBtn.addEventListener("click", async function () {
    const otp = otpInput.value.trim();

    alertBad.classList.add("d-none");
    alertGood.classList.add("d-none");

    if (!otp || otp.length !== 6 || isNaN(otp)) {
      showAlert(alertBad, "Please enter a valid 6-digit OTP.");
      otpInput.classList.add("is-invalid");
      return;
    }

    try {
      const response = await axios.post("/user/verify-otp", {
        email: pendingUser.email,
        otp,
        token,
        purpose,
      });

      if (response.data.success) {
        showAlert(alertGood, response.data.message, false);
        // Remove pendingUser from localStorage on successful verification
        localStorage.removeItem("pendingUser");

        setTimeout(() => {
          // Check the returned redirectTo value and navigate accordingly.
          const redirectTo = response.data.redirectTo;
          if (redirectTo === "/user/change-password") {
            window.location.href = "/user/change-password";
          } else {
            // Default (for registration or other cases)
            window.location.href = redirectTo || "/user/home";
          }
        }, 2000);
      }
    } catch (error) {
      showAlert(
        alertBad,
        error.response?.data?.message || "OTP verification failed."
      );
      otpInput.classList.add("is-invalid");
    }
  });

  otpInput.addEventListener("input", function () {
    this.classList.remove("is-invalid");
  });

  resendBtn.addEventListener("click", async function (e) {
    e.preventDefault();
    if (resendBtn.classList.contains("disabled")) return;

    try {
      const response = await axios.post("/user/resend-otp", {
        email: pendingUser.email,
        name: pendingUser.name,
        purpose,
      });

      if (response.data.success) {
        showAlert(alertGood, "New OTP sent. Please check your email.", false);
        pendingUser.otpExpiresAt = Date.now() + 120000;
        localStorage.setItem("pendingUser", JSON.stringify(pendingUser));
        timeLeft = 120;
        startTimer();
      } else {
        showAlert(alertBad, response.data.message || "Failed to resend OTP.");
      }
    } catch (error) {
      showAlert(
        alertBad,
        error.response?.data?.message || "Error resending OTP."
      );
    }
  });
});
