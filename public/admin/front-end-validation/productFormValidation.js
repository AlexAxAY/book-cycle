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
    "language",
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

  let isSubmitting = false;

  function validateImageInput() {
    const imageInput = document.getElementById("images");
    const files = imageInput.files;

    if (files.length === 0) {
      imageInput.classList.add("is-invalid");
      return false;
    }

    if (files.length > 3) {
      imageInput.classList.add("is-invalid");
      return false;
    }

    imageInput.classList.remove("is-invalid");
    return true;
  }

  document.getElementById("images").addEventListener("change", function (e) {
    e.preventDefault();
    const files = this.files;

    if (files.length > 3) {
      this.value = "";
      alert("You can only select up to 3 images.");
    }
  });

  document.getElementById("images").addEventListener("change", function (e) {
    e.preventDefault();
    const files = this.files;
    const previewContainer = document.getElementById("image-previews");
    const existingImages = previewContainer.children.length;
    const totalImages = existingImages + files.length;

    if (totalImages > 3) {
      this.value = "";
      alert(
        "You can only have up to 3 images. Remove existing images before adding new ones."
      );
      return;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting) return;
    isSubmitting = true;

    let isValid = true;

    requiredFields.forEach((fieldId) => {
      const field = document.getElementById(fieldId);

      if (!field.value.trim()) {
        field.classList.add("is-invalid");
        isValid = false;
      } else {
        field.classList.remove("is-invalid");
      }
    });

    if (!validateImageInput()) {
      isValid = false;
    }

    if (!isValid) {
      isSubmitting = false;
      return;
    }

    const croppedImages = [];
    document.querySelectorAll(".cropped-image-input").forEach((input) => {
      croppedImages.push(input.value);
    });

    try {
      const formData = new FormData(form);

      croppedImages.forEach((image, index) => {
        formData.append(`cropped_images[${index}]`, image);
      });

      const response = await axios.post("/admin/add-products", formData);

      const alertText = document.getElementById("alert-text");

      if (response.data.success) {
        alertText.innerText = response.data.message;
        alertBox.classList.remove("d-none", "alert-warning");
        alertBox.classList.add("alert-success");

        setTimeout(() => {
          alertBox.classList.add("d-none");
        }, 2000);

        form.reset();
        const imagePreviewsContainer =
          document.getElementById("image-previews");
        imagePreviewsContainer.innerHTML = "";
      }
    } catch (error) {
      const alertText = document.getElementById("alert-text");
      alertBox.classList.remove("d-none", "alert-success");
      alertBox.classList.add("alert-warning");
      alertText.innerText =
        error.response && error.response.data.message
          ? error.response.data.message
          : "Something went wrong while submitting the form!";
    } finally {
      isSubmitting = false;
    }
  });

  requiredFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    field.addEventListener("input", () => {
      if (field.value.trim()) {
        field.classList.remove("is-invalid");
      }
    });
  });
});
