import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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

dotenv.config();

const app = express();

// --------------------------------------------------
// CORS
// --------------------------------------------------

app.use(
  cors({
    origin: [
      "https://sports.kptmangaluru.in",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(express.json());

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

app.use("/api/events", eventRoutes);

app.use("/api/institutions", institutionRoutes);

app.use("/api/sports-meets", sportsMeetRoutes);

app.use("/api/users", userRoutes);

app.use(
  "/api/sports-applications",
  sportsApplicationRoutes
);

app.use(
  "/api/sports-statistics",
  sportsStatisticsRoutes
);

app.use(
  "/api/sports-results",
  sportsResultRoutes
);

app.use(
  "/api/certificates",
  certificateRoutes
);

// --------------------------------------------------
// Start server
// --------------------------------------------------

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
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