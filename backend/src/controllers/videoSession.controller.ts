import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthRequest } from '../types/express.d';

const prisma = new PrismaClient();

export async function getSessions(req: AuthRequest, res: Response) {
  try {
    const { status } = req.query;
    const where: any = { clinicId: req.user!.clinicId };
    if (status) where.status = status;
    const sessions = await prisma.videoSession.findMany({
      where,
      include: {
        doctor: { select: { firstName: true, lastName: true } },
        patient: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createSession(req: AuthRequest, res: Response) {
  try {
    const { patientId, doctorId, appointmentId, notes } = req.body;
    const session = await prisma.videoSession.create({
      data: {
        clinicId: req.user!.clinicId,
        patientId,
        doctorId: doctorId || req.user!.id,
        appointmentId,
        notes,
      },
    });
    res.json(session);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function getSession(req: AuthRequest, res: Response) {
  try {
    const session = await prisma.videoSession.findFirst({
      where: { id: req.params.id, clinicId: req.user!.clinicId },
      include: {
        doctor: { select: { firstName: true, lastName: true, specialty: true } },
        patient: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function updateSession(req: AuthRequest, res: Response) {
  try {
    const { status, notes } = req.body;
    const data: any = {};
    if (status) {
      data.status = status;
      if (status === 'IN_PROGRESS') data.startedAt = new Date();
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        data.endedAt = new Date();
        const session = await prisma.videoSession.findUnique({ where: { id: req.params.id } });
        if (session?.startedAt) {
          data.duration = Math.round((Date.now() - session.startedAt.getTime()) / 60000);
        }
      }
    }
    if (notes !== undefined) data.notes = notes;
    const session = await prisma.videoSession.update({
      where: { id: req.params.id },
      data,
    });
    res.json(session);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function joinByRoom(req: AuthRequest, res: Response) {
  try {
    const session = await prisma.videoSession.findUnique({
      where: { roomId: req.params.roomId },
      include: {
        doctor: { select: { firstName: true, lastName: true, specialty: true } },
        patient: { select: { firstName: true, lastName: true } },
      },
    });
    if (!session) return res.status(404).json({ error: 'Room not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
