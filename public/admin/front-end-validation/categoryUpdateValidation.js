const alert = document.getElementById("alert-message");
const button = document.getElementById("close-button");
button.addEventListener("click", hideAlert);

function hideAlert() {
  alert.classList.add("d-none");
}

document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const cat = document.getElementById("category");
  const desc = document.getElementById("description");
  const alertText = document.getElementById("alert-text");

  cat.classList.remove("is-invalid");
  alert.classList.add("d-none");

  if (!cat.value.trim()) {
    cat.classList.add("is-invalid");
    alertText.innerText = "Category cannot be empty!";
    alert.classList.remove("d-none");
    alert.classList.remove("alert-success");
    alert.classList.add("alert-warning");
    return;
  }

  try {
    const id = window.location.pathname.split("/").pop();
    const response = await axios.put(`/admin/manage-category/${id}`, {
      category: cat.value.trim(),
      description: desc.value.trim(),
    });

    if (response.status === 200) {
      alertText.innerText = response.data.message;
      alert.classList.remove("d-none", "alert-warning");
      alert.classList.add("alert-success");

      setTimeout(() => {
        window.location.href = "/admin/view-categories";
      }, 1000);
    }
  } catch (error) {
    alertText.innerText =
      error.response && error.response.data.message
        ? error.response.data.message
        : "Something went wrong!";
    alert.classList.remove("d-none", "alert-success");
    alert.classList.add("alert-warning");
  }
});
