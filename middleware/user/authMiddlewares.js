const jwt = require("jsonwebtoken");

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

const ensureValidToken = (req, res, next) => {
  const { token } = req.body;
  if (!token) {
    return res.status(403).json({
      success: false,
      message: "Missing authentication token. Please register again.",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token. Please register again.",
      });
    }
    next();
  });
};

module.exports = { preventCache, preventAuthVisit, ensureValidToken };
