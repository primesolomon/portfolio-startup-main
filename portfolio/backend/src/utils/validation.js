const { z } = require('zod');

function text({ min = 0, max, minMessage, maxMessage }) {
  return z.string().trim().refine(
    (value) => Array.from(value).length >= min,
    minMessage || `Must be at least ${min} characters.`
  ).refine(
    (value) => Array.from(value).length <= max,
    maxMessage || `Must be ${max} characters or fewer.`
  );
}

function httpUrl({ nullable = false, max = 2048 } = {}) {
  const url = z.string().trim().refine((value) => {
    if (Array.from(value).length > max) return false;
    try {
      return ['http:', 'https:'].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, `Must be a valid HTTP(S) URL of at most ${max} characters.`);
  return nullable ? z.union([url, z.null()]) : url;
}

function validationDetails(issues) {
  return issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

module.exports = { text, httpUrl, validationDetails };
