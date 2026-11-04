import express from "express";

import {
  getAllResults,
  getResultBoard,
  getEventResultSheet,
  saveEventResults,
} from "../controllers/sportsResultController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import validateObjectId from "../middleware/validateObjectId.js";

const router = express.Router();

router.param("eventId", validateObjectId);

const adminOnly = [
  authMiddleware,
  resolveUser,
  roleMiddleware("admin"),
];

// Everyone who works on results: admin, sports officers,
// sports coordinators and office staff
const resultStaff = [
  authMiddleware,
  resolveUser,
  roleMiddleware(
    "admin",
    "sports_officer",
    "sports_coordinator",
    "office_staff"
  ),
];

// ======================================================
// ALL RESULTS
// GET /api/sports-results
// ======================================================

router.get("/", ...adminOnly, getAllResults);

// ======================================================
// RESULT BOARD (one row per event)
// GET /api/sports-results/board?meetId=...
// ======================================================

router.get("/board", ...resultStaff, getResultBoard);

// ======================================================
// RESULT SHEET FOR ONE EVENT
// GET /api/sports-results/event/:eventId?meetId=...
// ======================================================

router.get("/event/:eventId", ...resultStaff, getEventResultSheet);

// ======================================================
// SAVE ALL PLACES OF ONE EVENT
// PUT /api/sports-results/event/:eventId
// ======================================================

router.put("/event/:eventId", ...resultStaff, saveEventResults);

export default router;
