import Certificate from "../models/Certificate.js";
import SportsMeet from "../models/SportsMeet.js";
import Event from "../models/Event.js";
import SportsApplication from "../models/SportsApplication.js";
import SportsResult from "../models/SportsResult.js";
import generateCertificateNumber from "../utils/generateCertificateNumber.js";
import generateCertificatePdf from "../utils/generateCertificatePdf.js";

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
      // PHOTO DEBUG
      // =================================================

      console.log("");
      console.log(
        "================================================"
      );
      console.log(
        "CERTIFICATE PDF PHOTO DEBUG"
      );
      console.log(
        "================================================"
      );

      console.log(
        "Certificate ID:",
        certificate._id
      );

      console.log(
        "Certificate Number:",
        certificate.certificateNumber
      );

      console.log(
        "Certificate Application ID:",
        certificate.application
      );

      console.log(
        "Application ID:",
        application._id
      );

      console.log(
        "Student Name:",
        application.name
      );

      console.log(
        "Application Photo:",
        application.photo
      );

      console.log(
        "Application Photo URL:",
        application.photo?.url
      );

      console.log(
        "Application Photo Public ID:",
        application.photo?.publicId
      );

      console.log(
        "Certificate Photo:",
        certificate.photo
      );

      console.log(
        "================================================"
      );
      console.log("");

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

      return res.status(500).json({
        success: false,
        message:
          "Failed to generate certificate PDF",
        error: error.message,
      });
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
              $regex: search,
              $options: "i",
            },
          },
          {
            registerNumber: {
              $regex: search,
              $options: "i",
            },
          },
          {
            certificateNumber: {
              $regex: search,
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

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch certificates",
      });
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

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch certificate",
      });
    }
  };

// =====================================================
// GENERATE CERTIFICATES FOR FINALIZED EVENT
// =====================================================

export const generateCertificatesForEvent =
  async (req, res) => {
    try {
      const { eventId } =
        req.params;

      // =================================================
      // GET EVENT
      // =================================================

      const event =
        await Event.findById(
          eventId
        );

      if (!event) {
        return res.status(404).json({
          success: false,
          message:
            "Event not found",
        });
      }

      // =================================================
      // GET MEET
      // =================================================

      const meet =
        await SportsMeet.findById(
          event.meet
        );

      if (!meet) {
        return res.status(404).json({
          success: false,
          message:
            "Sports meet not found",
        });
      }

      // =================================================
      // CHECK FINAL RESULTS
      // =================================================

      const results =
        await SportsResult.find({
          meet: meet._id,
          event: event._id,
          isFinal: true,
        }).sort({
          position: 1,
        });

      if (!results.length) {
        return res.status(400).json({
          success: false,
          message:
            "Final results are not available for this event.",
        });
      }

      // =================================================
      // GET ALL APPLICATIONS
      // =================================================

      const applications =
        await SportsApplication.find({
          meet: meet._id,
          selectedEvents:
            event._id,
        }).lean();

      if (!applications.length) {
        return res.status(400).json({
          success: false,
          message:
            "No participants found for this event.",
        });
      }

      // =================================================
      // PHOTO DEBUG
      // =================================================

      console.log("");
      console.log(
        "================================================"
      );
      console.log(
        "CERTIFICATE GENERATION PHOTO CHECK"
      );
      console.log(
        "================================================"
      );

      console.log(
        "Event:",
        event.name
      );

      console.log(
        "Meet:",
        meet.name
      );

      console.log(
        "Total applications:",
        applications.length
      );

      for (
        const application of applications
      ) {
        console.log("");
        console.log(
          "----------------------------------------"
        );

        console.log(
          "Application ID:",
          application._id
        );

        console.log(
          "Student:",
          application.name
        );

        console.log(
          "Register Number:",
          application.registerNumber
        );

        console.log(
          "Photo Object:",
          application.photo
        );

        console.log(
          "Photo URL:",
          application.photo?.url
        );

        console.log(
          "Photo Public ID:",
          application.photo?.publicId
        );
      }

      console.log(
        "================================================"
      );
      console.log("");

      // =================================================
      // FIND WINNER APPLICATION IDS
      // =================================================

      const winnerApplicationIds =
        new Set();

      for (
        const result of results
      ) {
        for (
          const participant of
            result.participants
        ) {
          winnerApplicationIds.add(
            String(participant)
          );
        }
      }

      // =================================================
      // COUNTERS
      // =================================================

      let winnerCount = 0;

      let participationCount = 0;

      // =================================================
      // GENERATE WINNER CERTIFICATES
      // =================================================

      for (
        const result of results
      ) {
        for (
          const participantId of
            result.participants
        ) {
          const application =
            applications.find(
              (item) =>
                String(item._id) ===
                String(participantId)
            );

          if (!application) {
            continue;
          }

          // ---------------------------------------------
          // CHECK EXISTING
          // ---------------------------------------------

          const existing =
            await Certificate.findOne({
              meet: meet._id,
              event: event._id,
              application:
                application._id,
              certificateType:
                "winner",
            });

          if (existing) {
            continue;
          }

          // ---------------------------------------------
          // CERTIFICATE NUMBER
          // ---------------------------------------------

          const certificateNumber =
            await generateCertificateNumber(
              meet.year
            );

          // ---------------------------------------------
          // PHOTO
          // ---------------------------------------------

          const photoData = {
            url:
              application.photo?.url ||
              "",

            publicId:
              application.photo?.publicId ||
              "",
          };

          console.log("");
          console.log(
            "CREATING WINNER CERTIFICATE"
          );

          console.log(
            "Student:",
            application.name
          );

          console.log(
            "Photo:",
            photoData
          );

          // ---------------------------------------------
          // CREATE CERTIFICATE
          // ---------------------------------------------

          await Certificate.create({
            certificateNumber,

            meet: meet._id,

            event: event._id,

            application:
              application._id,

            certificateType:
              "winner",

            position:
              result.position,

            studentName:
              application.name,

            registerNumber:
              application.registerNumber,

            collegeCode:
              application.collegeCode,

            photo: photoData,

            eventName:
              event.name,

            meetName:
              meet.name,

            issuedAt:
              new Date(),
          });

          winnerCount++;
        }
      }

      // =================================================
      // GENERATE PARTICIPATION CERTIFICATES
      // =================================================

      for (
        const application of
          applications
      ) {
        const applicationId =
          String(application._id);

        if (
          winnerApplicationIds.has(
            applicationId
          )
        ) {
          continue;
        }

        // ---------------------------------------------
        // CHECK EXISTING
        // ---------------------------------------------

        const existing =
          await Certificate.findOne({
            meet: meet._id,
            event: event._id,
            application:
              application._id,
            certificateType:
              "participation",
          });

        if (existing) {
          continue;
        }

        // ---------------------------------------------
        // CERTIFICATE NUMBER
        // ---------------------------------------------

        const certificateNumber =
          await generateCertificateNumber(
            meet.year
          );

        // ---------------------------------------------
        // PHOTO
        // ---------------------------------------------

        const photoData = {
          url:
            application.photo?.url ||
            "",

          publicId:
            application.photo?.publicId ||
            "",
        };

        console.log("");
        console.log(
          "CREATING PARTICIPATION CERTIFICATE"
        );

        console.log(
          "Student:",
          application.name
        );

        console.log(
          "Photo:",
          photoData
        );

        // ---------------------------------------------
        // CREATE CERTIFICATE
        // ---------------------------------------------

        await Certificate.create({
          certificateNumber,

          meet: meet._id,

          event: event._id,

          application:
            application._id,

          certificateType:
            "participation",

          position: null,

          studentName:
            application.name,

          registerNumber:
            application.registerNumber,

          collegeCode:
            application.collegeCode,

          photo: photoData,

          eventName:
            event.name,

          meetName:
            meet.name,

          issuedAt:
            new Date(),
        });

        participationCount++;
      }

      // =================================================
      // RESPONSE
      // =================================================

      return res.status(200).json({
        success: true,

        message:
          "Certificates generated successfully.",

        winnerCount,

        participationCount,
      });
    } catch (error) {
      console.error(
        "Generate certificates error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to generate certificates",
        error: error.message,
      });
    }
  };

// =====================================================
// DELETE CERTIFICATE
// =====================================================

export const deleteCertificate =
  async (req, res) => {
    try {
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

      await Certificate.findByIdAndDelete(
        req.params.id
      );

      return res.status(200).json({
        success: true,
        message:
          "Certificate deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete certificate error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete certificate",
      });
    }
  };