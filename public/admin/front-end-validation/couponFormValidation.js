document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("productForm");
  const couponCodeInput = document.getElementById("coupon-code");
  const minOrderValueInput = document.getElementById("min-order-value");
  const discountInput = document.getElementById("discount");
  const discountTypeSelect = document.getElementById("discount_type");
  const descriptionInput = document.getElementById("description");
  const activeTrueInput = document.getElementById("active-true");
  const activeFalseInput = document.getElementById("active-false");

  const alertBad = document.querySelector(".alert-bad");
  const alertGood = document.querySelector(".alert-good");

  function showAlert(alertElement, message) {
    alertElement.textContent = message;
    alertElement.classList.remove("d-none");
    setTimeout(() => {
      alertElement.classList.add("d-none");
    }, 2000);
  }

  [
    couponCodeInput,
    minOrderValueInput,
    discountInput,
    discountTypeSelect,
    descriptionInput,
  ].forEach((element) => {
    element.addEventListener("input", () => {
      if (element.value.trim() !== "") {
        element.classList.remove("is-invalid");
      }
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    [
      couponCodeInput,
      minOrderValueInput,
      discountInput,
      discountTypeSelect,
      descriptionInput,
    ].forEach((el) => {
      el.classList.remove("is-invalid");
    });

    let hasError = false;

    if (couponCodeInput.value.trim() === "") {
      couponCodeInput.classList.add("is-invalid");
      hasError = true;
    }
    if (minOrderValueInput.value.trim() === "") {
      minOrderValueInput.classList.add("is-invalid");
      hasError = true;
    }
    if (discountInput.value.trim() === "") {
      discountInput.classList.add("is-invalid");
      hasError = true;
    }
    if (discountTypeSelect.value.trim() === "") {
      discountTypeSelect.classList.add("is-invalid");
      hasError = true;
    }
    if (descriptionInput.value.trim() === "") {
      descriptionInput.classList.add("is-invalid");
      hasError = true;
    }

    if (!activeTrueInput.checked && !activeFalseInput.checked) {
      showAlert(alertBad, "Please select Active status.");
      hasError = true;
    }

    if (hasError) {
      showAlert(alertBad, "Please fill all required fields.");
      return;
    }

    const payload = {
      coupon_code: couponCodeInput.value.trim(),
      min_order_value: Number(minOrderValueInput.value.trim()),
      discount_value: Number(discountInput.value.trim()),
      discount_type: discountTypeSelect.value.trim(),
      description: descriptionInput.value.trim(),
      active: activeTrueInput.checked ? true : false,
    };

    try {
      const response = await axios.post("/admin/add-coupon", payload);
      if (response.data.success) {
        showAlert(
          alertGood,
          response.data.message || "Coupon added successfully!"
        );
        form.reset();
      } else {
        showAlert(alertBad, response.data.message || "Something went wrong.");
      }
    } catch (error) {
      let errorMsg = "An error occurred. Please try again later.";
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMsg = error.response.data.message;
      }
      showAlert(alertBad, errorMsg);
    }
  });
});
