import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthRequest } from '../types/express.d';

const prisma = new PrismaClient();

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.user!.clinicId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const skip = (page - 1) * limit;

    const where: any = { clinicId };

    if (req.query.action) {
      where.action = req.query.action;
    }
    if (req.query.entityType) {
      where.entityType = req.query.entityType;
    }
    if (req.query.userId) {
      where.userId = req.query.userId;
    }
    if (req.query.startDate && req.query.endDate) {
      where.createdAt = {
        gte: new Date(req.query.startDate as string),
        lte: new Date(req.query.endDate as string),
      };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          clinic: { select: { name: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

export const getAuditLogStats = async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.user!.clinicId;

    const [actionCounts, entityTypeCounts, recentActivity] = await Promise.all([
      prisma.auditLog.groupBy({
        by: ['action'],
        where: { clinicId },
        _count: { action: true },
      }),
      prisma.auditLog.groupBy({
        by: ['entityType'],
        where: { clinicId },
        _count: { entityType: true },
      }),
      prisma.auditLog.findMany({
        where: { clinicId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    res.json({
      actionCounts: actionCounts.map((a) => ({
        action: a.action,
        count: a._count.action,
      })),
      entityTypeCounts: entityTypeCounts.map((e) => ({
        entityType: e.entityType,
        count: e._count.entityType,
      })),
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching audit log stats:', error);
    res.status(500).json({ error: 'Failed to fetch audit log stats' });
  }
};

export default {
  getAuditLogs,
  getAuditLogStats,
};
