const preventCache = (req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, private"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
};

const preventAuthVisit = (req, res, next) => {
  if (req.user && req.user.isVerified) {
    return res.redirect("/user/home");
  }
  next();
};

module.exports = { preventCache, preventAuthVisit };
