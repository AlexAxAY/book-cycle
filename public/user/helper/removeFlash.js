document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const flashMessages = document.querySelectorAll(".alert");
    flashMessages.forEach((msg) => {
      msg.remove();
      msg.style.display = "none";
    });
  }, 3000);
});
