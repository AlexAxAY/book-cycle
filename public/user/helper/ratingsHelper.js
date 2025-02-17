let currentRating = 0;

const productRatingEl = document.getElementById("productRating");
if (productRatingEl) {
  const initialRating =
    parseInt(productRatingEl.getAttribute("data-rating"), 10) || 0;
  currentRating = initialRating;
}

const stars = document.querySelectorAll("#productRating i");
stars.forEach((star) => {
  star.addEventListener("click", function () {
    const selectedRating = parseInt(this.getAttribute("data-rating"), 10);
    currentRating = selectedRating;
    stars.forEach((s) => {
      s.classList.toggle(
        "selected",
        parseInt(s.getAttribute("data-rating"), 10) <= selectedRating
      );
    });
  });
});

document.getElementById("submitReview").addEventListener("click", () => {
  const reviewText = document.getElementById("reviewText").value;
  const rating = currentRating;
  const productId = document
    .querySelector("#productRating")
    .getAttribute("data-product-id");

  axios
    .post(`/user/review/${productId}`, { rating, description: reviewText })
    .then((response) => {
      const alertGood = document.querySelector(".alert-good");
      alertGood.innerText = response.data.message;
      alertGood.classList.remove("d-none");

      setTimeout(() => {
        alertGood.classList.add("d-none");
        window.location.href = "/user/orders";
      }, 2000);
    })
    .catch((error) => {
      const alertBad = document.querySelector(".alert-bad");
      alertBad.innerText =
        (error.response && error.response.data.message) ||
        "Something went wrong.";
      alertBad.classList.remove("d-none");

      setTimeout(() => {
        alertBad.classList.add("d-none");
      }, 3000);
    });
});
