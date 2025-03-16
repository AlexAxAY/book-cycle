function invalidURL(req, res, next) {
  const error = new Error("Page not found");
  error.statusCode = 404;
  next(error);
}

function errorHandler(err, req, res, next) {
  if (err.name === "CastError") {
    err.statusCode = 400;
    err.message = "Invalid identifier provided";
  }
  const statusCode = err.statusCode || 500;

  if (req.accepts("html")) {
    const template = req.originalUrl.startsWith("/admin")
      ? "utils/errorPage"
      : "utils/userErrorPage";
    return res.status(statusCode).render(template, {
      statusCode,
      message: err.message || "Server Error",
    });
  } else {
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
}

module.exports = { invalidURL, errorHandler };
