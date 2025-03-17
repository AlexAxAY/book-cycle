document.addEventListener("DOMContentLoaded", function () {
  const addressForm = document.getElementById("addressForm");

  addressForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    hideAlert(".alert-bad");
    hideAlert(".alert-good");

    const name = document.getElementById("name");
    const id = window.location.pathname.split("/").pop();
    const phone = document.getElementById("phone");
    const addressLine = document.getElementById("addressLine");
    const landmark = document.getElementById("landmark");
    const altPhone = document.getElementById("altPhone");
    const city = document.getElementById("city");
    const state = document.getElementById("state");
    const pincode = document.getElementById("pincode");
    const addressType = document.querySelector(
      'input[name="addressType"]:checked'
    );

    if (
      !name.value.trim() ||
      !phone.value.trim() ||
      !addressLine.value.trim() ||
      !city.value.trim() ||
      !state.value.trim() ||
      !pincode.value.trim()
    ) {
      showAlert(".alert-bad", "Please fill in all required fields.");
      validateFields([name, phone, addressLine, city, state, pincode]);
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
      phone: phone.value.trim(),
      address_line: addressLine.value.trim(),
      landmark: landmark.value.trim(),
      alt_phone: altPhone.value.trim(),
      city: city.value.trim(),
      state: state.value.trim(),
      pincode: pincode.value.trim(),
      address_type: addressType ? addressType.value : "",
    };

    try {
      const response = await axios.put(`/user/checkout/address/${id}`, data);

      if (response.data.success) {
        showAlert(".alert-good", response.data.message);

        resetValidation([
          name,
          phone,
          landmark,
          addressLine,
          city,
          state,
          pincode,
          altPhone,
        ]);
        setTimeout(() => {
          window.location.href = "/user/checkout";
        }, 1000);
      } else {
        showAlert(".alert-bad", response.data.message);
      }
    } catch (error) {
      showAlert(
        ".alert-bad",
        error.response.data.message || "An error occurred. Please try again."
      );
    }
  });

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

  document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", function () {
      if (this.value.trim()) {
        this.classList.remove("is-invalid");
        this.classList.add("is-valid");
      } else {
        this.classList.remove("is-valid");
        this.classList.add("is-invalid");
      }
    });
  });

  function showAlert(selector, message) {
    const alertEl = document.querySelector(selector);
    alertEl.textContent = message;
    alertEl.classList.remove("d-none");

    setTimeout(() => {
      alertEl.classList.add("d-none");
    }, 3000);
  }

  function hideAlert(selector) {
    document.querySelector(selector).classList.add("d-none");
  }
});
