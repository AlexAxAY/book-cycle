document.addEventListener("DOMContentLoaded", () => {
  const showAddMoneyBtn = document.getElementById("showAddMoneyBtn");
  const addMoneyForm = document.getElementById("addMoneyForm");
  const confirmAddMoneyBtn = document.getElementById("confirmAddMoneyBtn");
  const alertGood = document.querySelector(".alert-good");
  const alertBad = document.querySelector(".alert-bad");

  function showMoneyAlert(element, message) {
    element.textContent = message;
    element.classList.remove("d-none");
    setTimeout(() => {
      element.classList.add("d-none");
    }, 3000);
  }

  showAddMoneyBtn.addEventListener("click", () => {
    addMoneyForm.classList.toggle("d-none");
  });

  confirmAddMoneyBtn.addEventListener("click", async () => {
    const amountInput = document.getElementById("amountInput");
    const amount = amountInput.value;
    if (!amount || Number(amount) <= 0) {
      showMoneyAlert(alertBad, "Enter a valid amount");
      return;
    }
    try {
      const response = await axios.post("/user/wallet", { amount });
      if (response.data.success) {
        const order = response.data.order;

        const options = {
          key: response.data.razorpayKey,
          amount: order.amount,
          currency: order.currency,
          name: "Book cycle",
          description: "Add Money to Wallet",
          order_id: order.id,
          handler: async function (paymentResponse) {
            try {
              const verifyResponse = await axios.post(
                "/user/wallet/verify-payment",
                {
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                  amount: amount,
                }
              );
              if (verifyResponse.data.success) {
                showMoneyAlert(alertGood, "Money added successfully!");
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              } else {
                showMoneyAlert(
                  alertBad,
                  "Payment verification failed. Please try again."
                );
              }
            } catch (err) {
              console.error(err);
              showMoneyAlert(alertBad, "Error during payment verification");
            }
          },
          prefill: {
            name: "",
            email: "",
          },
          theme: {
            color: "#3399cc",
          },
        };

        const rzp = new Razorpay(options);
        rzp.open();
      } else {
        showMoneyAlert(alertBad, "Failed to create payment order");
      }
    } catch (err) {
      showMoneyAlert(alertBad, "Error processing your request");
    }
  });
});
