document.addEventListener("DOMContentLoaded", function () {
  const addressForm = document.getElementById("addressForm");

  addressForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    hideAlert(".alert-bad");
    hideAlert(".alert-good");

    const name = document.getElementById("name");
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

    // Validate required fields (landmark & alternate phone are optional)
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

    // Validate phone number (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.value.trim())) {
      showAlert(".alert-bad", "Please enter a valid 10-digit phone number.");
      phone.classList.add("is-invalid");
      return;
    }

    // Validate alternate phone number (if provided, must be 10 digits)
    if (altPhone.value.trim() && !phoneRegex.test(altPhone.value.trim())) {
      showAlert(
        ".alert-bad",
        "Alternate phone number must be a valid 10-digit number."
      );
      altPhone.classList.add("is-invalid");
      return;
    }

    // Validate pincode (6 digits)
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode.value.trim())) {
      showAlert(".alert-bad", "Please enter a valid 6-digit pincode.");
      pincode.classList.add("is-invalid");
      return;
    }

    // Prepare data for submission
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
      const response = await axios.post("/user/manage-address", data);

      if (response.data.success) {
        showAlert(".alert-good", response.data.message);
        addressForm.reset();
        resetValidation([
          name,
          landmark,
          phone,
          addressLine,
          city,
          state,
          pincode,
          altPhone,
        ]);
      } else {
        showAlert(".alert-bad", response.data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert(".alert-bad", "An error occurred. Please try again.");
    }
  });

  // Function to validate empty fields
  function validateFields(fields) {
    fields.forEach((field) => {
      if (!field.value.trim()) {
        field.classList.add("is-invalid");
      }
    });
  }

  // Function to reset validation styles
  function resetValidation(fields) {
    fields.forEach((field) => {
      field.classList.remove("is-invalid", "is-valid");
    });
  }

  // Add event listeners for real-time validation
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

  // Utility function to show alert messages
  function showAlert(selector, message) {
    const alertEl = document.querySelector(selector);
    alertEl.textContent = message;
    alertEl.classList.remove("d-none");

    setTimeout(() => {
      alertEl.classList.add("d-none");
    }, 3000);
  }

  // Utility function to hide alert messages
  function hideAlert(selector) {
    document.querySelector(selector).classList.add("d-none");
  }
});
