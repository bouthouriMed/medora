import { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../types/express.d';

export const getAllNoteTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const { clinicId } = req.user!;
    const { type } = req.query as { type?: string };
    
    const where: any = { clinicId };
    if (type) where.type = type;
    
    const templates = await prisma.noteTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch note templates' });
  }
};

export const createNoteTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { clinicId } = req.user!;
    const { name, content } = req.body;
    
    const template = await prisma.noteTemplate.create({
      data: { name, content, clinicId },
    });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create note template' });
  }
};

export const deleteNoteTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { clinicId } = req.user!;
    
    await prisma.noteTemplate.deleteMany({
      where: { id, clinicId },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note template' });
  }
};
