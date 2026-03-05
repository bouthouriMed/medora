import { Response } from 'express';
import type { AuthRequest } from '../types/express.d';
import prisma from '../utils/prisma';

export async function getMessages(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const clinicId = req.user!.clinicId;
    const { patientId } = req.query;

    const where: any = {
      clinicId,
      OR: [{ senderId: userId }, { receiverId: userId }],
    };
    if (patientId) where.patientId = patientId;

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getConversation(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { otherId } = req.params;
    const clinicId = req.user!.clinicId;

    const messages = await prisma.message.findMany({
      where: {
        clinicId,
        OR: [
          { senderId: userId, receiverId: otherId },
          { senderId: otherId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        clinicId,
        senderId: otherId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function sendMessage(req: AuthRequest, res: Response) {
  try {
    const message = await prisma.message.create({
      data: {
        clinicId: req.user!.clinicId,
        senderId: req.user!.id,
        senderType: 'STAFF',
        ...req.body,
      },
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getUnreadCount(req: AuthRequest, res: Response) {
  try {
    const count = await prisma.message.count({
      where: {
        clinicId: req.user!.clinicId,
        receiverId: req.user!.id,
        isRead: false,
      },
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function sendPortalMessage(req: any, res: Response) {
  try {
    const { token } = req.params;
    const patient = await prisma.patient.findFirst({ where: { portalToken: token } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const message = await prisma.message.create({
      data: {
        clinicId: patient.clinicId,
        senderId: patient.id,
        senderType: 'PATIENT',
        receiverId: req.body.doctorId,
        receiverType: 'STAFF',
        patientId: patient.id,
        subject: req.body.subject,
        body: req.body.body,
      },
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getPortalMessages(req: any, res: Response) {
  try {
    const { token } = req.params;
    const patient = await prisma.patient.findFirst({ where: { portalToken: token } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const messages = await prisma.message.findMany({
      where: {
        clinicId: patient.clinicId,
        patientId: patient.id,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
