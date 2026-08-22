import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'File size exceeds the allowed limit (15MB).', 400);
    }
    return sendError(res, `Upload error: ${err.message}`, 400);
  }

  // Handle Prisma unique constraint violations
  if (err.code === 'P2002') {
    const fields = err.meta?.target || 'field';
    return sendError(res, `A record with this ${Array.isArray(fields) ? fields.join(', ') : fields} already exists.`, 409);
  }

  // Handle Prisma not found
  if (err.code === 'P2025') {
    return sendError(res, 'Record not found in the database.', 404);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, message, statusCode);
};

export const notFoundHandler = (req, res) => {
  return sendError(res, `API route not found: ${req.method} ${req.originalUrl}`, 404);
};
