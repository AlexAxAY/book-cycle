document.querySelector(".logout").addEventListener("click", async (e) => {
  e.preventDefault();

  try {
    const response = await axios.post("/user/logout");

    if (response.data.success) {
      alert("Logout successful!");
      setTimeout(() => {
        window.location.href = "/user/home";
      }, 1000);
    }
  } catch (err) {
    console.log("Error in logging out!", err);
  }
});
