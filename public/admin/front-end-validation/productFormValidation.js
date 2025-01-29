const alertBox = document.getElementById("alert-message");
const button = document.getElementById("close-button");
button.addEventListener("click", hideAlert);

function hideAlert() {
  alertBox.classList.add("d-none");
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("productForm");
  const requiredFields = [
    "name",
    "author",
    "category",
    "price",
    "discount",
    "count",
    "description",
    "images",
    "discount_type",
    "publish_date",
  ];

  // Function to validate the file input
  function validateImageInput() {
    const imageInput = document.getElementById("images");
    const files = imageInput.files;

    // Check if there are files selected
    if (files.length === 0) {
      imageInput.classList.add("is-invalid");
      return false; // Invalid if no files are selected
    }

    // Check if more than 3 files are selected
    if (files.length > 3) {
      imageInput.classList.add("is-invalid");
      return false; // Invalid if more than 3 files
    }

    // Remove the invalid class if the input is valid
    imageInput.classList.remove("is-invalid");
    return true;
  }

  // Listen to the file input change event to restrict file selection
  document.getElementById("images").addEventListener("change", function () {
    const files = this.files;

    // If more than 3 files are selected, reset the input and show an alert
    if (files.length > 3) {
      this.value = ""; // Clear the file input
      alert("You can only select up to 3 images.");
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    let isValid = true;

    // Validate each required field
    requiredFields.forEach((fieldId) => {
      const field = document.getElementById(fieldId);

      if (!field.value.trim()) {
        field.classList.add("is-invalid");
        isValid = false;
      } else {
        field.classList.remove("is-invalid");
      }
    });

    // Validate image input field (check if it's valid and has 3 or fewer files)
    if (!validateImageInput()) {
      isValid = false;
    }

    // If any field is invalid, stop further processing
    if (!isValid) return;

    // Proceed with form submission if all fields are valid
    try {
      const formData = new FormData(form);
      const response = await axios.post("/admin/add-products", formData);

      // Create alert container
      const alertText = document.getElementById("alert-text");

      if (response.data.success) {
        alertText.innerText = response.data.message;
        alertBox.classList.remove("d-none", "alert-warning");
        alertBox.classList.add("alert-success");

        setTimeout(() => {
          window.location.href = "/admin/products";
        }, 2000);

        form.reset();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alertBox.classList.remove("d-none", "alert-success");
      alertBox.classList.add("alert-warning");
      alertText.innerText =
        error.response && error.response.data.message
          ? error.response.data.message
          : "Something went wrong while submitting the form!";
    }
  });

  // Remove error on input change
  requiredFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    field.addEventListener("input", () => {
      if (field.value.trim()) {
        field.classList.remove("is-invalid");
      }
    });
  });
});
