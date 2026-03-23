import mongoose from "mongoose";

/**
 * Central JSON error handler — keeps responses consistent for the React client.
 */
export function errorHandler(err, _req, res, _next) {
  console.error(err);

  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(" ") });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: "Duplicate value (already exists)." });
  }

  const status = err.statusCode || 500;
  const message =
    status === 500 ? "Something went wrong. Please try again later." : err.message;

  res.status(status).json({ message });
}
