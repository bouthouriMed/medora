import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthRequest } from '../types/express.d';

const prisma = new PrismaClient();

const METHOD_ACTION_MAP: Record<string, string> = {
  POST: 'CREATE',
  PUT: 'UPDATE',
  DELETE: 'DELETE',
};

function getEntityType(path: string): string {
  const segments = path.replace(/^\/api\//, '').split('/');
  return segments[0]?.toUpperCase().replace(/-/g, '_') || 'UNKNOWN';
}

export function auditLog() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const action = METHOD_ACTION_MAP[req.method];
    if (!action || !req.user) return next();

    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (res.statusCode < 400) {
        const entityType = getEntityType(req.originalUrl || req.path);
        const entityId = req.params?.id || body?.id;
        prisma.auditLog.create({
          data: {
            clinicId: req.user!.clinicId,
            userId: req.user!.id,
            userName: req.user!.email,
            action,
            entityType,
            entityId,
            details: { path: req.originalUrl, method: req.method },
            ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress,
          },
        }).catch(() => {}); // fire-and-forget
      }
      return originalJson(body);
    } as any;
    next();
  };
}
