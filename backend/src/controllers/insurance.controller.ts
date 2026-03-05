import { Response } from 'express';
import type { AuthRequest } from '../types/express.d';
import prisma from '../utils/prisma';

export async function getClaims(req: AuthRequest, res: Response) {
  try {
    const { status, patientId } = req.query;
    const where: any = { clinicId: req.user!.clinicId };
    if (status) where.status = status;
    if (patientId) where.patientId = patientId;

    const claims = await prisma.insuranceClaim.findMany({
      where,
      include: { patient: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getClaim(req: AuthRequest, res: Response) {
  try {
    const claim = await prisma.insuranceClaim.findUnique({
      where: { id: req.params.id },
      include: { patient: true },
    });
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    res.json(claim);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createClaim(req: AuthRequest, res: Response) {
  try {
    const claim = await prisma.insuranceClaim.create({
      data: {
        ...req.body,
        clinicId: req.user!.clinicId,
      },
      include: { patient: true },
    });
    res.status(201).json(claim);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function updateClaim(req: AuthRequest, res: Response) {
  try {
    const claim = await prisma.insuranceClaim.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        processedAt: req.body.status === 'APPROVED' || req.body.status === 'DENIED' ? new Date() : undefined,
      },
      include: { patient: true },
    });
    res.json(claim);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function deleteClaim(req: AuthRequest, res: Response) {
  try {
    await prisma.insuranceClaim.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getClaimStats(req: AuthRequest, res: Response) {
  try {
    const clinicId = req.user!.clinicId;
    const [submitted, approved, denied, pending] = await Promise.all([
      prisma.insuranceClaim.count({ where: { clinicId, status: 'SUBMITTED' } }),
      prisma.insuranceClaim.aggregate({ where: { clinicId, status: 'APPROVED' }, _sum: { approvedAmount: true }, _count: true }),
      prisma.insuranceClaim.count({ where: { clinicId, status: 'DENIED' } }),
      prisma.insuranceClaim.aggregate({ where: { clinicId, status: { in: ['SUBMITTED', 'IN_REVIEW'] } }, _sum: { claimAmount: true }, _count: true }),
    ]);

    res.json({
      submitted,
      approved: approved._count,
      approvedAmount: approved._sum.approvedAmount || 0,
      denied,
      pendingCount: pending._count,
      pendingAmount: pending._sum.claimAmount || 0,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
