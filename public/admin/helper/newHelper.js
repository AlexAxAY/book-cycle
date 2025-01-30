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

          imgElement.setAttribute("data-original-src", originalImageSrc);

          // When creating new images:
          const hiddenInput = document.createElement("input");
          hiddenInput.type = "hidden";
          hiddenInput.name = "newImages[]";
          hiddenInput.value = JSON.stringify({
            original_url: originalImageSrc,
            cropped_url: null,
            filename: `${Date.now()}_${file.name}`, // Unique filename
          });
          previewContainer.appendChild(hiddenInput);

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

          // New image crop handler
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
            editButton.classList.remove("d-none");
          });

          saveButton.addEventListener("click", (event) => {
            event.preventDefault();
            if (cropper) {
              try {
                const canvas = cropper.getCroppedCanvas({
                  width: 300,
                  height: 450,
                });
                if (!canvas) throw new Error("Canvas creation failed");

                imgElement.src = canvas.toDataURL("image/jpeg");

                const hiddenInput = previewContainer.querySelector(
                  'input[name="newImages[]"]'
                );

                // Update hidden input
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

          removeButton.addEventListener("click", (event) => {
            event.preventDefault();
            previewContainer.remove();

            // Get remaining files
            const remainingFiles = Array.from(
              imagePreviewsContainer.children
            ).filter((container) =>
              container.querySelector('input[name="newImages[]"]')
            ).length;

            // Reset input only if no new images remain
            if (remainingFiles === 0) {
              imageInput.value = "";
            }

            if (cropper) {
              cropper.destroy();
              cropper = null;
            }
          });

          editButton.addEventListener("click", (event) => {
            event.preventDefault();
            if (cropper) {
              cropper.destroy();
              cropper = null;
            }

            if (imgElement.dataset.originalSrc) {
              imgElement.src = imgElement.dataset.originalSrc;
            }

            // Update hidden input
            const hiddenInput = previewContainer.querySelector(
              'input[name="newImages[]"]'
            );
            const imageData = JSON.parse(hiddenInput.value);
            imageData.cropped_url = null;
            hiddenInput.value = JSON.stringify(imageData);

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

    // Crop button handler
    if (target.classList.contains("crop-button") && container) {
      const imgElement = container.querySelector("img");
      const saveButton = container.querySelector(".save-button");
      const editButton = container.querySelector(".edit-button");

      if (cropper) cropper.destroy();

      cropper = new Cropper(imgElement, {
        aspectRatio: NaN,
        viewMode: 1,
        autoCropArea: 1,
        responsive: true,
      });

      target.classList.add("d-none");
      saveButton.classList.remove("d-none");
      editButton.classList.remove("d-none");
    }

    // Save button handler
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
            imgElement.src = canvas.toDataURL("image/jpeg");

            // Update hidden input
            const existingData = JSON.parse(hiddenInput.value);
            existingData.cropped_url = imgElement.src;

            if (!existingData.original_url) {
              existingData.original_url = imgElement.dataset.originalSrc;
            }

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

    // Edit button handler
    if (target.classList.contains("edit-button") && container) {
      const imgElement = container.querySelector("img");
      const cropButton = container.querySelector(".crop-button");
      const saveButton = container.querySelector(".save-button");
      const hiddenInput = container.querySelector(
        'input[name="existingImages[]"]'
      );

      // Revert to original image
      imgElement.src = imgElement.dataset.originalSrc;

      // Clear cropped_url in hidden input
      const existingData = JSON.parse(hiddenInput.value);
      existingData.cropped_url = null; // Explicit null assignment
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

    // Remove button handler
    if (target.classList.contains("remove-button") && container) {
      container.remove();
      if (cropper) {
        cropper.destroy();
        cropper = null;
      }
    }
  });
});
