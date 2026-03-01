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
      },
      include: { patient: true, doctor: true },
      orderBy: { dateTime: 'asc' },
    });

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        dateTime: { gte: tomorrow },
        status: 'SCHEDULED',
      },
      include: { patient: true, doctor: true },
      orderBy: { dateTime: 'asc' },
      take: 10,
    });

    const revenue = await invoiceRepository.getRevenueSummary(clinicId, startOfMonth, endOfMonth);

    const unpaidInvoices = await prisma.invoice.count({
      where: { clinicId, status: 'UNPAID' },
    });

    const revenueByMonth = await this.getRevenueByMonth(clinicId);
    const appointmentsByMonth = await this.getAppointmentsByMonth(clinicId);
    const patientsByMonth = await this.getPatientsByMonth(clinicId);

    return {
      todayAppointments,
      upcomingAppointments,
      monthlyRevenue: revenue.total,
      monthlyRevenueCount: revenue.count,
      unpaidInvoices,
      revenueByMonth,
      appointmentsByMonth,
      patientsByMonth,
    };
  }

  private async getRevenueByMonth(clinicId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);

    const invoices = await prisma.invoice.findMany({
      where: {
        clinicId,
        status: 'PAID',
        paidAt: { gte: sixMonthsAgo },
      },
      select: { paidAt: true, amount: true },
    });

    const monthlyRevenue: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[key] = 0;
    }

    invoices.forEach((inv) => {
      if (inv.paidAt) {
        const key = `${inv.paidAt.getFullYear()}-${String(inv.paidAt.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyRevenue[key] !== undefined) {
          monthlyRevenue[key] += Number(inv.amount);
        }
      }
    });

    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue * 100) / 100,
    }));
  }

  private async getAppointmentsByMonth(clinicId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);

    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        dateTime: { gte: sixMonthsAgo },
      },
      select: { dateTime: true, status: true },
    });

    const monthlyAppointments: Record<string, { total: number; completed: number; cancelled: number; noShow: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyAppointments[key] = { total: 0, completed: 0, cancelled: 0, noShow: 0 };
    }

    appointments.forEach((apt) => {
      const key = `${apt.dateTime.getFullYear()}-${String(apt.dateTime.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyAppointments[key]) {
        monthlyAppointments[key].total++;
        if (apt.status === 'COMPLETED') monthlyAppointments[key].completed++;
        if (apt.status === 'CANCELLED') monthlyAppointments[key].cancelled++;
        if (apt.status === 'NO_SHOW') monthlyAppointments[key].noShow++;
      }
    });

    return Object.entries(monthlyAppointments).map(([month, data]) => ({
      month,
      ...data,
    }));
  }

  private async getPatientsByMonth(clinicId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);

    const patients = await prisma.patient.findMany({
      where: {
        clinicId,
        createdAt: { gte: sixMonthsAgo },
      },
      select: { createdAt: true },
    });

    const monthlyPatients: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyPatients[key] = 0;
    }

    patients.forEach((p) => {
      const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyPatients[key] !== undefined) {
        monthlyPatients[key]++;
      }
    });

    return Object.entries(monthlyPatients).map(([month, count]) => ({
      month,
      count,
    }));
  }
}

export default new DashboardService();
