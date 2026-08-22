// Request validation helpers

export const validateRequired = (body, requiredFields = []) => {
  const missing = [];
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || (typeof body[field] === 'string' && body[field].trim() === '')) {
      missing.push(field);
    }
  }
  return missing;
};

export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim();
};
