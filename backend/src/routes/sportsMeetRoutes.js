import express from "express";

import {
  createSportsMeet,
  getAllSportsMeets,
  getSportsMeetById,
  updateSportsMeet,
  deleteSportsMeet,
  updateSportsMeetStatus,
  toggleSportsMeetActive,
} from "../controllers/sportsMeetController.js";

import requireAuth from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";
import requireRole from "../middleware/roleMiddleware.js";
import validateObjectId from "../middleware/validateObjectId.js";

const router = express.Router();

router.param("id", validateObjectId);

// =====================================================
// GET ALL SPORTS MEETS
// =====================================================
router.get(
  "/",
  requireAuth,
  resolveUser,
  requireRole(
    "admin",
    "sports_officer",
    "college_coordinator",
    "student"
  ),
  getAllSportsMeets
);

// =====================================================
// GET SPORTS MEET BY ID
// =====================================================
router.get(
  "/:id",
  requireAuth,
  resolveUser,
  requireRole(
    "admin",
    "sports_officer",
    "college_coordinator",
    "student"
  ),
  getSportsMeetById
);

// =====================================================
// CREATE SPORTS MEET
// =====================================================
router.post(
  "/",
  requireAuth,
  resolveUser,
  requireRole("admin", "sports_officer"),
  createSportsMeet
);

// =====================================================
// UPDATE SPORTS MEET
// =====================================================
router.put(
  "/:id",
  requireAuth,
  resolveUser,
  requireRole("admin", "sports_officer"),
  updateSportsMeet
);

// =====================================================
// DELETE SPORTS MEET
// =====================================================
router.delete(
  "/:id",
  requireAuth,
  resolveUser,
  requireRole("admin"),
  deleteSportsMeet
);

// =====================================================
// UPDATE STATUS
// =====================================================
router.patch(
  "/:id/status",
  requireAuth,
  resolveUser,
  requireRole("admin", "sports_officer"),
  updateSportsMeetStatus
);

// =====================================================
// TOGGLE ACTIVE / INACTIVE
// =====================================================
router.patch(
  "/:id/active",
  requireAuth,
  resolveUser,
  requireRole("admin", "sports_officer"),
  toggleSportsMeetActive
);

export default router;