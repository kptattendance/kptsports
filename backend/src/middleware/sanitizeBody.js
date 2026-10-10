// =====================================================
// SANITIZE BODY
//
// Removes keys starting with "$" or containing "."
// from the request body, so a client cannot smuggle
// MongoDB operators (e.g. { "$ne": null }) into a query.
// =====================================================

const stripOperators = (value) => {
  if (Array.isArray(value)) {
    value.forEach(stripOperators);
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const key of Object.keys(value)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete value[key];
    } else {
      stripOperators(value[key]);
    }
  }
};

const sanitizeBody = (req, res, next) => {
  stripOperators(req.body);

  next();
};

export default sanitizeBody;
