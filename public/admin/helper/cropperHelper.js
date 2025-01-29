document.addEventListener("DOMContentLoaded", () => {
  let cropper; // Global reference to the Cropper instance
  const imageInput = document.getElementById("images");
  const imagePreviewsContainer = document.getElementById("image-previews");

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

          // Create an image element for preview
          const imgElement = document.createElement("img");
          imgElement.src = originalImageSrc;
          imgElement.classList.add("preview-image");
          imgElement.style.maxWidth = "100%";
          imgElement.style.maxHeight = "300px";
          previewContainer.appendChild(imgElement);

          // Store original image as a data attribute
          imgElement.setAttribute("data-original-src", originalImageSrc);

          // Create Crop button
          const cropButton = document.createElement("button");
          cropButton.textContent = "Crop";
          cropButton.classList.add("btn", "btn-primary", "crop-button");
          previewContainer.appendChild(cropButton);

          // Create Save button (hidden initially)
          const saveButton = document.createElement("button");
          saveButton.textContent = "Save";
          saveButton.classList.add(
            "btn",
            "btn-success",
            "save-button",
            "d-none"
          );
          previewContainer.appendChild(saveButton);

          // Create Edit button (hidden initially)
          const editButton = document.createElement("button");
          editButton.textContent = "Edit";
          editButton.classList.add(
            "btn",
            "btn-warning",
            "edit-button",
            "d-none"
          );
          previewContainer.appendChild(editButton);

          // Create Remove button
          const removeButton = document.createElement("button");
          removeButton.textContent = "Remove";
          removeButton.classList.add("btn", "btn-danger", "remove-button");
          previewContainer.appendChild(removeButton);

          // Append preview container to the image previews container
          imagePreviewsContainer.appendChild(previewContainer);

          // Crop button functionality
          cropButton.addEventListener("click", () => {
            // Destroy any existing Cropper instance
            if (cropper) cropper.destroy();

            // Initialize Cropper for the image preview
            cropper = new Cropper(imgElement, {
              aspectRatio: NaN,
              viewMode: 1,
              autoCropArea: 1,
              responsive: true,
            });

            // Hide Crop button, show Save button
            cropButton.classList.add("d-none");
            saveButton.classList.remove("d-none");
          });

          // Save button functionality to finalize cropping
          saveButton.addEventListener("click", () => {
            if (cropper) {
              const canvas = cropper.getCroppedCanvas({
                width: 300, // Desired width
                height: 450, // Desired height
              });

              // Replace the preview with the cropped image
              imgElement.src = canvas.toDataURL("image/jpeg");

              // Destroy the Cropper instance
              cropper.destroy();
              cropper = null;

              // Hide Save button, show Edit button
              saveButton.classList.add("d-none");
              editButton.classList.remove("d-none");
            }
          });

          // Edit button functionality to re-enable cropping with the original image
          editButton.addEventListener("click", () => {
            // Reset the image to the original
            imgElement.src = imgElement.getAttribute("data-original-src");

            // Initialize Cropper for the image again
            cropper = new Cropper(imgElement, {
              aspectRatio: NaN,
              viewMode: 1,
              autoCropArea: 1,
              responsive: true,
            });

            // Hide Edit button, show Save button
            editButton.classList.add("d-none");
            saveButton.classList.remove("d-none");
          });

          // Remove button functionality to remove the image
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
});
