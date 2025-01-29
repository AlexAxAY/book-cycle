document.getElementById("dlt-button").addEventListener("click", async (e) => {
  const alert = document.getElementById("alert");
  try {
    const id = window.location.pathname.split("/").pop();
    console.log(id);
    const response = await axios.delete(`/admin/product/${id}`);

    if (response.data.success) {
      alert.innerText = response.data.message;
      alert.classList.remove("d-none", "alert-danger");
      alert.classList.add("alert-success");

      setTimeout(() => {
        alert.classList.add("d-none");
        window.location.href = "/admin/products";
      }, 2000);
    }
  } catch (err) {
    const errorMessage = err.response
      ? err.response.data.message
      : "Something went wrong while removing!";
    alert.innerText = errorMessage;

    alert.classList.remove("d-none", "alert-success");
    alert.classList.add("alert-danger");

    setTimeout(() => {
      alert.classList.add("d-none");
    }, 2000);
  }
});
