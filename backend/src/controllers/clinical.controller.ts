import { Response } from 'express';
import type { AuthRequest } from '../types/express.d';
import prisma from '../utils/prisma';
import aiService from '../services/ai.service';

export async function checkDrugInteractions(req: AuthRequest, res: Response) {
  try {
    const { medications } = req.body;
    const result = await aiService.checkDrugInteractions(medications);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function checkAllergyConflict(req: AuthRequest, res: Response) {
  try {
    const { patientId, medication } = req.body;
    const allergies = await prisma.allergy.findMany({
      where: { patientId, clinicId: req.user!.clinicId },
    });
    const allergenList = allergies.map((a) => a.allergen);
    const result = await aiService.checkAllergyConflicts(allergenList, medication);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getDoctorBriefing(req: AuthRequest, res: Response) {
  try {
    const { patientId } = req.params;
    const clinicId = req.user!.clinicId;

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const [vitals, diagnoses, prescriptions, allergies, conditions, labResults, appointments] = await Promise.all([
      prisma.vital.findMany({ where: { patientId, clinicId }, orderBy: { recordedAt: 'desc' }, take: 5 }),
      prisma.diagnosis.findMany({ where: { patientId, clinicId } }),
      prisma.prescription.findMany({ where: { patientId, clinicId } }),
      prisma.allergy.findMany({ where: { patientId, clinicId } }),
      prisma.condition.findMany({ where: { patientId, clinicId } }),
      prisma.labResult.findMany({ where: { patientId, clinicId }, orderBy: { orderedAt: 'desc' }, take: 10 }),
      prisma.appointment.findMany({ where: { patientId, clinicId }, orderBy: { dateTime: 'desc' }, take: 10 }),
    ]);

    const briefing = await aiService.generateDoctorBriefing({
      patient: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth?.toISOString() || null,
      },
      history: {
        vitals: vitals.map((v) => ({ ...v, recordedAt: v.recordedAt.toISOString() })),
        diagnoses: diagnoses.map((d) => ({ ...d, diagnosedAt: d.diagnosedAt.toISOString() })),
        prescriptions: prescriptions.map((p) => ({ ...p, startDate: p.startDate.toISOString() })),
        allergies,
        conditions,
        labResults: labResults.map((l) => ({ ...l, orderedAt: l.orderedAt.toISOString() })),
        appointments: appointments.map((a) => ({ dateTime: a.dateTime.toISOString(), status: a.status, notes: a.notes })),
      },
      appointmentReason: req.query.reason as string | undefined,
    });

    res.json(briefing);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
