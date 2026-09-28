import express from "express";

import {
  getAllCertificates,
  getCertificateById,
  generateCertificatesForEvent,
  deleteCertificate,
  downloadCertificatePdf,
} from "../controllers/certificateController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

const adminOnly = [
  authMiddleware,
  resolveUser,
  roleMiddleware("admin"),
];

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
// GENERATE CERTIFICATES FOR EVENT
// =====================================================

router.post(
  "/event/:eventId/generate",
  ...adminOnly,
  generateCertificatesForEvent
);

// =====================================================
// DELETE CERTIFICATE
// =====================================================

router.delete(
  "/:id",
  ...adminOnly,
  deleteCertificate
);

// =====================================================
// DOWNLOAD CERTIFICATE PDF
// =====================================================

router.get(
  "/:id/pdf",
  ...adminOnly,
  downloadCertificatePdf
);

export default router;