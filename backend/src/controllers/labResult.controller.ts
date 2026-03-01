import { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../types/express.d';

export const getLabResults = async (req: AuthRequest, res: Response) => {
  try {
    const { clinicId } = req.user!;
    const patientId = req.query.patientId as string | undefined;
    const status = req.query.status as string | undefined;

    const where: any = { clinicId };
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const labResults = await prisma.labResult.findMany({
      where,
      include: { patient: true },
      orderBy: { orderedAt: 'desc' },
    });

    res.json(labResults);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lab results' });
  }
};

export const getLabResult = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { clinicId } = req.user!;

    const labResult = await prisma.labResult.findFirst({
      where: { id, clinicId },
      include: { patient: true },
    });

    if (!labResult) {
      return res.status(404).json({ error: 'Lab result not found' });
    }

    res.json(labResult);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lab result' });
  }
};

export const createLabResult = async (req: AuthRequest, res: Response) => {
  try {
    const { clinicId } = req.user!;
    const { patientId, testName, category, result, normalRange, status, notes, orderedBy } = req.body as {
      patientId: string;
      testName: string;
      category?: string;
      result?: string;
      normalRange?: string;
      status?: string;
      notes?: string;
      orderedBy?: string;
    };

    const labResult = await prisma.labResult.create({
      data: {
        patientId,
        clinicId,
        testName,
        category,
        result,
        normalRange,
        status: status || 'PENDING',
        notes,
        orderedBy,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
      include: { patient: true },
    });

    res.json(labResult);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lab result' });
  }
};

export const updateLabResult = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { clinicId } = req.user!;
    const { testName, category, result, normalRange, status, notes, orderedBy } = req.body as {
      testName?: string;
      category?: string;
      result?: string;
      normalRange?: string;
      status?: string;
      notes?: string;
      orderedBy?: string;
    };

    const labResult = await prisma.labResult.update({
      where: { id },
      data: {
        testName,
        category,
        result,
        normalRange,
        status,
        notes,
        orderedBy,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
      include: { patient: true },
    });

    res.json(labResult);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lab result' });
  }
};

export const deleteLabResult = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { clinicId } = req.user!;

    await prisma.labResult.deleteMany({
      where: { id, clinicId },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete lab result' });
  }
};
