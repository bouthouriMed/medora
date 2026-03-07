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

    // Create the actual appointment (status CONFIRMED since doctor already approved it)
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

    // Send notification to patient if email provided (for portal patients)
    if (patient.portalToken) {
      // Patient has portal access - create notification
      // Note: We need patient user ID for notifications, but portal patients don't have users
      // Instead, we can send an email notification (not implemented yet)
      // For now, just return success
    }

    // Notify the doctor who approved (optional - they already know)
    res.json({ 
      appointment, 
      patient,
      message: patient ? `Appointment created. Patient "${patient.firstName} ${patient.lastName}" already existed.` : `New patient created and appointment scheduled.`
    });
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
      include: { doctor: true },
    });

    if (!request) {
      return res.status(404).json({ error: 'Appointment request not found or already processed' });
    }

    await prisma.appointmentRequest.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    // Note: In production, you would send an email notification to the patient here
    // The patient email is in request.patientEmail
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
