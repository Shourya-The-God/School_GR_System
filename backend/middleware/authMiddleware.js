import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import { sendError } from '../utils/response.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-replace-in-production-gr-system-2026';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      // Or check cookie
      token = req.cookies.token;
    }

    if (!token) {
      return sendError(res, 'Authentication required. Please log in.', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch fresh user from DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });

    if (!user) {
      return sendError(res, 'User not found. Session invalid.', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Account is disabled. Contact your administrator.', 403);
    }

    // Attach user to req (excluding passwordHash)
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Session expired. Please log in again.', 401);
    }
    return sendError(res, 'Invalid authentication token.', 401);
  }
};

export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthorized.', 401);
    }

    if (allowedRoles.length === 0) return next();

    const userRole = req.user.role?.name;
    if (!allowedRoles.includes(userRole)) {
      return sendError(res, 'Forbidden: You do not have permission to perform this action.', 403);
    }

    next();
  };
};
