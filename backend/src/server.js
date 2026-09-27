dotenv.config();
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import studentRoutes from "./routes/studentRoutes.js";
import institutionRoutes from "./routes/institutionRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import sportsMeetRoutes from "./routes/sportsMeetRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import connectDB from "./config/db.js";

const app = express();

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
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



app.use("/api/students", studentRoutes);
app.use(
  "/api/events",
  eventRoutes
);
app.use(
  "/api/institutions",
  institutionRoutes
);
app.use("/api/sports-meets", sportsMeetRoutes);
app.use("/api/users", userRoutes);
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
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();