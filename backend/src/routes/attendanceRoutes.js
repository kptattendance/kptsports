import express from "express";

import {
  getAttendanceBoard,
  getEventAttendance,
  saveEventAttendance,
  getEventParticipantListPdf,
} from "../controllers/attendanceController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import validateObjectId from "../middleware/validateObjectId.js";

const router = express.Router();

router.param("eventId", validateObjectId);

// Admin, sports officers and sports coordinators take attendance
const attendanceStaff = [
  authMiddleware,
  resolveUser,
  roleMiddleware(
    "admin",
    "sports_officer",
    "sports_coordinator"
  ),
];

// ======================================================
// ATTENDANCE BOARD (one row per event)
// GET /api/attendance/board?meetId=...
// ======================================================

router.get("/board", ...attendanceStaff, getAttendanceBoard);

// ======================================================
// ATTENDANCE SHEET FOR ONE EVENT
// GET /api/attendance/event/:eventId?meetId=...
// ======================================================

router.get("/event/:eventId", ...attendanceStaff, getEventAttendance);

// ======================================================
// SAVE ATTENDANCE FOR ONE EVENT
// PUT /api/attendance/event/:eventId
// ======================================================

router.put("/event/:eventId", ...attendanceStaff, saveEventAttendance);

// ======================================================
// PARTICIPANT LIST PDF FOR ONE EVENT
// GET /api/attendance/event/:eventId/list?meetId=...
// ======================================================

router.get(
  "/event/:eventId/list",
  ...attendanceStaff,
  getEventParticipantListPdf
);

export default router;
