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
    const existingImagesCount = document.querySelectorAll(
      "input[name='existingImages[]']"
    ).length;
    const newImagesCount = imageInput.files.length;
    if (existingImagesCount + newImagesCount > 3) {
      imageInput.value = "";
      alert("Sorry, you cannot upload more than 3 images in total!");
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    let isValid = true;

    requiredFields.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      field.classList.toggle("is-invalid", !field.value.trim());
      if (!field.value.trim()) isValid = false;
    });

    if (!isValid) return;

    try {
      const id = window.location.pathname.split("/").pop();
      const formData = new FormData(form);

      const existingImagesArray = Array.from(
        document.getElementsByName("existingImages[]")
      ).map((img) => JSON.parse(img.value));

      const previewImages = document.querySelectorAll("#image-previews img");
      const newImagesArray = [];
      const existingCroppedImagesArray = [];

      // Inside the form submit event handler:
      previewImages.forEach((img) => {
        const container = img.closest(".image-preview-container");
        const hiddenInput = container.querySelector(
          'input[name="existingImages[]"], input[name="newImages[]"]'
        );

        if (!hiddenInput) {
          console.error("Hidden input missing for image:", img);
          return;
        }

        const imageData = JSON.parse(hiddenInput.value);

        const imageDetails = {
          url: img.src,
          filename: imageData.filename || `new_image_${Date.now()}`,
          original_url: imageData.original_url || img.src,
          _id: imageData._id || null,
        };

        if (!imageData._id) {
          if (
            !newImagesArray.some((i) => i.filename === imageDetails.filename)
          ) {
            newImagesArray.push(imageDetails);
          }
        } else if (img.src !== imageData.original_url) {
          const exists = existingCroppedImagesArray.some(
            (i) =>
              i._id === imageDetails._id && i.filename === imageDetails.filename
          );
          if (!exists) {
            existingCroppedImagesArray.push(imageDetails);
          }
        }
      });

      // Clear previous values
      formData.delete("existingImages[]");
      formData.delete("existingCroppedImages");
      formData.delete("newImages");

      // Append remaining existing images and cropped images to formData
      existingImagesArray.forEach((imageDetails) => {
        formData.append("existingImages[]", JSON.stringify(imageDetails));
      });
      formData.append(
        "existingCroppedImages",
        JSON.stringify(existingCroppedImagesArray)
      );
      formData.append("newImages", JSON.stringify(newImagesArray));

      const response = await axios.put(`/admin/product/${id}`, formData);

      if (response.data.success) {
        alertBox.classList.remove("d-none", "alert-warning");
        alertBox.classList.add("alert-success");
        document.getElementById("alert-text").innerText = response.data.message;
        setTimeout(() => {
          alertBox.classList.add("d-none");
          window.location.href = "/admin/products";
        }, 2000);
      }
    } catch (error) {
      alertBox.classList.remove("d-none", "alert-success");
      alertBox.classList.add("alert-warning");
      document.getElementById("alert-text").innerText =
        error.response?.data.message ||
        "Something went wrong while submitting the form!";
      setTimeout(() => {
        alertBox.classList.add("d-none");
      }, 2000);
    }
  });

  requiredFields.forEach((fieldId) => {
    document.getElementById(fieldId).addEventListener("input", function () {
      this.classList.remove("is-invalid");
    });
  });
});
