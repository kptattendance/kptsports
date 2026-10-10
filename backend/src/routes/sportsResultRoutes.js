import express from "express";

import {
  getAllResults,
  getResultsByEvent,
  saveResult,
  finalizeEventResults,
  getResultById,
  deleteResult,
} from "../controllers/sportsResultController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import validateObjectId from "../middleware/validateObjectId.js";

const router = express.Router();

router.param("id", validateObjectId);
router.param("eventId", validateObjectId);


// ======================================================
// ALL RESULTS
// GET /api/sports-results
// ADMIN ONLY
// ======================================================

router.get(
  "/",
  authMiddleware,
  resolveUser,
  roleMiddleware("admin"),
  getAllResults
);


// ======================================================
// RESULTS FOR ONE EVENT
// GET /api/sports-results/event/:eventId?meetId=...
// ADMIN ONLY
// ======================================================

router.get(
  "/event/:eventId",
  authMiddleware,
  resolveUser,
  roleMiddleware("admin"),
  getResultsByEvent
);


// ======================================================
// FINALIZE EVENT
// POST /api/sports-results/event/:eventId/finalize
// ADMIN ONLY
// ======================================================

router.post(
  "/event/:eventId/finalize",
  authMiddleware,
  resolveUser,
  roleMiddleware("admin"),
  finalizeEventResults
);


// ======================================================
// SAVE / UPDATE RESULT
// POST /api/sports-results
// ADMIN ONLY
// ======================================================

router.post(
  "/",
  authMiddleware,
  resolveUser,
  roleMiddleware("admin"),
  saveResult
);


// ======================================================
// GET ONE RESULT
// GET /api/sports-results/:id
// ADMIN ONLY
// ======================================================

router.get(
  "/:id",
  authMiddleware,
  resolveUser,
  roleMiddleware("admin"),
  getResultById
);


// ======================================================
// DELETE RESULT
// DELETE /api/sports-results/:id
// ADMIN ONLY
// ======================================================

router.delete(
  "/:id",
  authMiddleware,
  resolveUser,
  roleMiddleware("admin"),
  deleteResult
);


export default router;