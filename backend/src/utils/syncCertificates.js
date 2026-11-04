import Certificate from "../models/Certificate.js";
import SportsApplication from "../models/SportsApplication.js";
import generateCertificateNumber from "./generateCertificateNumber.js";

// =====================================================
// CERTIFICATE SYNC
//
// Certificates always follow the saved result, so a
// result can be re-entered and re-printed any number
// of times without creating duplicates:
//  - a student keeps the same certificate number when
//    a result is edited (only the position changes)
//  - a student removed from the result loses the
//    winner certificate
// =====================================================

const buildCertificate = async ({
  meet,
  event,
  application,
  certificateType,
  position,
}) => ({
  certificateNumber: await generateCertificateNumber(meet.year),
  meet: meet._id,
  event: event._id,
  application: application._id,
  certificateType,
  position,
  studentName: application.name,
  registerNumber: application.registerNumber,
  collegeCode: application.collegeCode,
  photo: {
    url: application.photo?.url || "",
    publicId: application.photo?.publicId || "",
  },
  eventName: event.name,
  meetName: meet.name,
  issuedAt: new Date(),
});

// Numbers are generated one at a time, because each
// one is based on the last number already saved.
const createCertificates = async (items) => {
  for (const item of items) {
    await Certificate.create(await buildCertificate(item));
  }
};

// =====================================================
// WINNER CERTIFICATES
// results: SportsResult documents of this meet + event
// =====================================================

export const syncWinnerCertificates = async ({
  meet,
  event,
  results,
}) => {
  // applicationId -> position
  const winners = new Map();

  for (const result of results) {
    for (const participant of result.participants) {
      winners.set(
        String(participant._id || participant),
        result.position
      );
    }
  }

  const existing = await Certificate.find({
    meet: meet._id,
    event: event._id,
    certificateType: "winner",
  });

  const existingIds = new Set();

  for (const certificate of existing) {
    const applicationId = String(certificate.application);
    const position = winners.get(applicationId);

    if (!position) {
      await certificate.deleteOne();
      continue;
    }

    existingIds.add(applicationId);

    if (certificate.position !== position) {
      certificate.position = position;
      await certificate.save();
    }
  }

  // A winner no longer needs a participation certificate
  await Certificate.deleteMany({
    meet: meet._id,
    event: event._id,
    certificateType: "participation",
    application: { $in: [...winners.keys()] },
  });

  const missingIds = [...winners.keys()].filter(
    (id) => !existingIds.has(id)
  );

  if (missingIds.length > 0) {
    const applications = await SportsApplication.find({
      _id: { $in: missingIds },
    }).lean();

    await createCertificates(
      applications.map((application) => ({
        meet,
        event,
        application,
        certificateType: "winner",
        position: winners.get(String(application._id)),
      }))
    );
  }
};

// =====================================================
// PARTICIPATION CERTIFICATES
// Everyone registered for the event (not rejected)
// who is not a winner.
// =====================================================

export const syncParticipationCertificates = async ({
  meet,
  event,
  results,
}) => {
  const winnerIds = new Set(
    results.flatMap((result) =>
      result.participants.map((participant) =>
        String(participant._id || participant)
      )
    )
  );

  const [applications, existing] = await Promise.all([
    SportsApplication.find({
      meet: meet._id,
      selectedEvents: event._id,
      status: { $ne: "rejected" },
    }).lean(),

    Certificate.find({
      meet: meet._id,
      event: event._id,
      certificateType: "participation",
    })
      .select("application")
      .lean(),
  ]);

  const existingIds = new Set(
    existing.map((certificate) => String(certificate.application))
  );

  await createCertificates(
    applications
      .filter(
        (application) =>
          !winnerIds.has(String(application._id)) &&
          !existingIds.has(String(application._id))
      )
      .map((application) => ({
        meet,
        event,
        application,
        certificateType: "participation",
        position: null,
      }))
  );
};
