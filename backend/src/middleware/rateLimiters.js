import { getAuth } from "@clerk/express";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";

// =====================================================
// RATE LIMITERS
//
// Signed-in requests are counted per user, so students
// sharing one college network do not block each other.
// Anonymous requests are counted per IP address.
// =====================================================

const keyGenerator = (req) => {
  const { userId } = getAuth(req);

  return userId || ipKeyGenerator(req.ip);
};

const createLimiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    keyGenerator,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });

// All API routes
export const apiLimiter = createLimiter(
  5 * 60 * 1000,
  600,
  "Too many requests. Please try again in a few minutes."
);

// Application submit / update (photo upload)
export const uploadLimiter = createLimiter(
  10 * 60 * 1000,
  20,
  "Too many submissions. Please try again in a few minutes."
);
