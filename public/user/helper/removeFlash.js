document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const flashMessages = document.querySelectorAll(".alert");
    flashMessages.forEach((msg) => {
      msg.remove(); // This line removes the message
      msg.style.display = "none"; // This line hides the message
    });
  }, 3000);
});
