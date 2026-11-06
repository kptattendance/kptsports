import mongoose from "mongoose";
import Certificate from "../models/Certificate.js";
import SportsMeet from "../models/SportsMeet.js";
import Event from "../models/Event.js";
import SportsApplication from "../models/SportsApplication.js";
import SportsResult from "../models/SportsResult.js";
import generateCertificatePdf, {
  generateCertificatesPdf,
} from "../utils/generateCertificatePdf.js";
import {
  syncParticipationCertificates,
  syncWinnerCertificates,
} from "../utils/syncCertificates.js";
import escapeRegex from "../utils/escapeRegex.js";
import sendError from "../utils/sendError.js";

// =====================================================
// DOWNLOAD CERTIFICATE PDF
// =====================================================

export const downloadCertificatePdf =
  async (req, res) => {
    try {
      // =================================================
      // GET CERTIFICATE
      // =================================================

      const certificate =
        await Certificate.findById(
          req.params.id
        );

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message:
            "Certificate not found",
        });
      }

      // =================================================
      // GET SPORTS MEET
      // =================================================

      const meet =
        await SportsMeet.findById(
          certificate.meet
        );

      if (!meet) {
        return res.status(404).json({
          success: false,
          message:
            "Sports meet not found",
        });
      }

      // =================================================
      // GET EVENT
      // =================================================

      const event =
        await Event.findById(
          certificate.event
        );

      if (!event) {
        return res.status(404).json({
          success: false,
          message:
            "Event not found",
        });
      }

      // =================================================
      // GET ORIGINAL APPLICATION
      // =================================================

      const application =
        await SportsApplication.findById(
          certificate.application
        ).lean();

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Sports application not found",
        });
      }

      // =================================================
      // GENERATE PDF
      // =================================================

      const pdfBuffer =
        await generateCertificatePdf({
          certificate,
          meet,
          event,
          application,
        });

      // =================================================
      // SAFE FILE NAME
      // =================================================

      const safeName =
        String(
          certificate.studentName ||
            application.name ||
            "certificate"
        )
          .replace(
            /[^a-zA-Z0-9]+/g,
            "_"
          )
          .replace(
            /^_+|_+$/g,
            "");

      const filename =
        `${certificate.certificateNumber}_${safeName}.pdf`;

      // =================================================
      // RESPONSE HEADERS
      // =================================================

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      res.setHeader(
        "Content-Length",
        pdfBuffer.length
      );

      return res.send(pdfBuffer);
    } catch (error) {
      console.error(
        "Download certificate PDF error:",
        error
      );

      return sendError(res, error, "Failed to generate certificate PDF");
    }
  };

// =====================================================
// GET ALL CERTIFICATES
// =====================================================

export const getAllCertificates =
  async (req, res) => {
    try {
      const {
        meetId,
        eventId,
        certificateType,
        position,
        search,
      } = req.query;

      const filter = {};

      if (meetId) {
        filter.meet = meetId;
      }

      if (eventId) {
        filter.event = eventId;
      }

      if (certificateType) {
        filter.certificateType =
          certificateType;
      }

      if (position) {
        filter.position =
          Number(position);
      }

      if (search) {
        filter.$or = [
          {
            studentName: {
              $regex: escapeRegex(search),
              $options: "i",
            },
          },
          {
            registerNumber: {
              $regex: escapeRegex(search),
              $options: "i",
            },
          },
          {
            certificateNumber: {
              $regex: escapeRegex(search),
              $options: "i",
            },
          },
        ];
      }

      const certificates =
        await Certificate.find(filter)
          .populate(
            "meet",
            "name shortName year"
          )
          .populate(
            "event",
            "code name category gender eventType"
          )
          .populate(
            "application",
            "name registerNumber collegeCode photo"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        certificates,
      });
    } catch (error) {
      console.error(
        "Get certificates error:",
        error
      );

      return sendError(res, error, "Failed to fetch certificates");
    }
  };

// =====================================================
// GET SINGLE CERTIFICATE
// =====================================================

export const getCertificateById =
  async (req, res) => {
    try {
      const certificate =
        await Certificate.findById(
          req.params.id
        )
          .populate(
            "meet",
            "name shortName year startDate endDate venue"
          )
          .populate(
            "event",
            "code name category gender eventType"
          )
          .populate(
            "application",
            "name registerNumber collegeCode photo"
          );

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message:
            "Certificate not found",
        });
      }

      return res.status(200).json({
        success: true,
        certificate,
      });
    } catch (error) {
      console.error(
        "Get certificate error:",
        error
      );

      return sendError(res, error, "Failed to fetch certificate");
    }
  };

// =====================================================
// PRINT CERTIFICATES OF ONE EVENT
// GET /api/certificates/event/:eventId/print
//   ?meetId=...
//   &type=winner | participation
//   &applicationId=...   (optional: one student only)
//
// Creates any missing certificates from the saved
// result, then returns them as one PDF (one per page).
// Printing again re-uses the same certificates, so
// there are never duplicates.
// =====================================================

const PRINT_TYPES = ["winner", "participation"];

export const printEventCertificates =
  async (req, res) => {
    try {
      const { eventId } = req.params;

      const {
        meetId,
        type = "winner",
        applicationId,
      } = req.query;

      if (!PRINT_TYPES.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid certificate type.",
        });
      }

      if (
        !mongoose.isValidObjectId(meetId) ||
        (applicationId &&
          !mongoose.isValidObjectId(applicationId))
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID.",
        });
      }

      const [meet, event] = await Promise.all([
        SportsMeet.findById(meetId),
        Event.findById(eventId),
      ]);

      if (!meet || !event) {
        return res.status(404).json({
          success: false,
          message: !meet
            ? "Sports meet not found"
            : "Event not found",
        });
      }

      // =================================================
      // SAVED RESULT
      // =================================================

      const results =
        await SportsResult.find({
          meet: meet._id,
          event: event._id,
        }).lean();

      if (
        type === "winner" &&
        results.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Enter the result for this event first.",
        });
      }

      // =================================================
      // MAKE SURE CERTIFICATES EXIST
      // =================================================

      await syncWinnerCertificates({
        meet,
        event,
        results,
      });

      if (type === "participation") {
        await syncParticipationCertificates({
          meet,
          event,
          results,
        });
      }

      // =================================================
      // LOAD CERTIFICATES TO PRINT
      // =================================================

      const filter = {
        meet: meet._id,
        event: event._id,
        certificateType: type,
      };

      if (applicationId) {
        filter.application = applicationId;
      }

      const certificates =
        await Certificate.find(filter).sort(
          type === "winner"
            ? { position: 1, studentName: 1 }
            : { studentName: 1 }
        );

      if (certificates.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            type === "winner"
              ? "No winner certificates to print."
              : "No participation certificates to print. Every registered student is a winner, or nobody registered.",
        });
      }

      const applications =
        await SportsApplication.find({
          _id: {
            $in: certificates.map(
              (certificate) =>
                certificate.application
            ),
          },
        })
          .select("photo name semester branch")
          .lean();

      const applicationById = new Map(
        applications.map((application) => [
          String(application._id),
          application,
        ])
      );

      // =================================================
      // ONE PDF, ONE CERTIFICATE PER PAGE
      // =================================================

      const pdfBuffer =
        await generateCertificatesPdf(
          certificates.map((certificate) => ({
            certificate,
            meet,
            event,
            application: applicationById.get(
              String(certificate.application)
            ),
          }))
        );

      const filename =
        `${event.code}_${type}_certificates.pdf`.replace(
          /[^a-zA-Z0-9_.-]+/g,
          "_"
        );

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${filename}"`
      );

      res.setHeader(
        "Content-Length",
        pdfBuffer.length
      );

      return res.send(pdfBuffer);
    } catch (error) {
      console.error(
        "Print certificates error:",
        error
      );

      return sendError(res, error, "Failed to print certificates");
    }
  };
