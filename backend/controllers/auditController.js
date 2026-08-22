import prisma from '../db.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      entityType,
      search = ''
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    if (search.trim()) {
      where.OR = [
        { action: { contains: search.trim() } },
        { entityType: { contains: search.trim() } },
        { user: { fullName: { contains: search.trim() } } },
        { user: { username: { contains: search.trim() } } }
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              role: true
            }
          }
        }
      })
    ]);

    return sendPaginated(res, logs, total, pageNum, limitNum, 'Audit logs retrieved');
  } catch (error) {
    next(error);
  }
};
