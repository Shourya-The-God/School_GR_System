import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import prisma from '../db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { recordAuditLog } from '../services/auditService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../storage/uploads');

export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded.', 400);
    }

    const { studentId, title } = req.body;
    const file = req.file;

    const doc = await prisma.document.create({
      data: {
        studentId: studentId || null,
        title: title || file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        filePath: file.filename,
        uploadedBy: req.user?.username || 'admin'
      }
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'UPLOAD_DOCUMENT',
      entityType: 'Document',
      entityId: doc.id,
      newValue: doc,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, doc, 'Document uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Securely stream a private document for authenticated preview
 */
export const streamDocument = async (req, res, next) => {
  try {
    const { filename } = req.params;
    
    // Prevent path traversal attacks
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(uploadDir, sanitizedFilename);

    if (!fs.existsSync(filePath)) {
      return sendError(res, 'Requested document not found.', 404);
    }

    // Determine content type
    const ext = path.extname(sanitizedFilename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${sanitizedFilename}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};
