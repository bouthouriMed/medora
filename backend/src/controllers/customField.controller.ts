import { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../types/express.d';

export const getAllCustomFields = async (req: AuthRequest, res: Response) => {
  try {
    const { clinicId } = req.user!;
    const fields = await prisma.customField.findMany({
      where: { clinicId },
      orderBy: { name: 'asc' },
    });
    res.json(fields);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch custom fields' });
  }
};

export const createCustomField = async (req: AuthRequest, res: Response) => {
  try {
    const { clinicId } = req.user!;
    const { name, fieldType, options } = req.body;
    
    const field = await prisma.customField.create({
      data: { 
        name, 
        fieldType: fieldType || 'TEXT', 
        options: options || null,
        clinicId 
      },
    });
    res.json(field);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create custom field' });
  }
};

export const deleteCustomField = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { clinicId } = req.user!;
    
    await prisma.customField.deleteMany({
      where: { id, clinicId },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete custom field' });
  }
};

export const getPatientCustomFields = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params as { patientId: string };
    const { clinicId } = req.user!;
    
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
    });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const customFields = await prisma.customField.findMany({
      where: { clinicId },
      include: {
        patientCustomFieldValues: {
          where: { patientId },
        },
      },
      orderBy: { name: 'asc' },
    });
    
    const result = customFields.map((f: any) => ({
      id: f.id,
      name: f.name,
      fieldType: f.fieldType,
      options: f.options,
      required: f.required,
      value: f.patientCustomFieldValues[0]?.value || null,
    }));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient custom fields' });
  }
};

export const savePatientCustomField = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params as { patientId: string };
    const { clinicId } = req.user!;
    const { customFieldId, value } = req.body as { customFieldId: string; value: string };
    
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
    });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const field = await prisma.customField.findFirst({
      where: { id: customFieldId, clinicId },
    });
    if (!field) {
      return res.status(404).json({ error: 'Custom field not found' });
    }
    
    await prisma.patientCustomFieldValue.upsert({
      where: { patientId_customFieldId: { patientId, customFieldId } },
      update: { value },
      create: { patientId, customFieldId, value },
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save custom field value' });
  }
};
