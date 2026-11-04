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

// ======================================================
// ALL RESULTS
// GET /api/sports-results
// ======================================================

router.get("/", ...adminOnly, getAllResults);

// ======================================================
// RESULT BOARD (one row per event)
// GET /api/sports-results/board?meetId=...
// ======================================================

router.get("/board", ...adminOnly, getResultBoard);

// ======================================================
// RESULT SHEET FOR ONE EVENT
// GET /api/sports-results/event/:eventId?meetId=...
// ======================================================

router.get("/event/:eventId", ...adminOnly, getEventResultSheet);

// ======================================================
// SAVE ALL PLACES OF ONE EVENT
// PUT /api/sports-results/event/:eventId
// ======================================================

router.put("/event/:eventId", ...adminOnly, saveEventResults);

export default router;
