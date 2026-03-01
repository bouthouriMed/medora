import { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../types/express.d';

export const getAllRecurringAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const { clinicId } = req.user!;
    const recurring = await prisma.recurringAppointment.findMany({
      where: { clinicId },
      include: {
        patient: true,
        doctor: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(recurring);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recurring appointments' });
  }
};

export const createRecurringAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { clinicId } = req.user!;
    const { patientId, doctorId, frequency, interval, startDate, endDate } = req.body as {
      patientId: string;
      doctorId: string;
      frequency: string;
      interval: number;
      startDate: string;
      endDate?: string;
    };
    
    const recurring = await prisma.recurringAppointment.create({
      data: {
        patientId,
        doctorId,
        clinicId,
        frequency,
        interval,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
      include: { patient: true, doctor: true },
    });
    res.json(recurring);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create recurring appointment' });
  }
};

export const deleteRecurringAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { clinicId } = req.user!;
    
    await prisma.recurringAppointment.deleteMany({
      where: { id, clinicId },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete recurring appointment' });
  }
};

export const processRecurringAppointments = async (clinicId: string) => {
  const now = new Date();
  
  const recurrings = await prisma.recurringAppointment.findMany({
    where: {
      clinicId,
      startDate: { lte: now },
      OR: [
        { endDate: null },
        { endDate: { gte: now } },
      ],
    },
  });
  
  for (const recurring of recurrings) {
    const lastCreated = recurring.startDate;
    const nextDate = new Date(lastCreated);
    
    switch (recurring.frequency) {
      case 'DAILY':
        nextDate.setDate(nextDate.getDate() + recurring.interval);
        break;
      case 'WEEKLY':
        nextDate.setDate(nextDate.getDate() + (7 * recurring.interval));
        break;
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + recurring.interval);
        break;
    }
    
    if (nextDate <= now) {
      await prisma.appointment.create({
        data: {
          patientId: recurring.patientId,
          doctorId: recurring.doctorId,
          clinicId: recurring.clinicId,
          dateTime: nextDate,
          status: 'SCHEDULED',
        },
      });
      
      await prisma.recurringAppointment.update({
        where: { id: recurring.id },
        data: { startDate: nextDate },
      });
    }
  }
};
