// Add event listener for logout button
document.querySelectorAll(".logout-btn").forEach((button) => {
  button.addEventListener("click", function (e) {
    e.preventDefault();
    logoutAdmin();
  });
});

async function logoutAdmin() {
  try {
    const response = await axios.post("/admin/logout");
    if (response.data.success) {
      alert("Logged out successfully!");
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 1500);
    }
  } catch (error) {
    let messages = [];
    if (error.response?.data?.message) {
      alert(error.response.data.message);
    } else {
      alert("Logout failed. Please try again.");
    }
  }
}
