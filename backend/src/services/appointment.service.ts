import appointmentRepository from '../repositories/appointment.repository';
import prisma from '../utils/prisma';
import notificationService from './notification.service';
import type { NotificationType, NotificationPriority } from '@prisma/client';

export class AppointmentService {
  async create(clinicId: string, data: {
    patientId: string;
    doctorId: string;
    dateTime: Date;
    notes?: string;
  }) {
    return appointmentRepository.create({ ...data, clinicId });
  }

  async getById(id: string, clinicId: string) {
    return appointmentRepository.findById(id, clinicId);
  }

  async getAll(clinicId: string, startDate?: Date, endDate?: Date) {
    console.log('==== SERVICE getAll ====');
    console.log('startDate:', startDate);
    console.log('endDate:', endDate);
    return appointmentRepository.findByClinic(clinicId, startDate, endDate);
  }

  async getByDoctor(doctorId: string, clinicId: string, startDate?: Date, endDate?: Date) {
    return appointmentRepository.findByDoctor(doctorId, clinicId, startDate, endDate);
  }

  async getByPatient(patientId: string, clinicId: string) {
    return appointmentRepository.findByPatient(patientId, clinicId);
  }

  async update(id: string, clinicId: string, data: {
    dateTime?: Date;
    status?: string;
    notes?: string;
  }) {
    return appointmentRepository.update(id, clinicId, data);
  }

  async cancel(id: string, clinicId: string) {
    return appointmentRepository.update(id, clinicId, { status: 'CANCELLED' });
  }

  async complete(id: string, clinicId: string) {
    return appointmentRepository.update(id, clinicId, { status: 'COMPLETED' });
  }

  async markNoShow(id: string, clinicId: string) {
    return appointmentRepository.update(id, clinicId, { status: 'NO_SHOW' });
  }

  async delete(id: string, clinicId: string) {
    return appointmentRepository.delete(id, clinicId);
  }

  async getWithDetails(id: string, clinicId: string) {
    return prisma.appointment.findFirst({
      where: { id, clinicId, deletedAt: null },
      include: { patient: true, doctor: true, clinic: true },
    });
  }

  async completeWithInvoice(appointmentId: string, clinicId: string, items?: Array<{ description: string; amount: number; quantity: number }>, notes?: string) {
    const appointment = await this.getWithDetails(appointmentId, clinicId);
    if (!appointment) throw new Error('Appointment not found');
    if (appointment.status === 'COMPLETED') throw new Error('Appointment already completed');

    const clinicSettings = await prisma.clinicSettings.findUnique({ where: { clinicId } });
    const consultationFee = clinicSettings?.consultationFee || 100.00;

    const lineItems = items && items.length > 0 ? items : [
      { description: 'Consultation Fee', amount: consultationFee, quantity: 1 }
    ];
    const subtotal = lineItems.reduce((sum: number, item: { amount: number; quantity: number }) => sum + (item.amount * item.quantity), 0);

    const itemsSummary = lineItems.map((i: { description: string; amount: number; quantity: number }) =>
      `${i.description}: $${i.amount} x ${i.quantity}`
    ).join('; ');

    const invoice = await prisma.invoice.create({
      data: {
        patientId: appointment.patientId,
        appointmentId: appointment.id,
        clinicId,
        amount: subtotal,
        status: 'UNPAID',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: notes ? `${notes}\n\nItems: ${itemsSummary}` : `Items: ${itemsSummary}`,
      },
    });

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'COMPLETED' },
    });

    return { appointment: { ...appointment, status: 'COMPLETED' }, invoice };
  }

  async notifyOnStatusChange(appointmentId: string, clinicId: string, status: string) {
    const existing = await this.getWithDetails(appointmentId, clinicId);
    if (!existing?.patient || !existing?.doctor) return;

    const patientName = `${existing.patient.firstName} ${existing.patient.lastName}`;
    const dateTime = new Date(existing.dateTime);
    const timeStr = dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = dateTime.toLocaleDateString();

    const notifications: Record<string, { type: NotificationType; title: string; message: string; priority: NotificationPriority }> = {
      CONFIRMED: {
        type: 'APPOINTMENT_APPROVED',
        title: 'Appointment Confirmed',
        message: `You confirmed ${patientName}'s appointment for ${dateStr} at ${timeStr}.`,
        priority: 'LOW',
      },
      CANCELLED: {
        type: 'APPOINTMENT_CANCELLED',
        title: 'Appointment Cancelled',
        message: `${patientName}'s appointment for ${dateStr} has been cancelled.`,
        priority: 'NORMAL',
      },
      CHECKED_IN: {
        type: 'APPOINTMENT_REMINDER',
        title: `${patientName} has checked in`,
        message: `${patientName} has arrived and is ready for their ${timeStr} appointment.`,
        priority: 'HIGH',
      },
      COMPLETED: {
        type: 'APPOINTMENT_APPROVED',
        title: 'Visit Completed',
        message: `Visit with ${patientName} has been completed.`,
        priority: 'LOW',
      },
    };

    const notification = notifications[status];
    if (notification) {
      notificationService.create({
        userId: existing.doctorId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        actionUrl: `/appointments?highlight=${appointmentId}`,
        metadata: { appointmentId, patientName },
      }).catch(() => {});
    }
  }
}

export default new AppointmentService();
