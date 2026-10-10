// =====================================================
// ESCAPE REGEX
//
// Turns user supplied search text into a literal
// pattern, so it cannot inject regex operators
// (regex injection / catastrophic backtracking).
// =====================================================

const escapeRegex = (value) => {
  return String(value ?? "")
    .trim()
    .slice(0, 100)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export default escapeRegex;
