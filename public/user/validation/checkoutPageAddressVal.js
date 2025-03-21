document.addEventListener("DOMContentLoaded", function () {
  const addressForm = document.querySelector("#addressForm form");

  addressForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    hideAlert(".alert-bad");
    hideAlert(".alert-good");

    const name = document.getElementById("name");
    const addressLine = document.getElementById("addressLine");
    const landmark = document.getElementById("landmark");
    const city = document.getElementById("city");
    const state = document.getElementById("state");
    const pincode = document.getElementById("pincode");
    const phone = document.getElementById("phone");
    const altPhone = document.getElementById("altPhone");
    const addressType = document.querySelector(
      'input[name="addressType"]:checked'
    );

    if (
      !name.value.trim() ||
      !addressLine.value.trim() ||
      !city.value.trim() ||
      !state.value.trim() ||
      !pincode.value.trim() ||
      !phone.value.trim() ||
      !addressType
    ) {
      showAlert(".alert-bad", "Please fill in all required fields.");
      validateFields([name, addressLine, city, state, pincode, phone]);
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.value.trim())) {
      showAlert(".alert-bad", "Please enter a valid 10-digit phone number.");
      phone.classList.add("is-invalid");
      return;
    }

    if (altPhone.value.trim() && !phoneRegex.test(altPhone.value.trim())) {
      showAlert(
        ".alert-bad",
        "Alternate phone number must be a valid 10-digit number."
      );
      altPhone.classList.add("is-invalid");
      return;
    }

    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode.value.trim())) {
      showAlert(".alert-bad", "Please enter a valid 6-digit pincode.");
      pincode.classList.add("is-invalid");
      return;
    }

    const data = {
      name: name.value.trim(),
      address_line: addressLine.value.trim(),
      landmark: landmark.value.trim(),
      city: city.value.trim(),
      state: state.value.trim(),
      pincode: pincode.value.trim(),
      phone: phone.value.trim(),
      alt_phone: altPhone.value.trim(),
      address_type: addressType ? addressType.value : "",
    };

    try {
      const response = await axios.post("/user/checkout/address", data);

      if (response.data.success) {
        addressForm.reset();
        resetValidation([
          name,
          addressLine,
          landmark,
          city,
          state,
          pincode,
          phone,
          altPhone,
        ]);
        window.location.reload();
      } else {
        showAlert(".alert-bad", response.data.message);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "An error occurred. Please try again.";
      showAlert(".alert-bad", errorMessage);
    }
  });

  function showAlert(selector, message) {
    const alertEl = document.querySelector(selector);
    alertEl.textContent = message;
    alertEl.classList.remove("d-none");
    setTimeout(() => {
      alertEl.classList.add("d-none");
    }, 1000);
  }

  document
    .querySelectorAll(
      "#addressForm input, #addressForm textarea, #addressForm select"
    )
    .forEach((input) => {
      input.addEventListener("input", function () {
        this.classList.toggle("is-invalid", !this.value.trim());
        this.classList.toggle("is-valid", !!this.value.trim());
      });
    });

  function hideAlert(selector) {
    const el = document.querySelector(selector);
    if (el) {
      el.classList.add("d-none");
    }
  }

  function validateFields(fields) {
    fields.forEach((field) => {
      if (!field.value.trim()) {
        field.classList.add("is-invalid");
      }
    });
  }

  function resetValidation(fields) {
    fields.forEach((field) => {
      field.classList.remove("is-invalid", "is-valid");
    });
  }
});
