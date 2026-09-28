import Certificate from "../models/Certificate.js";

const generateCertificateNumber = async (year) => {
  const prefix = `KPT-SM-${year}-`;

  const lastCertificate = await Certificate.findOne({
    certificateNumber: {
      $regex: `^${prefix}`,
    },
  })
    .sort({ certificateNumber: -1 })
    .lean();

  let nextNumber = 1;

  if (lastCertificate?.certificateNumber) {
    const lastNumber = parseInt(
      lastCertificate.certificateNumber.replace(prefix, ""),
      10
    );

    if (!Number.isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(5, "0")}`;
};

export default generateCertificateNumber;