document.querySelectorAll(".logout-btn").forEach((button) => {
  button.addEventListener("click", function (e) {
    e.preventDefault();
    logoutAdmin();
  });
});

function showAlert(type, message) {
  const alertElement =
    type === "success"
      ? document.querySelector(".alert-good")
      : document.querySelector(".alert-bad");

  alertElement.textContent = message;
  alertElement.classList.remove("d-none");

  setTimeout(() => {
    alertElement.classList.add("d-none");
  }, 3000);
}

async function logoutAdmin() {
  try {
    const response = await axios.post("/admin/logout");
    if (response.data.success) {
      showAlert("success", "Logged out successfully!");
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 1500);
    }
  } catch (error) {
    if (error.response?.data?.message) {
      showAlert("error", error.response.data.message);
    } else {
      showAlert("error", "Logout failed. Please try again.");
    }
  }
}
