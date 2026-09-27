import express from "express";

import {
  createStudentProfile,
  getMyStudentProfile,
  getStudentById,
  getAllStudents,
  updateStudent,
  updateStudentPhoto,
  deleteStudent,
} from "../controllers/studentController.js";

import requireAuth from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";
import requireRole from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// =====================================================
// STUDENT'S OWN PROFILE
// =====================================================

// Create student profile
router.post(
  "/profile",
  requireAuth,
  upload.single("photo"),
  createStudentProfile
);

// Get logged-in student's own profile
router.get(
  "/me",
  requireAuth,
  resolveUser,
  requireRole("student"),
  getMyStudentProfile
);

// =====================================================
// STUDENT'S OWN PROFILE UPDATE
// =====================================================

// Update own profile
router.put(
  "/me",
  requireAuth,
  resolveUser,
  requireRole("student"),
  updateStudent
);

// Update own photo
router.put(
  "/me/photo",
  requireAuth,
  resolveUser,
  requireRole("student"),
  upload.single("photo"),
  updateStudentPhoto
);

// =====================================================
// ADMIN STUDENT MANAGEMENT
// =====================================================

// Get all students
router.get(
  "/",
  requireAuth,
  resolveUser,
  requireRole(
    "admin",
    "sports_officer",
    "college_coordinator"
  ),
  getAllStudents
);

// Get single student
router.get(
  "/:id",
  requireAuth,
  resolveUser,
  requireRole(
    "admin",
    "sports_officer",
    "college_coordinator"
  ),
  getStudentById
);

// Update any student
router.put(
  "/:id",
  requireAuth,
  resolveUser,
  requireRole(
    "admin",
    "sports_officer",
    "college_coordinator"
  ),
  updateStudent
);

// Delete student
router.delete(
  "/:id",
  requireAuth,
  resolveUser,
  requireRole("admin"),
  deleteStudent
);

export default router;