import express, { Router } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/ApiError.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// Common middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Import routers
import addblogroute from "./routes/addNewBlog.routes.js"; // ✅ With .js

app.use("/api/v1/user", addblogroute);

// Global error handler
app.use((err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, error?.errors || []);
  }

  return res.status(error.statusCode).json({
    statusCode: error.statusCode,
    data: error.data,
    success: error.success,
    message: error.message,
    errors: error.errors,
  });
});

// routes

export { app };
