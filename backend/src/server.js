import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { clerkMiddleware } from "@clerk/express";

import institutionRoutes from "./routes/institutionRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import sportsMeetRoutes from "./routes/sportsMeetRoutes.js";
import sportsApplicationRoutes from "./routes/sportsApplicationRoutes.js";
import sportsStatisticsRoutes from "./routes/sportsStatisticsRoutes.js";
import sportsResultRoutes from "./routes/sportsResultRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import connectDB from "./config/db.js";
import sanitizeBody from "./middleware/sanitizeBody.js";
import { apiLimiter } from "./middleware/rateLimiters.js";

// --------------------------------------------------
// Required configuration
// --------------------------------------------------

const REQUIRED_ENV = [
  "MONGODB_URI",
  "CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const missingEnv = REQUIRED_ENV.filter(
  (name) => !process.env[name]
);

if (missingEnv.length > 0) {
  console.error(
    "Missing environment variables:",
    missingEnv.join(", ")
  );

  process.exit(1);
}

const app = express();

// The API runs behind the hosting provider's proxy.
// Needed so rate limiting sees the real client IP.
app.set("trust proxy", 1);

app.disable("x-powered-by");

// --------------------------------------------------
// Security headers
// --------------------------------------------------

app.use(helmet());

// --------------------------------------------------
// CORS
// --------------------------------------------------

const allowedOrigins = [
  "https://sports.kptmangaluru.in",
  "https://local.sports.kptmangaluru.in",
  "http://localhost:3000",
];

if (
  process.env.FRONTEND_URL &&
  !allowedOrigins.includes(process.env.FRONTEND_URL)
) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(express.json({ limit: "100kb" }));

app.use(sanitizeBody);

app.use(clerkMiddleware());

// --------------------------------------------------
// Test route
// --------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "KPT Sports Management API is running",
  });
});

// --------------------------------------------------
// API routes
// --------------------------------------------------

app.use("/api", apiLimiter);

app.use("/api/events", eventRoutes);

app.use("/api/institutions", institutionRoutes);

app.use("/api/sports-meets", sportsMeetRoutes);

app.use("/api/users", userRoutes);

app.use("/api/sports-applications", sportsApplicationRoutes);

app.use("/api/sports-statistics", sportsStatisticsRoutes);

app.use("/api/sports-results", sportsResultRoutes);

app.use("/api/certificates", certificateRoutes);

// --------------------------------------------------
// 404
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// --------------------------------------------------
// Error handler
//
// Catches upload errors, malformed JSON and anything
// not handled inside a controller. Never sends a
// stack trace to the client.
// --------------------------------------------------

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error?.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Photo must be less than 5 MB."
          : "Invalid file upload.",
    });
  }

  const status =
    error?.status || error?.statusCode || 500;

  if (status >= 400 && status < 500) {
    return res.status(status).json({
      success: false,
      message:
        error.type === "entity.parse.failed"
          ? "Invalid request body."
          : error.message || "Invalid request.",
    });
  }

  console.error("Unhandled error:", error);

  return res.status(500).json({
    success: false,
    message: "Something went wrong.",
  });
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Express 5 passes listen errors (e.g. port already
    // in use) to this callback instead of throwing.
    app.listen(PORT, (error) => {
      if (error) {
        console.error(
          "Failed to start server:",
          error.message
        );

        process.exit(1);
      }

      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error
    );

    process.exit(1);
  }
};

startServer();
