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
          const originalImageSrc = reader.result;

          const previewContainer = document.createElement("div");
          previewContainer.classList.add("image-preview-container");

          const imgElement = document.createElement("img");
          imgElement.src = originalImageSrc;
          imgElement.classList.add("preview-image");
          imgElement.style.maxWidth = "100%";
          imgElement.style.maxHeight = "300px";
          previewContainer.appendChild(imgElement);

          // Store original URL in dataset
          imgElement.setAttribute("data-original-src", originalImageSrc);
          imgElement.setAttribute("data-cropped-src", ""); // Initialize cropped URL

          // Hidden input for new images
          const hiddenInput = document.createElement("input");
          hiddenInput.type = "hidden";
          hiddenInput.name = "newImages[]";
          hiddenInput.value = JSON.stringify({
            original_url: originalImageSrc,
            cropped_url: null,
            filename: `${Date.now()}_${file.name}`, // Unique filename
          });
          previewContainer.appendChild(hiddenInput);

          // Buttons for new images
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

          const removeButton = document.createElement("button");
          removeButton.textContent = "Remove";
          removeButton.classList.add("btn", "btn-danger", "remove-button");
          previewContainer.appendChild(removeButton);

          const editButton = document.createElement("button");
          editButton.textContent = "Edit";
          editButton.classList.add(
            "btn",
            "btn-warning",
            "edit-button",
            "d-none"
          );
          previewContainer.appendChild(editButton);

          imagePreviewsContainer.appendChild(previewContainer);

          // Crop button handler for new images
          cropButton.addEventListener("click", (event) => {
            event.preventDefault();
            if (cropper) cropper.destroy();

            // Initialize cropper with the original image URL
            cropper = new Cropper(imgElement, {
              aspectRatio: 2 / 3,
              viewMode: 1,
              autoCropArea: 1,
              responsive: true,
            });

            cropButton.classList.add("d-none");
            saveButton.classList.remove("d-none");
            editButton.classList.remove("d-none");
          });

          // Save button handler for new images
          saveButton.addEventListener("click", (event) => {
            event.preventDefault();
            if (cropper) {
              try {
                const canvas = cropper.getCroppedCanvas({
                  width: 300,
                  height: 450,
                });
                if (!canvas) throw new Error("Canvas creation failed");

                // Update image source and cropped URL
                imgElement.src = canvas.toDataURL("image/jpeg");
                imgElement.setAttribute("data-cropped-src", imgElement.src);

                // Update hidden input
                const hiddenInput = previewContainer.querySelector(
                  'input[name="newImages[]"]'
                );
                const imageData = JSON.parse(hiddenInput.value);
                imageData.cropped_url = imgElement.src;
                hiddenInput.value = JSON.stringify(imageData);
              } catch (err) {
                console.error("Cropping failed:", err);
                alert("Failed to save cropped image");
              } finally {
                cropper.destroy();
                cropper = null;
              }
            }
          });

          // Remove button handler for new images
          removeButton.addEventListener("click", (event) => {
            event.preventDefault();
            previewContainer.remove();

            // Reset input if no new images remain
            const remainingFiles = Array.from(
              imagePreviewsContainer.children
            ).filter((container) =>
              container.querySelector('input[name="newImages[]"]')
            ).length;

            if (remainingFiles === 0) {
              imageInput.value = "";
            }

            if (cropper) {
              cropper.destroy();
              cropper = null;
            }
          });

          // Edit button handler for new images
          editButton.addEventListener("click", (event) => {
            event.preventDefault();
            if (cropper) {
              cropper.destroy();
              cropper = null;
            }

            // Revert to original image
            imgElement.src = imgElement.dataset.originalSrc;
            imgElement.setAttribute("data-cropped-src", "");

            // Update hidden input
            const hiddenInput = previewContainer.querySelector(
              'input[name="newImages[]"]'
            );
            const imageData = JSON.parse(hiddenInput.value);
            imageData.cropped_url = null;
            hiddenInput.value = JSON.stringify(imageData);

            // Reset UI state
            cropButton.classList.remove("d-none");
            saveButton.classList.add("d-none");
            editButton.classList.add("d-none");
          });
        };
        reader.readAsDataURL(file);
      });
    }
  });

  // Event delegation for existing images
  imagePreviewsContainer.addEventListener("click", (event) => {
    event.preventDefault();
    const target = event.target;
    const container = target.closest(".image-preview-container");

    // Crop button handler for existing images
    if (target.classList.contains("crop-button") && container) {
      const imgElement = container.querySelector("img");
      const saveButton = container.querySelector(".save-button");
      const editButton = container.querySelector(".edit-button");

      if (cropper) cropper.destroy();

      // Initialize cropper with the original image URL
      cropper = new Cropper(imgElement, {
        aspectRatio: 2 / 3,
        viewMode: 1,
        autoCropArea: 1,
        responsive: true,
      });

      target.classList.add("d-none");
      saveButton.classList.remove("d-none");
      editButton.classList.remove("d-none");
    }

    // Save button handler for existing images
    if (target.classList.contains("save-button") && container) {
      const imgElement = container.querySelector("img");
      const cropButton = container.querySelector(".crop-button");
      const editButton = container.querySelector(".edit-button");
      const hiddenInput = container.querySelector(
        'input[name="existingImages[]"]'
      );

      try {
        if (cropper) {
          const canvas = cropper.getCroppedCanvas({
            width: 300,
            height: 450,
          });

          if (canvas) {
            // Update image source and cropped URL
            imgElement.src = canvas.toDataURL("image/jpeg");
            imgElement.setAttribute("data-cropped-src", imgElement.src);

            // Update hidden input
            const existingData = JSON.parse(hiddenInput.value);
            existingData.cropped_url = imgElement.src;
            hiddenInput.value = JSON.stringify(existingData);
          }
        }
      } catch (err) {
        console.error("Save failed:", err);
        alert("Failed to save cropped image");
      } finally {
        if (cropper) {
          cropper.destroy();
          cropper = null;
        }
        target.classList.add("d-none");
        cropButton.classList.remove("d-none");
        editButton.classList.add("d-none");
      }
    }

    // Edit button handler for existing images
    if (target.classList.contains("edit-button") && container) {
      const imgElement = container.querySelector("img");
      const cropButton = container.querySelector(".crop-button");
      const saveButton = container.querySelector(".save-button");
      const hiddenInput = container.querySelector(
        'input[name="existingImages[]"]'
      );

      // Revert to original image
      imgElement.src = imgElement.dataset.originalSrc;
      imgElement.setAttribute("data-cropped-src", "");

      // Clear cropped_url in hidden input
      const existingData = JSON.parse(hiddenInput.value);
      existingData.cropped_url = null;
      hiddenInput.value = JSON.stringify(existingData);

      // Reset UI state
      target.classList.add("d-none");
      cropButton.classList.remove("d-none");
      saveButton.classList.add("d-none");

      // Cleanup cropper
      if (cropper) {
        cropper.destroy();
        cropper = null;
      }
    }

    // Remove button handler for existing images
    if (target.classList.contains("remove-button") && container) {
      container.remove();
      if (cropper) {
        cropper.destroy();
        cropper = null;
      }
    }
  });
});
