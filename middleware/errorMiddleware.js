const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log for developer
  console.error("Error Detail:", err);

  // Mongoose bad ObjectId (CastError)
  if (err.name === "CastError") {
    const message = `Resource not found with id of ${err.value}`;
    return res.status(404).json({ success: false, message });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({ success: false, message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    return res.status(400).json({ success: false, message });
  }

  const statusCode = err.status || (res.statusCode === 200 ? 500 : res.statusCode);

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.stack : null,
  });
};

export { errorHandler };
