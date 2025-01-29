document.addEventListener("DOMContentLoaded", () => {
  let cropper; // Global reference to the Cropper instance
  const imageInput = document.getElementById("images");
  const imagePreviewsContainer = document.getElementById("image-previews");
  const form = document.getElementById("productForm"); // Assuming you have a form element

  // Handle image selection and previewing
  imageInput.addEventListener("change", (event) => {
    const files = event.target.files;
    if (files.length) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const originalImageSrc = reader.result; // Save original image data

          const previewContainer = document.createElement("div");
          previewContainer.classList.add("image-preview-container");

          const imgElement = document.createElement("img");
          imgElement.src = originalImageSrc;
          imgElement.classList.add("preview-image");
          imgElement.style.maxWidth = "100%";
          imgElement.style.maxHeight = "300px";
          previewContainer.appendChild(imgElement);

          imgElement.setAttribute("data-original-src", originalImageSrc);

          const croppedInput = document.createElement("input");
          croppedInput.type = "hidden";
          croppedInput.name = "cropped_images";
          croppedInput.classList.add("cropped-image-input");
          previewContainer.appendChild(croppedInput);

          const cropButton = document.createElement("button");
          cropButton.textContent = "Crop";
          cropButton.classList.add("btn", "btn-primary", "crop-button");
          previewContainer.appendChild(cropButton);

          const saveButton = document.createElement("button");
          saveButton.textContent = "Save";
          saveButton.classList.add(
            "btn",
            "btn-success",
            "save-button",
            "d-none"
          );
          previewContainer.appendChild(saveButton);

          const editButton = document.createElement("button");
          editButton.textContent = "Edit";
          editButton.classList.add(
            "btn",
            "btn-warning",
            "edit-button",
            "d-none"
          );
          previewContainer.appendChild(editButton);

          const removeButton = document.createElement("button");
          removeButton.textContent = "Remove";
          removeButton.classList.add("btn", "btn-danger", "remove-button");
          previewContainer.appendChild(removeButton);

          imagePreviewsContainer.appendChild(previewContainer);

          cropButton.addEventListener("click", (event) => {
            event.preventDefault();
            if (cropper) cropper.destroy();
            cropper = new Cropper(imgElement, {
              aspectRatio: NaN,
              viewMode: 1,
              autoCropArea: 1,
              responsive: true,
            });

            cropButton.classList.add("d-none");
            saveButton.classList.remove("d-none");
          });

          saveButton.addEventListener("click", (event) => {
            event.preventDefault();
            if (cropper) {
              const canvas = cropper.getCroppedCanvas({
                width: 300,
                height: 450,
              });

              imgElement.src = canvas.toDataURL("image/jpeg");

              croppedInput.value = imgElement.src;

              cropper.destroy();
              cropper = null;

              saveButton.classList.add("d-none");
              editButton.classList.remove("d-none");

              // Enable the form submission after image is cropped
              form.querySelector('button[type="submit"]').disabled = false;
            }
          });

          editButton.addEventListener("click", (e) => {
            e.preventDefault();
            imgElement.src = imgElement.getAttribute("data-original-src");
            cropper = new Cropper(imgElement, {
              aspectRatio: NaN,
              viewMode: 1,
              autoCropArea: 1,
              responsive: true,
            });

            editButton.classList.add("d-none");
            saveButton.classList.remove("d-none");
          });

          removeButton.addEventListener("click", () => {
            previewContainer.remove();
            if (cropper) {
              cropper.destroy();
              cropper = null;
            }
          });
        };

        reader.readAsDataURL(file);
      });
    }
  });

  // Prevent form submission if the cropped images are not populated
  form.addEventListener("submit", (event) => {
    // Check if the user has either uploaded an image or cropped one
    const croppedImagesInput = form.querySelector(
      "input[name='cropped_images']"
    );
    if (
      croppedImagesInput &&
      !croppedImagesInput.value &&
      !imageInput.files.length
    ) {
      return;
    }
  });
});
