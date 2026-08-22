import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { recordAuditLog } from '../services/auditService.js';
import { validateRequired } from '../utils/validator.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-replace-in-production-gr-system-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const missing = validateRequired(req.body, ['username', 'password']);
    if (missing.length > 0) {
      return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.trim() },
          { email: username.trim().toLowerCase() }
        ]
      },
      include: { role: true }
    });

    if (!user) {
      return sendError(res, 'Invalid credentials.', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Account is disabled. Please contact an administrator.', 403);
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials.', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role.name
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });

    // Record login in audit log
    await recordAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    const { passwordHash, ...safeUser } = user;

    return sendSuccess(res, {
      user: safeUser,
      token
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res) => {
  return sendSuccess(res, { user: req.user }, 'Current user profile');
};

export const logout = async (req, res) => {
  if (req.user) {
    await recordAuditLog({
      userId: req.user.id,
      action: 'USER_LOGOUT',
      entityType: 'User',
      entityId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  }

  res.clearCookie('token');
  return sendSuccess(res, null, 'Logged out successfully');
};
