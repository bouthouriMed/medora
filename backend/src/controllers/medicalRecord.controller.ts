import { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../types/express.d';

export const getPatientMedicalHistory = async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.params.patientId as string;
    const clinicId = req.user!.clinicId;

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
      include: {
        vitals: { orderBy: { recordedAt: 'desc' }, take: 50 },
        diagnoses: { orderBy: { diagnosedAt: 'desc' } },
        prescriptions: { orderBy: { createdAt: 'desc' } },
        allergies: { orderBy: { createdAt: 'desc' } },
        conditions: { orderBy: { createdAt: 'desc' } },
        medicalRecords: { orderBy: { date: 'desc' } },
        labResults: { orderBy: { orderedAt: 'desc' }, take: 20 },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient history' });
  }
};

export const createVital = async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.user!.clinicId;
    const { patientId, bloodPressureSystolic, bloodPressureDiastolic, heartRate, temperature, weight, height, oxygenSat, respiratoryRate, notes } = req.body as any;

    const bmi = weight && height ? weight / ((height / 100) ** 2) : null;

    const vital = await prisma.vital.create({
      data: {
        patientId,
        clinicId,
        bloodPressureSystolic: bloodPressureSystolic ? Number(bloodPressureSystolic) : null,
        bloodPressureDiastolic: bloodPressureDiastolic ? Number(bloodPressureDiastolic) : null,
        heartRate: heartRate ? Number(heartRate) : null,
        temperature: temperature ? Number(temperature) : null,
        weight: weight ? Number(weight) : null,
        height: height ? Number(height) : null,
        bmi: bmi || null,
        oxygenSat: oxygenSat ? Number(oxygenSat) : null,
        respiratoryRate: respiratoryRate ? Number(respiratoryRate) : null,
        notes,
        createdBy: req.user!.id,
      },
    });

    res.json(vital);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create vital' });
  }
};

export const createDiagnosis = async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.user!.clinicId;
    const { patientId, icdCode, description, status, notes, diagnosedAt } = req.body as any;

    const diagnosis = await prisma.diagnosis.create({
      data: {
        patientId,
        clinicId,
        icdCode,
        description,
        status: status || 'ACTIVE',
        notes,
        diagnosedAt: diagnosedAt ? new Date(diagnosedAt) : new Date(),
        createdBy: req.user!.id,
      },
    });

    res.json(diagnosis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create diagnosis' });
  }
};

export const updateDiagnosis = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const clinicId = req.user!.clinicId;
    const { status, notes } = req.body as any;

    const diagnosis = await prisma.diagnosis.update({
      where: { id },
      data: { status, notes },
    });

    res.json(diagnosis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update diagnosis' });
  }
};

export const deleteDiagnosis = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.diagnosis.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete diagnosis' });
  }
};

export const createPrescription = async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.user!.clinicId;
    const { patientId, medication, dosage, frequency, duration, instructions, refills, startDate, endDate } = req.body as any;

    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        clinicId,
        medication,
        dosage,
        frequency,
        duration,
        instructions,
        refills: refills || 0,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        prescribedById: req.user!.id,
      },
    });

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create prescription' });
  }
};

export const updatePrescription = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, refillsUsed } = req.body as any;

    const prescription = await prisma.prescription.update({
      where: { id },
      data: { status, refillsUsed },
    });

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update prescription' });
  }
};

export const deletePrescription = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.prescription.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete prescription' });
  }
};

export const createAllergy = async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.user!.clinicId;
    const { patientId, allergen, severity, reaction } = req.body as any;

    const allergy = await prisma.allergy.create({
      data: {
        patientId,
        clinicId,
        allergen,
        severity,
        reaction,
      },
    });

    res.json(allergy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create allergy' });
  }
};

export const deleteAllergy = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.allergy.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete allergy' });
  }
};

export const createCondition = async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.user!.clinicId;
    const { patientId, name, status, notes, diagnosedAt } = req.body as any;

    const condition = await prisma.condition.create({
      data: {
        patientId,
        clinicId,
        name,
        status: status || 'ACTIVE',
        notes,
        diagnosedAt: diagnosedAt ? new Date(diagnosedAt) : null,
      },
    });

    res.json(condition);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create condition' });
  }
};

export const deleteCondition = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.condition.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete condition' });
  }
};

export const createMedicalRecord = async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.user!.clinicId;
    const { patientId, type, title, description, date, data } = req.body as any;

    const record = await prisma.medicalRecord.create({
      data: {
        patientId,
        clinicId,
        type,
        title,
        description,
        date: date ? new Date(date) : new Date(),
        data,
        createdBy: req.user!.id,
      },
    });

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create medical record' });
  }
};
