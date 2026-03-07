import { Response } from 'express';
import appointmentService from '../services/appointment.service';
import notificationService from '../services/notification.service';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../types/express.d';

export class AppointmentController {
  async create(req: AuthRequest, res: Response) {
    try {
      const appointment = await appointmentService.create(req.user!.clinicId, req.body);
      res.status(201).json(appointment);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async getAll(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, filter } = req.query;

      const parseLocalDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      };

      let start: Date | undefined;
      let end: Date | undefined;

      if (filter === 'upcoming') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        start = tomorrow;
      } else if (startDate && endDate) {
        start = parseLocalDate(startDate as string);
        end = parseLocalDate(endDate as string);
        end.setHours(23, 59, 59, 999);
      } else if (startDate) {
        start = parseLocalDate(startDate as string);
        const endDateSingle = parseLocalDate(startDate as string);
        endDateSingle.setHours(23, 59, 59, 999);
        end = endDateSingle;
      }

      const appointments = await appointmentService.getAll(req.user!.clinicId, start, end);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const appointment = await appointmentService.getById(req.params.id as string, req.user!.clinicId);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getByPatient(req: AuthRequest, res: Response) {
    try {
      const appointments = await appointmentService.getByPatient(
        req.params.patientId as string,
        req.user!.clinicId
      );
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const appointmentId = req.params.id as string;
      const clinicId = req.user!.clinicId;
      const { status } = req.body;

      // Fetch appointment before update to get patient/doctor info for notifications
      const existing = await prisma.appointment.findFirst({
        where: { id: appointmentId, clinicId, deletedAt: null },
        include: { patient: true, doctor: true },
      });

      const result = await appointmentService.update(appointmentId, clinicId, req.body);

      // Fire-and-forget notifications on status changes
      if (status && existing?.patient && existing?.doctor) {
        const doctorName = `${existing.doctor.firstName} ${existing.doctor.lastName}`;
        const patientName = `${existing.patient.firstName} ${existing.patient.lastName}`;
        const dateTime = new Date(existing.dateTime);

        if (status === 'CONFIRMED') {
          // Notify the doctor's own dashboard that they confirmed
          notificationService.create({
            userId: existing.doctorId,
            type: 'APPOINTMENT_APPROVED',
            title: 'Appointment Confirmed',
            message: `You confirmed ${patientName}'s appointment for ${dateTime.toLocaleDateString()} at ${dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
            priority: 'LOW',
            actionUrl: `/appointments?highlight=${appointmentId}`,
            metadata: { appointmentId, patientName },
          }).catch(() => {});
        } else if (status === 'CANCELLED') {
          // Notify doctor about cancellation
          notificationService.create({
            userId: existing.doctorId,
            type: 'APPOINTMENT_CANCELLED',
            title: 'Appointment Cancelled',
            message: `${patientName}'s appointment for ${dateTime.toLocaleDateString()} has been cancelled.`,
            priority: 'NORMAL',
            actionUrl: `/appointments`,
            metadata: { appointmentId, patientName },
          }).catch(() => {});
        } else if (status === 'CHECKED_IN') {
          // Notify doctor that patient has checked in
          notificationService.create({
            userId: existing.doctorId,
            type: 'APPOINTMENT_REMINDER',
            title: `${patientName} has checked in`,
            message: `${patientName} has arrived and is ready for their ${dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} appointment.`,
            priority: 'HIGH',
            actionUrl: `/appointments?highlight=${appointmentId}`,
            actionLabel: 'Start Consultation',
            metadata: { appointmentId, patientName },
          }).catch(() => {});
        } else if (status === 'COMPLETED') {
          // Notify doctor about completion
          notificationService.create({
            userId: existing.doctorId,
            type: 'APPOINTMENT_APPROVED',
            title: 'Visit Completed',
            message: `Visit with ${patientName} has been completed.`,
            priority: 'LOW',
            actionUrl: `/appointments?highlight=${appointmentId}`,
            metadata: { appointmentId, patientName },
          }).catch(() => {});
        }
      }

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async cancel(req: AuthRequest, res: Response) {
    try {
      await appointmentService.cancel(req.params.id as string, req.user!.clinicId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async complete(req: AuthRequest, res: Response) {
    try {
      await appointmentService.complete(req.params.id as string, req.user!.clinicId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async completeWithInvoice(req: AuthRequest, res: Response) {
    try {
      const appointmentId = req.params.id;
      const clinicId = req.user!.clinicId;
      const { items, notes } = req.body;

      const appointment = await prisma.appointment.findFirst({
        where: { id: appointmentId, clinicId, deletedAt: null },
        include: { 
          patient: true, 
          doctor: true,
          clinic: true,
        },
      });

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      if (appointment.status === 'COMPLETED') {
        return res.status(400).json({ error: 'Appointment already completed' });
      }

      const clinicSettings = await prisma.clinicSettings.findUnique({
        where: { clinicId },
      });

      const consultationFee = clinicSettings?.consultationFee || 100.00;

      const lineItems = items && items.length > 0 ? items : [
        { description: 'Consultation Fee', amount: consultationFee, quantity: 1 }
      ];

      const subtotal = lineItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0);

      const invoice = await prisma.invoice.create({
        data: {
          patientId: appointment.patientId,
          appointmentId: appointment.id,
          clinicId,
          amount: subtotal,
          status: 'UNPAID',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          items: lineItems,
          notes: notes || null,
        },
      });

      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED' },
      });

      res.json({ 
        appointment: { ...appointment, status: 'COMPLETED' }, 
        invoice 
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await appointmentService.delete(req.params.id as string, req.user!.clinicId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export default new AppointmentController();
