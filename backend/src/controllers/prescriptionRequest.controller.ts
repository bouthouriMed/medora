import { Response } from 'express';
import type { AuthRequest } from '../types/express.d';
import prisma from '../utils/prisma';

export async function getPrescriptionRequests(req: AuthRequest, res: Response) {
  try {
    const { status } = req.query;
    const where: any = { clinicId: req.user!.clinicId };
    if (status) where.status = status;

    const requests = await prisma.prescriptionRequest.findMany({
      where,
      include: { patient: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function reviewPrescriptionRequest(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    const request = await prisma.prescriptionRequest.update({
      where: { id },
      data: {
        status,
        reviewNotes,
        reviewedBy: req.user!.id,
        reviewedAt: new Date(),
      },
      include: { patient: true },
    });

    // If approved, create a new prescription
    if (status === 'APPROVED') {
      const original = await prisma.prescriptionRequest.findUnique({ where: { id } });
      if (original) {
        await prisma.prescription.create({
          data: {
            patientId: original.patientId,
            clinicId: original.clinicId,
            prescribedById: req.user!.id,
            medication: original.medication,
            dosage: req.body.dosage || 'As prescribed',
            frequency: req.body.frequency || 'As needed',
          },
        });
      }
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createPortalPrescriptionRequest(req: any, res: Response) {
  try {
    const { token } = req.params;
    const patient = await prisma.patient.findFirst({ where: { portalToken: token } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const request = await prisma.prescriptionRequest.create({
      data: {
        clinicId: patient.clinicId,
        patientId: patient.id,
        medication: req.body.medication,
        reason: req.body.reason,
        prescriptionId: req.body.prescriptionId,
      },
    });
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
