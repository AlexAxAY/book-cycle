document.querySelector(".logout").addEventListener("click", async (e) => {
  e.preventDefault();
  const goodAlert = document.querySelector(".alert-good");
  const badAlert = document.querySelector(".alert-bad");

  goodAlert.classList.add("d-none");
  badAlert.classList.add("d-none");

  try {
    const response = await axios.post("/user/logout");

    if (response.data.success) {
      goodAlert.classList.remove("d-none");
      goodAlert.textContent = response.data.message || "Logged out!";
      setTimeout(() => {
        goodAlert.classList.add("d-none");
        window.location.href = "/user/home";
      }, 1000);
    }
  } catch (err) {
    console.log("Error in logging out!", err);
    if (err.response || err.response.data.message || err.response.data) {
      badAlert.classList.remove("d-none");
      badAlert.textContent =
        err.response.data.message || "Error in logging out!";
      setTimeout(() => {
        badAlert.classList.add("d-none");
      }, 1000);
    }
  }
});
