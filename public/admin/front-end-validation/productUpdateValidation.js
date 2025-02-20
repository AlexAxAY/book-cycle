// Utility function to convert data URLs to File objects
function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

document.addEventListener("DOMContentLoaded", () => {
  const alertBox = document.getElementById("alert-message");
  const button = document.getElementById("close-button");
  button.addEventListener("click", () => alertBox.classList.add("d-none"));

  const form = document.getElementById("productForm");
  const requiredFields = [
    "name",
    "author",
    "category",
    "price",
    "discount",
    "count",
    "description",
    "discount_type",
    "publish_date",
  ];

  const imageInput = document.getElementById("images");
  imageInput.addEventListener("input", () => {
    // Count ALL images: existing + new previews + new files
    const existingImagesCount = document.querySelectorAll(
      "input[name='existingImages[]']"
    ).length;
    const newPreviewImagesCount = document.querySelectorAll(
      "input[name='newImages[]']"
    ).length;
    const newFilesCount = imageInput.files.length;

    const totalImages =
      existingImagesCount + newPreviewImagesCount + newFilesCount;

    if (totalImages > 3) {
      imageInput.value = "";
      alert("Total images cannot exceed 3. Remove some images first!");
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    let isValid = true;

    // Validate required fields
    requiredFields.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      field.classList.toggle("is-invalid", !field.value.trim());
      if (!field.value.trim()) isValid = false;
    });

    if (!isValid) return;

    try {
      const id = window.location.pathname.split("/").pop();
      const formData = new FormData(form);

      // Clear existing files to avoid duplicates
      formData.delete("images");

      // Process preview images
      const previewImages = document.querySelectorAll("#image-previews img");
      let newFileCount = 0;

      previewImages.forEach((img) => {
        const container = img.closest(".image-preview-container");
        const isNewImage = !container.querySelector(
          'input[name="existingImages[]"]'
        );

        if (isNewImage) {
          // Convert data URL to File
          const filename = `cropped_${Date.now()}.png`;
          const file = dataURLtoFile(img.src, filename);

          // Append to FormData as files
          formData.append("images", file);
          newFileCount++;
        }
      });

      // Validate total images (existing + new)
      const existingCount = document.querySelectorAll(
        'input[name="existingImages[]"]'
      ).length;
      const newPreviewCount = document.querySelectorAll(
        'input[name="newImages[]"]'
      ).length;

      if (existingCount + newPreviewCount > 3) {
        alert("Total images cannot exceed 3!");
        return;
      }

      if (existingCount + newPreviewCount <= 0) {
        alert("At least one image is required!");
        return;
      }

      // Remove base64 data from JSON payload
      formData.delete("newImages");
      formData.delete("existingCroppedImages");

      // Append existing images
      const existingImagesArray = Array.from(
        document.getElementsByName("existingImages[]")
      ).map((img) => JSON.parse(img.value));

      existingImagesArray.forEach((imageDetails) => {
        formData.append("existingImages[]", JSON.stringify(imageDetails));
      });

      // Send request
      const response = await axios.put(`/admin/product/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        alertBox.classList.remove("d-none", "alert-warning");
        alertBox.classList.add("alert-success");
        document.getElementById("alert-text").innerText = response.data.message;
        setTimeout(() => {
          alertBox.classList.add("d-none");
          window.location.href = "/admin/products";
        }, 3000);
      }
    } catch (error) {
      alertBox.classList.remove("d-none", "alert-success");
      alertBox.classList.add("alert-warning");
      document.getElementById("alert-text").innerText =
        error.response?.data.message ||
        "Something went wrong while submitting the form!";
      setTimeout(() => {
        alertBox.classList.add("d-none");
      }, 3000);
    }
  });

  // Remove validation error on input
  requiredFields.forEach((fieldId) => {
    document.getElementById(fieldId).addEventListener("input", function () {
      this.classList.remove("is-invalid");
    });
  });
});
