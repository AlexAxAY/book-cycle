const button = document.getElementById("close-button");
button.addEventListener("click", hideAlert);

function hideAlert() {
  const alert = document.getElementById("alert-message");
  alert.classList.add("d-none");
}

// Form submit handler
document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const cat = document.getElementById("category");
  const alert = document.getElementById("alert-message");
  const alertText = document.getElementById("alert-text");

  cat.classList.remove("is-invalid");
  alert.classList.add("d-none");

  let valid = true;

  // Validate category field
  if (!cat.value.trim()) {
    cat.classList.add("is-invalid");
    valid = false;
  }

  if (!valid) {
    alertText.innerText = "Category cannot be empty!";
    alert.classList.remove("d-none");
    alert.classList.remove("alert-success");
    alert.classList.add("alert-warning");
  } else {
    try {
      // Collect form data
      const formdata = {
        category: cat.value.trim(),
      };

      // Optional: If the description field exists, include it
      const descriptionField = document.getElementById("description");
      if (descriptionField && descriptionField.value.trim()) {
        formdata.description = descriptionField.value.trim();
      }

      const response = await axios.post("/admin/manage-category", formdata);

      if (response.status === 200) {
        alertText.innerText = response.data.message;
        alert.classList.remove("d-none");
        alert.classList.remove("alert-warning");
        alert.classList.add("alert-success");
        cat.value = "";
        if (descriptionField) descriptionField.value = "";
      }
    } catch (err) {
      const errMessage =
        (err.response && err.response.data && err.response.data.message) ||
        "An error occurred while adding the category";
      alertText.innerText = errMessage;
      alert.classList.remove("d-none");
      alert.classList.remove("alert-success");
      alert.classList.add("alert-danger");
      console.error("Error in adding the category:", err);
    }
  }
});
