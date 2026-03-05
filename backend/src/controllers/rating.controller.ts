import { Response } from 'express';
import type { AuthRequest } from '../types/express.d';
import prisma from '../utils/prisma';

export async function getDoctorRatings(req: AuthRequest, res: Response) {
  try {
    const { doctorId } = req.params;
    const ratings = await prisma.doctorRating.findMany({
      where: { clinicId: req.user!.clinicId, doctorId },
      orderBy: { createdAt: 'desc' },
    });

    const avg = ratings.length > 0 ? {
      bedsideManner: Math.round(ratings.reduce((s, r) => s + r.bedsideManner, 0) / ratings.length * 10) / 10,
      waitTime: Math.round(ratings.reduce((s, r) => s + r.waitTime, 0) / ratings.length * 10) / 10,
      clarity: Math.round(ratings.reduce((s, r) => s + r.clarity, 0) / ratings.length * 10) / 10,
      overall: Math.round(ratings.reduce((s, r) => s + r.overall, 0) / ratings.length * 10) / 10,
      count: ratings.length,
    } : null;

    res.json({ ratings, averages: avg });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getAllDoctorRatingSummaries(req: AuthRequest, res: Response) {
  try {
    const clinicId = req.user!.clinicId;
    const doctors = await prisma.user.findMany({
      where: { clinicId, role: 'DOCTOR', deletedAt: null },
      select: { id: true, firstName: true, lastName: true, specialty: true },
    });

    const ratings = await prisma.doctorRating.findMany({
      where: { clinicId },
    });

    const summaries = doctors.map((doc) => {
      const docRatings = ratings.filter((r) => r.doctorId === doc.id);
      const count = docRatings.length;
      return {
        doctor: doc,
        count,
        averages: count > 0 ? {
          bedsideManner: Math.round(docRatings.reduce((s, r) => s + r.bedsideManner, 0) / count * 10) / 10,
          waitTime: Math.round(docRatings.reduce((s, r) => s + r.waitTime, 0) / count * 10) / 10,
          clarity: Math.round(docRatings.reduce((s, r) => s + r.clarity, 0) / count * 10) / 10,
          overall: Math.round(docRatings.reduce((s, r) => s + r.overall, 0) / count * 10) / 10,
        } : null,
      };
    });

    res.json(summaries);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createRating(req: AuthRequest, res: Response) {
  try {
    const rating = await prisma.doctorRating.create({
      data: {
        ...req.body,
        clinicId: req.user!.clinicId,
      },
    });
    res.status(201).json(rating);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createPublicRating(req: any, res: Response) {
  try {
    const { clinicId } = req.params;
    const rating = await prisma.doctorRating.create({
      data: {
        ...req.body,
        clinicId,
        isAnonymous: true,
      },
    });
    res.status(201).json(rating);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
