const customMiddleware = (req, res, next) => {
  if (req.session.user) {
    req.user = req.session.user;
    res.locals.user = req.user;
  } else {
    res.locals.user = null;
  }
  res.locals.currentURL = req.originalUrl;

  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");

  next();
};

const setHeaderMiddleware = (req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://code.jquery.com https://checkout.razorpay.com"
  );
  next();
};

module.exports = { customMiddleware, setHeaderMiddleware };
