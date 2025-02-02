window.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname !== "/user/verify-otp") {
    localStorage.removeItem("pendingUser");
  }
});
