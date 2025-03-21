document.addEventListener("DOMContentLoaded", function () {
  const byNameRadio = document.getElementById("byName");
  const byCategoryRadio = document.getElementById("byCategory");
  const productSelectDiv = document.getElementById("productSelect");
  const categorySelectDiv = document.getElementById("categorySelect");
  const discountTypeSelect = document.getElementById("discountType");
  const discountValueInput = document.getElementById("discountValue");
  const offerForm = document.getElementById("offerForm");
  const alertBad = document.querySelector(".alert-bad");
  const alertGood = document.querySelector(".alert-good");

  function showFormAlert(alertElement, message) {
    alertElement.textContent = message;
    alertElement.classList.remove("d-none");
    setTimeout(() => {
      alertElement.classList.add("d-none");
    }, 3000);
  }

  function toggleSelection() {
    if (byNameRadio.checked) {
      productSelectDiv.style.display = "block";
      categorySelectDiv.style.display = "none";
    } else {
      productSelectDiv.style.display = "none";
      categorySelectDiv.style.display = "block";
    }
  }
  byNameRadio.addEventListener("change", toggleSelection);
  byCategoryRadio.addEventListener("change", toggleSelection);

  function validateDiscount() {
    const value = discountValueInput.value.trim();

    if (value === "") {
      showFormAlert(alertBad, "Discount value is required.");
      discountValueInput.classList.add("is-invalid");
      return false;
    }

    if (parseFloat(value) < 0) {
      showFormAlert(alertBad, "Discount value cannot be negative.");
      discountValueInput.classList.add("is-invalid");
      return false;
    }

    if (discountTypeSelect.value === "percentage" && parseFloat(value) > 90) {
      showFormAlert(alertBad, "Percentage discount cannot exceed 90%.");
      discountValueInput.classList.add("is-invalid");
      return false;
    }
    discountValueInput.classList.remove("is-invalid");
    return true;
  }

  discountValueInput.addEventListener("input", function () {
    if (discountValueInput.value.trim() !== "") {
      discountValueInput.classList.remove("is-invalid");
    }

    validateDiscount();
  });

  offerForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!validateDiscount()) return;

    const formData = {
      applyBy: document.querySelector('input[name="applyBy"]:checked').value,
      productName: document.getElementById("productName").value,
      category: document.getElementById("category").value,
      discountType: discountTypeSelect.value,
      discountValue: parseFloat(discountValueInput.value),
      action: document.querySelector('input[name="action"]:checked').value,
    };

    try {
      const response = await axios.post("/admin/add-offer", formData);
      const data = response.data;
      if (data.success) {
        showFormAlert(alertGood, data.message);
        offerForm.reset();
      } else {
        showFormAlert(alertBad, data.message);
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        showFormAlert(alertBad, error.response.data.message);
      } else {
        showFormAlert(alertBad, "An error occurred.");
      }
    }
  });
});
