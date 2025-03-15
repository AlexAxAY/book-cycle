window.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname !== "/user/verify-otp") {
    localStorage.removeItem("pendingUser");
  }
  if (window.location.pathname !== "/user/payment-failed") {
    localStorage.removeItem("w");
  }
});
