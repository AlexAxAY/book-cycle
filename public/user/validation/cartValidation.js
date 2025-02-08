const minus = document.querySelector(".minus");
const plus = document.querySelector(".plus");
const quantityInput = document.querySelector(".quantity-input");

function disabling() {
  if (parseInt(quantityInput.value) === 1) {
    minus.disabled = true;
  } else {
    minus.disabled = false;
  }
  if (parseInt(quantityInput.value) === 3) {
    plus.disabled = true;
  } else {
    plus.disabled = false;
  }
}

minus.addEventListener("click", (e) => {
  let currentValue = parseInt(quantityInput.value);
  if (currentValue > 1) {
    quantityInput.value = currentValue - 1;
  }
  disabling();
});

plus.addEventListener("click", () => {
  let currentValue = parseInt(quantityInput.value);
  if (currentValue < 3) {
    quantityInput.value = currentValue + 1;
  }
  disabling();
});

disabling();
