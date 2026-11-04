import express from "express";

import {
  getAllCertificates,
  getCertificateById,
  printEventCertificates,
  downloadCertificatePdf,
} from "../controllers/certificateController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import validateObjectId from "../middleware/validateObjectId.js";

const router = express.Router();

router.param("id", validateObjectId);
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

// =====================================================
// PRINT CERTIFICATES OF ONE EVENT (one PDF)
// GET /api/certificates/event/:eventId/print?meetId=&type=
// =====================================================

router.get(
  "/event/:eventId/print",
  ...resultStaff,
  printEventCertificates
);

// =====================================================
// GET ALL CERTIFICATES
// =====================================================

router.get(
  "/",
  ...adminOnly,
  getAllCertificates
);

// =====================================================
// GET SINGLE CERTIFICATE
// =====================================================

router.get(
  "/:id",
  ...adminOnly,
  getCertificateById
);

// =====================================================
// DOWNLOAD CERTIFICATE PDF
// =====================================================

router.get(
  "/:id/pdf",
  ...resultStaff,
  downloadCertificatePdf
);

export default router;