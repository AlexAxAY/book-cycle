document
  .getElementById("toggleAddressForm")
  .addEventListener("click", function () {
    let form = document.getElementById("addressForm");
    if (form.style.display === "none" || form.style.display === "") {
      form.style.display = "block";
    } else {
      form.style.display = "none";
    }
  });
