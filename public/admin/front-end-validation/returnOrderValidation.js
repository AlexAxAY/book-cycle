document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".return-decision-form-inner").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const parentDiv = form.closest(".return-decision-form");
      const productId = parentDiv.dataset.productId;

      const decisionSelect = form.querySelector("select[name='decision']");
      const decision = decisionSelect.value;
      const reasonTextarea = form.querySelector(
        "textarea[name='adminMessage']"
      );
      const adminMessage = reasonTextarea.value.trim();

      if (!decision) {
        showAlert("Please select a decision", false);
        return;
      }
      if (!adminMessage) {
        showAlert("Please provide a reason", false);
        return;
      }

      const id = window.location.pathname.split("/").pop();

      const url = `/admin/order/return/${id}`;

      try {
        const response = await axios.post(url, {
          productId,
          decision,
          adminMessage,
        });

        if (response.data.success) {
          form.style.display = "none";
          const resultDiv = parentDiv.querySelector(".return-decision-result");
          resultDiv.style.display = "block";
          resultDiv.innerText = response.data.message;

          showAlert(response.data.message, true);
        } else {
          showAlert(
            response.data.message || "Failed to process the return decision.",
            false
          );
        }
      } catch (error) {
        showAlert(
          "An error occurred while processing the return decision.",
          false
        );
      }
    });
  });
});

function showAlert(message, isSuccess) {
  const alertBox = isSuccess
    ? document.querySelector(".alert-good")
    : document.querySelector(".alert-bad");

  alertBox.innerText = message;
  alertBox.classList.remove("d-none");

  setTimeout(() => {
    alertBox.classList.add("d-none");
  }, 3000);
}
