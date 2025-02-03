const filterSection = document.getElementById("filterSection");
const filterButton = document.querySelector(".filter-btn");

filterButton.addEventListener("click", (e) => {
  e.preventDefault();
  filterSection.classList.toggle("d-none");
});
