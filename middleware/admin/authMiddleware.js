const checkAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  }

  return res.status(403).render("utils/errorPage", {
    statusCode: 403,
    message: "Unauthorized entry detected!",
  });
};

module.exports = { checkAdmin };
