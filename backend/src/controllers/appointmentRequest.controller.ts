import { Response } from 'express';
import prisma from '../utils/prisma';
import notificationService from '../services/notification.service';
import type { AuthRequest } from '../types/express.d';

export const getAppointmentRequests = async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.user!.clinicId;
    const { status } = req.query;

    const where: Record<string, unknown> = { clinicId };
    if (status) {
      where.status = status;
    }

    const requests = await prisma.appointmentRequest.findMany({
      where,
      include: { doctor: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const approveAppointmentRequest = async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.user!.clinicId;
    const { id } = req.params;

    const request = await prisma.appointmentRequest.findFirst({
      where: { id, clinicId, status: 'PENDING' },
      include: { doctor: true },
    });

    if (!request) {
      return res.status(404).json({ error: 'Appointment request not found or already processed' });
    }

    // Parse patient name (format: "FirstName LastName")
    const nameParts = request.patientName.trim().split(/\s+/);
    const firstName = nameParts[0] || request.patientName;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Check if patient already exists by email
    let patient = null;
    if (request.patientEmail) {
      patient = await prisma.patient.findFirst({
        where: { clinicId, email: request.patientEmail, deletedAt: null },
      });
    }

    // Create patient if not exists
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          firstName,
          lastName,
          email: request.patientEmail || undefined,
          phone: request.patientPhone || undefined,
          clinicId,
          portalToken: crypto.randomUUID() + '-' + Date.now().toString(36),
        },
      });

      // Auto-tag as "Online Booking" if tag exists, or create it
      let onlineTag = await prisma.tag.findFirst({
        where: { clinicId, name: 'Online Booking' },
      });
      if (!onlineTag) {
        onlineTag = await prisma.tag.create({
          data: { name: 'Online Booking', color: '#3b82f6', clinicId },
        });
      }
      await prisma.patientTag.create({
        data: { patientId: patient.id, tagId: onlineTag.id },
      });
    }

    // Create the actual appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: request.doctorId,
        clinicId,
        dateTime: request.requestedDateTime,
        status: 'CONFIRMED',
        notes: request.reason,
      },
    });

    // Mark request as approved
    await prisma.appointmentRequest.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    // Notify patient if they have a userId
    if (patient.portalToken) {
      // Patient doesn't have userId (they're external), but the appointment is created
    }

    res.json({ appointment, patient });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const rejectAppointmentRequest = async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.user!.clinicId;
    const { id } = req.params;
    const { reason } = req.body;

    const request = await prisma.appointmentRequest.findFirst({
      where: { id, clinicId, status: 'PENDING' },
    });

    if (!request) {
      return res.status(404).json({ error: 'Appointment request not found or already processed' });
    }

    await prisma.appointmentRequest.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
