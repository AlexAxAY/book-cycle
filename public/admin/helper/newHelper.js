document.addEventListener("DOMContentLoaded", () => {
  let cropper; // Global reference to the Cropper instance
  const imageInput = document.getElementById("images");
  const imagePreviewsContainer = document.getElementById("image-previews");

  // Handle image selection and previewing for new images
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

          // Create Remove button
          const removeButton = document.createElement("button");
          removeButton.textContent = "Remove";
          removeButton.classList.add("btn", "btn-danger", "remove-button");
          previewContainer.appendChild(removeButton);

          // Append preview container to the image previews container
          imagePreviewsContainer.appendChild(previewContainer);

          // Crop button functionality for new images
          cropButton.addEventListener("click", (event) => {
            event.preventDefault();
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
          saveButton.addEventListener("click", (event) => {
            event.preventDefault();
            if (cropper) {
              const canvas = cropper.getCroppedCanvas({
                width: 300, // Desired width
                height: 450, // Desired height
              });

              // Check if canvas exists
              if (!canvas) {
                console.error("Canvas not created for cropping");
                return;
              }

              // Replace the preview with the cropped image
              imgElement.src = canvas.toDataURL("image/jpeg");

              // Destroy the Cropper instance
              cropper.destroy();
              cropper = null;

              // Remove the onload event listener to prevent reinitialization
              imgElement.onload = null;

              // Hide Save button, show Crop button
              saveButton.classList.add("d-none");
              cropButton.classList.remove("d-none");
            }
          });

          // Remove button functionality to remove the image
          removeButton.addEventListener("click", (event) => {
            event.preventDefault();
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

  // Event delegation for existing image previews
  imagePreviewsContainer.addEventListener("click", (event) => {
    event.preventDefault();
    const target = event.target;

    // Handle Crop button click for existing images
    if (target.classList.contains("crop-button")) {
      const imgElement = target
        .closest(".image-preview-container")
        .querySelector("img");

      // Check if imgElement exists
      if (!imgElement) {
        console.error("Image element not found for cropping");
        return;
      }

      // Ensure image is loaded before initializing cropper
      imgElement.onload = () => {
        // Destroy any existing Cropper instance
        if (cropper) cropper.destroy();

        // Initialize Cropper for the existing image preview
        cropper = new Cropper(imgElement, {
          aspectRatio: NaN,
          viewMode: 1,
          autoCropArea: 1,
          responsive: true,
        });

        // Toggle Crop and Save button visibility
        target.classList.add("d-none");
        const saveButton = target
          .closest(".image-preview-container")
          .querySelector(".save-button");
        saveButton.classList.remove("d-none");
      };

      // Trigger image load if it's already cached
      if (imgElement.complete) {
        imgElement.onload();
      }
    }

    // Handle Save button click for existing images
    if (target.classList.contains("save-button")) {
      const imgElement = target
        .closest(".image-preview-container")
        .querySelector("img");

      // Check if imgElement exists
      if (!imgElement) {
        console.error("Image element not found for saving");
        return;
      }

      if (cropper) {
        const canvas = cropper.getCroppedCanvas({
          width: 300, // Desired width
          height: 450, // Desired height
        });

        // Check if canvas exists
        if (!canvas) {
          console.error("Canvas not created for cropping");
          return;
        }

        // Replace the preview with the cropped image
        imgElement.src = canvas.toDataURL("image/jpeg");

        // Destroy the Cropper instance
        cropper.destroy();
        cropper = null;

        // Remove the onload event listener to prevent reinitialization
        imgElement.onload = null;

        // Hide Save button and show Crop button
        target.classList.add("d-none");
        const cropButton = target
          .closest(".image-preview-container")
          .querySelector(".crop-button");
        cropButton.classList.remove("d-none");
      }
    }

    // Handle Remove button click for existing images
    if (target.classList.contains("remove-button")) {
      const container = target.closest(".image-preview-container");
      container.remove(); // Remove the image preview container
    }
  });
});
