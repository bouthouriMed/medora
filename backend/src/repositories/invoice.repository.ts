import prisma from '../utils/prisma';

export class InvoiceRepository {
  async create(data: {
    appointmentId: string;
    patientId: string;
    clinicId: string;
    amount: number;
    dueDate?: Date;
  }) {
    return prisma.invoice.create({ data });
  }

  async findById(id: string, clinicId: string) {
    return prisma.invoice.findFirst({
      where: { id, clinicId },
      include: { patient: true, appointment: true },
    });
  }

  async findByClinic(clinicId: string, status?: 'PAID' | 'UNPAID') {
    const where: Record<string, unknown> = { clinicId };

    if (status) {
      where.status = status;
    }

    return prisma.invoice.findMany({
      where,
      include: { patient: true, appointment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByPatient(patientId: string, clinicId: string) {
    return prisma.invoice.findMany({
      where: { patientId, clinicId },
      include: { appointment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findUnpaid(clinicId: string) {
    return prisma.invoice.findMany({
      where: { clinicId, status: 'UNPAID' },
      include: { patient: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRevenueSummary(clinicId: string, startDate: Date, endDate: Date) {
    const result = await prisma.invoice.aggregate({
      where: {
        clinicId,
        status: 'PAID',
        paidAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    });

    return {
      total: result._sum.amount || 0,
      count: result._count,
    };
  }

  async update(id: string, clinicId: string, data: {
    status?: 'PAID' | 'UNPAID';
    paidAt?: Date;
  }) {
    return prisma.invoice.updateMany({
      where: { id, clinicId },
      data,
    });
  }

  async delete(id: string, clinicId: string) {
    return prisma.invoice.delete({
      where: { id },
    });
  }
}

export default new InvoiceRepository();
