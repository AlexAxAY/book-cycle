module.exports = (req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://code.jquery.com https://checkout.razorpay.com"
  );
  next();
};
