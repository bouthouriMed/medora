import prisma from '../utils/prisma';

export class AppointmentRepository {
  async create(data: {
    patientId: string;
    doctorId: string;
    clinicId: string;
    dateTime: Date;
    notes?: string;
  }) {
    return prisma.appointment.create({ data });
  }

  async findById(id: string, clinicId: string) {
    return prisma.appointment.findFirst({
      where: { id, clinicId, deletedAt: null },
      include: { patient: true, doctor: true },
    });
  }

  async findByClinic(clinicId: string, startDate?: Date, endDate?: Date) {
    const where: Record<string, unknown> = { clinicId, deletedAt: null };

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.dateTime = { gte: start, lte: end };
      } else {
        where.dateTime = { gte: start };
      }
    }

    return prisma.appointment.findMany({
      where,
      include: { patient: true, doctor: true },
      orderBy: { dateTime: 'desc' },
    });
  }

  async findByDoctor(doctorId: string, clinicId: string, startDate?: Date, endDate?: Date) {
    const where: Record<string, unknown> = { doctorId, clinicId, deletedAt: null };

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.dateTime = {
        gte: start,
        lte: end,
      };
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(startDate);
      end.setHours(23, 59, 59, 999);
      where.dateTime = {
        gte: start,
        lte: end,
      };
    }

    return prisma.appointment.findMany({
      where,
      include: { patient: true },
      orderBy: { dateTime: 'desc' },
    });
  }

  async findByPatient(patientId: string, clinicId: string) {
    return prisma.appointment.findMany({
      where: { patientId, clinicId, deletedAt: null },
      include: { doctor: true },
      orderBy: { dateTime: 'desc' },
    });
  }

  async update(id: string, clinicId: string, data: {
    dateTime?: Date;
    status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    notes?: string;
  }) {
    return prisma.appointment.updateMany({
      where: { id, clinicId },
      data,
    });
  }

  async delete(id: string, clinicId: string) {
    return prisma.appointment.updateMany({
      where: { id, clinicId },
      data: { deletedAt: new Date() },
    });
  }
}

export default new AppointmentRepository();
