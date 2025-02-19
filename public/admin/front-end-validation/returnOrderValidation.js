document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".return-decision-form-inner").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const parentDiv = form.closest(".return-decision-form");
      const productId = parentDiv.dataset.productId;

      // Get the decision and reason from the form
      const decisionSelect = form.querySelector("select[name='decision']");
      const decision = decisionSelect.value;
      const reasonTextarea = form.querySelector(
        "textarea[name='adminMessage']"
      );
      const adminMessage = reasonTextarea.value.trim();

      // Validate inputs
      if (!decision) {
        showAlert("Please select a decision", false);
        return;
      }
      if (!adminMessage) {
        showAlert("Please provide a reason", false);
        return;
      }

      // Extract order id from URL (adjust if necessary)
      const id = window.location.pathname.split("/").pop();

      // Construct the endpoint URL
      const url = `/admin/order/return/${id}`;

      try {
        const response = await axios.post(url, {
          productId,
          decision,
          adminMessage,
        });

        if (response.data.success) {
          // Hide the form and show the result message
          form.style.display = "none";
          const resultDiv = parentDiv.querySelector(".return-decision-result");
          resultDiv.style.display = "block";
          resultDiv.innerText = response.data.message;

          // Show success alert
          showAlert(response.data.message, true);
        } else {
          showAlert(
            response.data.message || "Failed to process the return decision.",
            false
          );
        }
      } catch (error) {
        console.error("Error processing return decision:", error);
        showAlert(
          "An error occurred while processing the return decision.",
          false
        );
      }
    });
  });
});

// Function to show custom alerts
function showAlert(message, isSuccess) {
  const alertBox = isSuccess
    ? document.querySelector(".alert-good")
    : document.querySelector(".alert-bad");

  alertBox.innerText = message;
  alertBox.classList.remove("d-none");

  // Auto-hide alert after 3 seconds
  setTimeout(() => {
    alertBox.classList.add("d-none");
  }, 3000);
}
