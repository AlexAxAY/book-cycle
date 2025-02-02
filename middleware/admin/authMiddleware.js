const checkAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  }

  return res.status(403).render("utils/errorPage", {
    statusCode: 403,
    message: "Unauthorized entry detected!",
  });
};

const preventAuth = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return res.redirect("/admin/products");
  }
  next();
};

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

module.exports = { checkAdmin, preventCache, preventAuth };
