export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  let status = 500;
  let message = "Internal server error";

  if (error.name === "ValidationError") {
    status = 400;

    message = Object.values(error.errors)
      .map((item) => item.message)
      .join(", ");
  }

  if (error.code === 11000) {
    status = 409;
    message = "A record with this value already exists";
  }

  res.status(error.statusCode || status).json({
    success: false,
    message: error.message && status === 500 ? error.message : message,
  });
}
