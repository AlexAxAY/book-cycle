document
  .getElementById("retryPaymentBtn")
  .addEventListener("click", async function () {
    const orderId = document.getElementById("orderId").value;
    const walletAppliedAmount = localStorage.getItem("w");
    try {
      const response = await axios.post("/user/retry-payment", {
        orderId,
        walletAppliedAmount,
      });
      if (response.data.razorpay) {
        const options = {
          key: response.data.key,
          amount: response.data.amount,
          currency: "INR",
          name: "Book Cycle",
          description: "Retry Order Payment",
          order_id: response.data.razorpayOrderId,
          handler: async function (paymentResponse) {
            try {
              await axios.post("/user/verify-payment", {
                orderId: response.data.orderId,
                paymentId: paymentResponse.razorpay_payment_id,
                orderIdRazor: paymentResponse.razorpay_order_id,
                signature: paymentResponse.razorpay_signature,
              });
              showAlert(".alert-good", "Payment successful!");
              setTimeout(() => {
                window.location.replace(`/user/order/${response.data.orderId}`);
              }, 500);
            } catch (err) {
              showAlert(
                ".alert-bad",
                "Payment verification failed. Please try again."
              );
            }
          },
          prefill: { name: "", email: "", contact: "" },
          theme: { color: "#3399cc" },
        };
        const rzp = new Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      showAlert(
        ".alert-bad",
        "An error occurred while retrying payment. Please try again later."
      );
    }
  });

function showAlert(selector, message) {
  const alertEl = document.querySelector(selector);
  if (alertEl) {
    alertEl.textContent = message;
    alertEl.classList.remove("d-none");
    setTimeout(() => {
      alertEl.classList.add("d-none");
    }, 3000);
  }
}
