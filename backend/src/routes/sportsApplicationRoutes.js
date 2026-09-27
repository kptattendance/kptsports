import express from "express";

import {
  createApplication,
  getMyApplication,
  getAllApplications,
  getApplicationById,
  updateMyApplication,
  updateApplication,
  deleteMyApplication,
  deleteApplication,
} from "../controllers/sportsApplicationController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import uploadMiddleware from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ======================================================
// STUDENT - MY APPLICATION
// ======================================================

// Get logged-in student's application
// GET /api/sports-applications/my?meetId=MEET_ID

router.get(
  "/my",
  authMiddleware,
  resolveUser,
  getMyApplication
);

// Create application
// POST /api/sports-applications

router.post(
  "/",
  authMiddleware,
  resolveUser,
  uploadMiddleware.single("photo"),
  createApplication
);

// Update own application
// PUT /api/sports-applications/my

router.put(
  "/my",
  authMiddleware,
  resolveUser,
  uploadMiddleware.single("photo"),
  updateMyApplication
);

// Delete own application
// DELETE /api/sports-applications/my?meetId=MEET_ID

router.delete(
  "/my",
  authMiddleware,
  resolveUser,
  deleteMyApplication
);

// ======================================================
// ADMIN / SPORTS OFFICER / COLLEGE COORDINATOR
// ======================================================

// Get all applications
// GET /api/sports-applications

router.get(
  "/",
  authMiddleware,
  resolveUser,
  roleMiddleware(
    "admin",
    "sports_officer",
    "college_coordinator"
  ),
  getAllApplications
);

// Get one application
// GET /api/sports-applications/:id

router.get(
  "/:id",
  authMiddleware,
  resolveUser,
  roleMiddleware(
    "admin",
    "sports_officer",
    "college_coordinator"
  ),
  getApplicationById
);

// Update application
// PUT /api/sports-applications/:id

router.put(
  "/:id",
  authMiddleware,
  resolveUser,
  roleMiddleware(
    "admin",
    "sports_officer",
    "college_coordinator"
  ),
  uploadMiddleware.single("photo"),
  updateApplication
);

// Delete application
// DELETE /api/sports-applications/:id

router.delete(
  "/:id",
  authMiddleware,
  resolveUser,
  roleMiddleware(
    "admin",
    "sports_officer"
  ),
  deleteApplication
);

export default router;