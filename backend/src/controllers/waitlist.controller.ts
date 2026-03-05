import { Response } from 'express';
import type { AuthRequest } from '../types/express.d';
import prisma from '../utils/prisma';

export async function getWaitlist(req: AuthRequest, res: Response) {
  try {
    const { status } = req.query;
    const where: any = { clinicId: req.user!.clinicId };
    if (status) where.status = status;

    const entries = await prisma.waitlistEntry.findMany({
      where,
      include: { patient: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createWaitlistEntry(req: AuthRequest, res: Response) {
  try {
    const entry = await prisma.waitlistEntry.create({
      data: {
        ...req.body,
        clinicId: req.user!.clinicId,
        preferredDate: req.body.preferredDate ? new Date(req.body.preferredDate) : null,
      },
      include: { patient: true },
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function updateWaitlistEntry(req: AuthRequest, res: Response) {
  try {
    const entry = await prisma.waitlistEntry.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        preferredDate: req.body.preferredDate ? new Date(req.body.preferredDate) : undefined,
      },
      include: { patient: true },
    });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function deleteWaitlistEntry(req: AuthRequest, res: Response) {
  try {
    await prisma.waitlistEntry.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function bookFromWaitlist(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { dateTime, doctorId } = req.body;

    const entry = await prisma.waitlistEntry.findUnique({ where: { id } });
    if (!entry) return res.status(404).json({ error: 'Waitlist entry not found' });

    const appointment = await prisma.appointment.create({
      data: {
        patientId: entry.patientId,
        doctorId: doctorId || entry.doctorId!,
        clinicId: entry.clinicId,
        dateTime: new Date(dateTime),
      },
    });

    await prisma.waitlistEntry.update({
      where: { id },
      data: { status: 'BOOKED', bookedAt: new Date() },
    });

    res.json({ appointment, waitlistEntry: { id, status: 'BOOKED' } });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
