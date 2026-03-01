import { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../types/express.d';

export const getAllTags = async (req: AuthRequest, res: Response) => {
  try {
    const { clinicId } = req.user!;
    const tags = await prisma.tag.findMany({
      where: { clinicId },
      include: {
        _count: { select: { patientTags: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(tags.map(t => ({ ...t, patientCount: t._count.patientTags })));
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
};

export const createTag = async (req: AuthRequest, res: Response) => {
  try {
    const { clinicId } = req.user!;
    const { name, color } = req.body;
    
    const tag = await prisma.tag.create({
      data: { name, color: color || '#6366f1', clinicId },
    });
    res.json({ ...tag, patientCount: 0 });
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
};

export const deleteTag = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { clinicId } = req.user!;
    
    await prisma.tag.deleteMany({
      where: { id, clinicId },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
};

export const addTagToPatient = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId, tagId } = req.body as { patientId: string; tagId: string };
    const { clinicId } = req.user!;
    
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
    });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, clinicId },
    });
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    await prisma.patientTag.upsert({
      where: { patientId_tagId: { patientId, tagId } },
      update: {},
      create: { patientId, tagId },
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Add tag to patient error:', error);
    res.status(500).json({ error: 'Failed to add tag to patient' });
  }
};

export const removeTagFromPatient = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId, tagId } = req.params as { patientId: string; tagId: string };
    const { clinicId } = req.user!;
    
    if (!patientId || !tagId) {
      return res.status(400).json({ error: 'Missing patientId or tagId' });
    }
    
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
    });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const result = await prisma.patientTag.deleteMany({
      where: { patientId, tagId },
    });
    
    res.json({ success: true, deleted: result.count });
  } catch (error) {
    console.error('Remove tag from patient error:', error);
    res.status(500).json({ error: 'Failed to remove tag from patient' });
  }
};

export const getPatientTags = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params as { patientId: string };
    const { clinicId } = req.user!;
    
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
    });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const patientTags = await prisma.patientTag.findMany({
      where: { patientId },
      include: { tag: true },
    });
    
    res.json(patientTags.map((pt: { tag: unknown }) => pt.tag));
  } catch (error) {
    console.error('Get patient tags error:', error);
    res.status(500).json({ error: 'Failed to fetch patient tags' });
  }
};
