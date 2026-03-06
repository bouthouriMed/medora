import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ReminderService {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  async getUpcomingAppointments(hoursAhead: number = 24) {
    const now = new Date();
    const cutoff = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    return prisma.appointment.findMany({
      where: {
        dateTime: { gte: now, lte: cutoff },
        status: 'SCHEDULED',
      },
      include: {
        patient: { select: { firstName: true, lastName: true, email: true, phone: true } },
        doctor: { select: { firstName: true, lastName: true } },
        clinic: { select: { name: true, phone: true, email: true } },
      },
    });
  }

  async generateReminders() {
    const appointments = await this.getUpcomingAppointments(24);
    const reminders = [];

    for (const apt of appointments) {
      if (!apt.patient.email && !apt.patient.phone) continue;

      const settings = await prisma.clinicSettings.findUnique({
        where: { clinicId: apt.clinicId },
      });

      if (!settings?.emailNotifications) continue;

      reminders.push({
        appointmentId: apt.id,
        patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
        patientEmail: apt.patient.email,
        patientPhone: apt.patient.phone,
        doctorName: `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`,
        clinicName: apt.clinic.name,
        dateTime: apt.dateTime,
        type: 'Appointment',
        message: `Reminder: You have an appointment with Dr. ${apt.doctor.firstName} ${apt.doctor.lastName} at ${apt.clinic.name} on ${apt.dateTime.toLocaleString()}.`,
      });

      // Log the reminder in audit
      await prisma.auditLog.create({
        data: {
          clinicId: apt.clinicId,
          action: 'REMINDER_SENT',
          entityType: 'APPOINTMENT',
          entityId: apt.id,
          details: {
            patientEmail: apt.patient.email,
            dateTime: apt.dateTime,
          },
        },
      }).catch(() => {});
    }

    return reminders;
  }

  async getPendingReminders(clinicId: string) {
    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        dateTime: { gte: new Date() },
        status: 'SCHEDULED',
      },
      include: {
        patient: { select: { firstName: true, lastName: true, email: true, phone: true } },
        doctor: { select: { firstName: true, lastName: true } },
      },
      orderBy: { dateTime: 'asc' },
      take: 50,
    });

    return appointments.map(apt => ({
      appointmentId: apt.id,
      patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
      patientEmail: apt.patient.email,
      patientPhone: apt.patient.phone,
      doctorName: `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`,
      dateTime: apt.dateTime,
      hoursUntil: Math.round((apt.dateTime.getTime() - Date.now()) / (1000 * 60 * 60)),
      canSendReminder: !!(apt.patient.email || apt.patient.phone),
    }));
  }

  start(intervalMinutes: number = 60) {
    if (this.intervalId) return;
    console.log(`Reminder service started (checking every ${intervalMinutes} min)`);
    this.intervalId = setInterval(async () => {
      try {
        const reminders = await this.generateReminders();
        if (reminders.length > 0) {
          console.log(`Generated ${reminders.length} appointment reminders`);
        }
      } catch (error) {
        console.error('Reminder service error:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export default new ReminderService();
