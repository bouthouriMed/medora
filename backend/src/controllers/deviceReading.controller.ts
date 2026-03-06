import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthRequest } from '../types/express.d';

const prisma = new PrismaClient();

const ABNORMAL_THRESHOLDS: Record<string, { min: number; max: number }> = {
  HEART_RATE: { min: 60, max: 100 },
  GLUCOSE: { min: 70, max: 140 },
  OXYGEN: { min: 95, max: 100 },
  TEMPERATURE: { min: 36.1, max: 37.2 },
};

function isAbnormal(deviceType: string, value: number, systolic?: number, diastolic?: number): boolean {
  if (deviceType === 'BLOOD_PRESSURE') {
    return (systolic != null && (systolic < 90 || systolic > 140)) ||
           (diastolic != null && (diastolic < 60 || diastolic > 90));
  }
  const range = ABNORMAL_THRESHOLDS[deviceType];
  if (!range) return false;
  return value < range.min || value > range.max;
}

export async function getReadings(req: AuthRequest, res: Response) {
  try {
    const { patientId, deviceType, from, to } = req.query;
    const where: any = { clinicId: req.user!.clinicId };
    if (patientId) where.patientId = patientId;
    if (deviceType) where.deviceType = deviceType;
    if (from || to) {
      where.recordedAt = {};
      if (from) where.recordedAt.gte = new Date(from as string);
      if (to) where.recordedAt.lte = new Date(to as string);
    }
    const readings = await prisma.deviceReading.findMany({
      where,
      include: { patient: { select: { firstName: true, lastName: true } } },
      orderBy: { recordedAt: 'desc' },
      take: 200,
    });
    res.json(readings);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getPatientReadings(req: AuthRequest, res: Response) {
  try {
    const { patientId } = req.params;
    const readings = await prisma.deviceReading.findMany({
      where: { clinicId: req.user!.clinicId, patientId },
      orderBy: { recordedAt: 'desc' },
      take: 100,
    });
    res.json(readings);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createReading(req: AuthRequest, res: Response) {
  try {
    const { patientId, deviceType, value, unit, systolic, diastolic, notes, recordedAt } = req.body;
    const abnormal = isAbnormal(deviceType, value, systolic, diastolic);
    const reading = await prisma.deviceReading.create({
      data: {
        clinicId: req.user!.clinicId,
        patientId,
        deviceType,
        value,
        unit,
        systolic,
        diastolic,
        isAbnormal: abnormal,
        notes,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      },
    });
    res.json(reading);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function deleteReading(req: AuthRequest, res: Response) {
  try {
    await prisma.deviceReading.deleteMany({
      where: { id: req.params.id, clinicId: req.user!.clinicId },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getPatientAlerts(req: AuthRequest, res: Response) {
  try {
    const { patientId } = req.params;
    const alerts = await prisma.deviceReading.findMany({
      where: { clinicId: req.user!.clinicId, patientId, isAbnormal: true },
      orderBy: { recordedAt: 'desc' },
      take: 20,
    });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
