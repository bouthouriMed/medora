import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthRequest } from '../types/express.d';

const prisma = new PrismaClient();

export async function getClinicGroup(req: AuthRequest, res: Response) {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: req.user!.clinicId },
      select: { clinicGroupId: true },
    });
    if (!clinic?.clinicGroupId) {
      return res.json({ group: null, clinics: [] });
    }
    const group = await prisma.clinicGroup.findUnique({
      where: { id: clinic.clinicGroupId },
      include: {
        clinics: {
          select: { id: true, name: true, address: true, phone: true, email: true, timezone: true, currency: true },
        },
      },
    });
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createClinicGroup(req: AuthRequest, res: Response) {
  try {
    const { name } = req.body;
    const group = await prisma.clinicGroup.create({
      data: {
        name,
        ownerId: req.user!.id,
        clinics: { connect: { id: req.user!.clinicId } },
      },
    });
    res.json(group);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function addClinicToGroup(req: AuthRequest, res: Response) {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: req.user!.clinicId },
      select: { clinicGroupId: true },
    });
    if (!clinic?.clinicGroupId) {
      return res.status(400).json({ error: 'Your clinic is not part of a group' });
    }
    const { clinicName, clinicEmail } = req.body;
    const newClinic = await prisma.clinic.create({
      data: {
        name: clinicName,
        email: clinicEmail,
        clinicGroupId: clinic.clinicGroupId,
      },
    });
    res.json(newClinic);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function getGroupAnalytics(req: AuthRequest, res: Response) {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: req.user!.clinicId },
      select: { clinicGroupId: true },
    });
    if (!clinic?.clinicGroupId) {
      return res.status(400).json({ error: 'Not part of a clinic group' });
    }
    const clinics = await prisma.clinic.findMany({
      where: { clinicGroupId: clinic.clinicGroupId },
      select: { id: true, name: true },
    });
    const clinicIds = clinics.map(c => c.id);

    const [patients, appointments, revenue] = await Promise.all([
      prisma.patient.groupBy({
        by: ['clinicId'],
        where: { clinicId: { in: clinicIds } },
        _count: true,
      }),
      prisma.appointment.groupBy({
        by: ['clinicId'],
        where: { clinicId: { in: clinicIds } },
        _count: true,
      }),
      prisma.invoice.groupBy({
        by: ['clinicId'],
        where: { clinicId: { in: clinicIds }, status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);

    const analytics = clinics.map(c => ({
      clinicId: c.id,
      clinicName: c.name,
      patients: patients.find(p => p.clinicId === c.id)?._count || 0,
      appointments: appointments.find(a => a.clinicId === c.id)?._count || 0,
      revenue: revenue.find(r => r.clinicId === c.id)?._sum?.amount || 0,
    }));

    res.json({ clinics: analytics, total: {
      patients: analytics.reduce((s, a) => s + a.patients, 0),
      appointments: analytics.reduce((s, a) => s + a.appointments, 0),
      revenue: analytics.reduce((s, a) => s + a.revenue, 0),
    }});
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
