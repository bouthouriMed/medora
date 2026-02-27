import appointmentRepository from '../repositories/appointment.repository';
import invoiceRepository from '../repositories/invoice.repository';
import prisma from '../utils/prisma';

export class DashboardService {
  async getDashboard(clinicId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const todayAppointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        dateTime: { gte: today, lt: tomorrow },
        deletedAt: null,
      },
      include: { patient: true, doctor: true },
      orderBy: { dateTime: 'asc' },
    });

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        dateTime: { gte: tomorrow },
        status: 'SCHEDULED',
        deletedAt: null,
      },
      include: { patient: true, doctor: true },
      orderBy: { dateTime: 'asc' },
      take: 10,
    });

    const revenue = await invoiceRepository.getRevenueSummary(clinicId, startOfMonth, endOfMonth);

    const unpaidInvoices = await prisma.invoice.count({
      where: { clinicId, status: 'UNPAID', deletedAt: null },
    });

    return {
      todayAppointments,
      upcomingAppointments,
      monthlyRevenue: revenue.total,
      monthlyRevenueCount: revenue.count,
      unpaidInvoices,
    };
  }
}

export default new DashboardService();
