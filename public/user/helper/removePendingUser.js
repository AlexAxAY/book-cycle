window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

window.addEventListener("popstate", () => {
  window.location.reload();
});

window.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname !== "/user/verify-otp") {
    localStorage.removeItem("pendingUser");
  }
  if (window.location.pathname !== "/user/payment-failed") {
    localStorage.removeItem("w");
  }
});
