import express from "express";

import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  toggleApplicationStatus,
} from "../controllers/eventController.js";

import requireAuth from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";
import requireRole from "../middleware/roleMiddleware.js";

const router = express.Router();

// =====================================================
// VIEW EVENTS
// =====================================================

// Get all events
router.get(
  "/",
  
  getAllEvents
);

// Get single event
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
  getEventById
);

// =====================================================
// EVENT MANAGEMENT
// =====================================================

// Create event
router.post(
  "/",
  requireAuth,
  resolveUser,
  requireRole(
    "admin",
    "sports_officer"
  ),
  createEvent
);

// Update event
router.put(
  "/:id",
  requireAuth,
  resolveUser,
  requireRole(
    "admin",
    "sports_officer"
  ),
  updateEvent
);

// Delete event
router.delete(
  "/:id",
  requireAuth,
  resolveUser,
  requireRole("admin"),
  deleteEvent
);

// Open / close applications
router.patch(
  "/:id/application-status",
  requireAuth,
  resolveUser,
  requireRole(
    "admin",
    "sports_officer"
  ),
  toggleApplicationStatus
);

export default router;