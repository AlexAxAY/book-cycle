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
    const existingImages = document.querySelectorAll(
      "input[name='existingImages[]']"
    ).length;
    const newImages = imageInput.files.length;
    if (existingImages + newImages > 3) {
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
      const newImagesArray = [],
        existingCroppedImagesArray = [];
      previewImages.forEach((img) => {
        const imageDetails = {
          url: img.src,
          filename: img.dataset.filename || null,
        };
        if (!img.dataset.originalSrc) {
          newImagesArray.push(imageDetails);
        } else if (img.src !== img.dataset.originalSrc) {
          existingCroppedImagesArray.push(imageDetails);
        }
      });

      const filteredExistingImages = existingImagesArray.filter(
        (image) =>
          !existingCroppedImagesArray.some(
            (cropped) => cropped.url === image.url
          )
      );

      filteredExistingImages.forEach((image) =>
        formData.append("existingImages[]", JSON.stringify(image))
      );
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
      alertBox.classList.remove("d-none", "alert-warning");
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
