document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bannerForm");
  const titleInput = document.getElementById("title");
  const imageInput = document.getElementById("image");
  const imagePreview = document.getElementById("imagePreview");
  const previewImage = imagePreview.querySelector("img");
  const removeBtn = document.getElementById("removeImage");
  const alertContainer = document.getElementById("alertContainer");

  let alertTimeout; // Variable to store timeout reference

  function showAlert(message, type = "danger") {
    // Clear any existing alert timeout
    clearTimeout(alertTimeout);

    alertContainer.innerHTML = `
          <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          </div>
        `;

    // Set timeout to remove alert after 3 seconds
    alertTimeout = setTimeout(() => {
      alertContainer.innerHTML = "";
    }, 3000);
  }

  // Image preview handler
  imageInput.addEventListener("change", function () {
    if (this.files && this.files[0]) {
      const file = this.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        previewImage.src = e.target.result;
        imagePreview.style.display = "block";
      };

      reader.readAsDataURL(file);
      imageInput.classList.remove("is-invalid");
    }
  });

  // Remove image handler
  removeBtn.addEventListener("click", () => {
    imageInput.value = "";
    previewImage.src = "#";
    imagePreview.style.display = "none";
    imageInput.classList.add("is-invalid");
  });

  // Real-time validation for title
  titleInput.addEventListener("input", () => {
    if (titleInput.value.trim()) {
      titleInput.classList.remove("is-invalid");
    }
  });

  // Form submission handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let isValid = true;

    // Validate title
    if (!titleInput.value.trim()) {
      titleInput.classList.add("is-invalid");
      isValid = false;
    }

    // Validate image
    if (!imageInput.files.length) {
      imageInput.classList.add("is-invalid");
      isValid = false;
    }

    if (!isValid) {
      showAlert("Please fill all required fields");
      return;
    }

    // Prepare form data
    const formData = new FormData(form);

    try {
      const response = await axios.post("/admin/banner-management", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        showAlert(response.data.message, "success");
        form.reset();
        imagePreview.style.display = "none";
      } else {
        showAlert(response.data.message || "Error uploading banner");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Server error";
      showAlert(message);
    }
  });
});
