import express from "express";

import {
  createInstitution,
  getAllInstitutions,
  getInstitutionById,
  updateInstitution,
  deleteInstitution,
  toggleInstitutionStatus,
} from "../controllers/institutionController.js";

import requireAuth from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";
import requireRole from "../middleware/roleMiddleware.js";
import validateObjectId from "../middleware/validateObjectId.js";

const router = express.Router();

router.param("id", validateObjectId);

// =====================================================
// VIEW INSTITUTIONS
// =====================================================

// Get all institutions
// Students can use this to select their college.
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
  getAllInstitutions
);

// Get single institution
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
  getInstitutionById
);

// =====================================================
// CREATE
// =====================================================

router.post(
  "/",
  requireAuth,
  resolveUser,
  requireRole(
    "admin"
  ),
  createInstitution
);

// =====================================================
// UPDATE
// =====================================================

router.put(
  "/:id",
  requireAuth,
  resolveUser,
  requireRole(
    "admin",
    "sports_officer"
  ),
  updateInstitution
);

// =====================================================
// DELETE
// =====================================================

router.delete(
  "/:id",
  requireAuth,
  resolveUser,
  requireRole(
    "admin"
  ),
  deleteInstitution
);

// =====================================================
// ACTIVATE / DEACTIVATE
// =====================================================

router.patch(
  "/:id/status",
  requireAuth,
  resolveUser,
  requireRole(
    "admin",
    "sports_officer"
  ),
  toggleInstitutionStatus
);

export default router;