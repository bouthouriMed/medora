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

  async getAnalytics(clinicId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setDate(1);

    const [
      revenueByMonth,
      revenueByDoctor,
      appointmentsByMonth,
      appointmentsByDoctor,
      peakHours,
      patientsByMonth,
      totalPatients,
      totalAppointments,
      totalRevenue,
      avgRevenuePerPatient,
      topDiagnoses,
      appointmentStatusBreakdown,
    ] = await Promise.all([
      this.getRevenueByMonthExtended(clinicId, 12),
      this.getRevenueByDoctor(clinicId),
      this.getAppointmentsByMonthExtended(clinicId, 12),
      this.getAppointmentsByDoctor(clinicId),
      this.getPeakHours(clinicId),
      this.getPatientsByMonthExtended(clinicId, 12),
      prisma.patient.count({ where: { clinicId, deletedAt: null } }),
      prisma.appointment.count({ where: { clinicId, dateTime: { gte: twelveMonthsAgo } } }),
      prisma.invoice.aggregate({ where: { clinicId, status: 'PAID', paidAt: { gte: twelveMonthsAgo } }, _sum: { amount: true } }),
      this.getAvgRevenuePerPatient(clinicId),
      this.getTopDiagnoses(clinicId),
      this.getAppointmentStatusBreakdown(clinicId),
    ]);

    return {
      revenueByMonth,
      revenueByDoctor,
      appointmentsByMonth,
      appointmentsByDoctor,
      peakHours,
      patientsByMonth,
      totalPatients,
      totalAppointments,
      totalRevenue: totalRevenue._sum.amount || 0,
      avgRevenuePerPatient,
      topDiagnoses,
      appointmentStatusBreakdown,
    };
  }

  private async getRevenueByDoctor(clinicId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const invoices = await prisma.invoice.findMany({
      where: { clinicId, status: 'PAID', paidAt: { gte: sixMonthsAgo } },
      include: { appointment: { include: { doctor: true } } },
    });

    const byDoctor: Record<string, { name: string; revenue: number; count: number }> = {};
    invoices.forEach((inv) => {
      const doc = inv.appointment?.doctor;
      if (doc) {
        const key = doc.id;
        if (!byDoctor[key]) byDoctor[key] = { name: `Dr. ${doc.firstName} ${doc.lastName}`, revenue: 0, count: 0 };
        byDoctor[key].revenue += Number(inv.amount);
        byDoctor[key].count++;
      }
    });

    return Object.values(byDoctor).sort((a, b) => b.revenue - a.revenue);
  }

  private async getAppointmentsByDoctor(clinicId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const appointments = await prisma.appointment.findMany({
      where: { clinicId, dateTime: { gte: sixMonthsAgo } },
      include: { doctor: true },
    });

    const byDoctor: Record<string, { name: string; total: number; completed: number; cancelled: number; noShow: number }> = {};
    appointments.forEach((apt) => {
      const key = apt.doctorId;
      if (!byDoctor[key]) byDoctor[key] = { name: `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`, total: 0, completed: 0, cancelled: 0, noShow: 0 };
      byDoctor[key].total++;
      if (apt.status === 'COMPLETED') byDoctor[key].completed++;
      if (apt.status === 'CANCELLED') byDoctor[key].cancelled++;
      if (apt.status === 'NO_SHOW') byDoctor[key].noShow++;
    });

    return Object.values(byDoctor).sort((a, b) => b.total - a.total);
  }

  private async getPeakHours(clinicId: string) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const appointments = await prisma.appointment.findMany({
      where: { clinicId, dateTime: { gte: threeMonthsAgo }, status: { not: 'CANCELLED' } },
      select: { dateTime: true },
    });

    const hourCounts: Record<number, number> = {};
    for (let h = 7; h <= 20; h++) hourCounts[h] = 0;

    appointments.forEach((apt) => {
      const hour = apt.dateTime.getHours();
      if (hourCounts[hour] !== undefined) hourCounts[hour]++;
    });

    return Object.entries(hourCounts).map(([hour, count]) => ({
      hour: `${hour}:00`,
      count,
    }));
  }

  private async getAvgRevenuePerPatient(clinicId: string) {
    const result = await prisma.invoice.groupBy({
      by: ['patientId'],
      where: { clinicId, status: 'PAID' },
      _sum: { amount: true },
    });

    if (result.length === 0) return 0;
    const totalRevenue = result.reduce((sum, r) => sum + (r._sum.amount || 0), 0);
    return Math.round((totalRevenue / result.length) * 100) / 100;
  }

  private async getTopDiagnoses(clinicId: string) {
    const diagnoses = await prisma.diagnosis.groupBy({
      by: ['description'],
      where: { clinicId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    return diagnoses.map((d) => ({ name: d.description, count: d._count.id }));
  }

  private async getAppointmentStatusBreakdown(clinicId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const result = await prisma.appointment.groupBy({
      by: ['status'],
      where: { clinicId, dateTime: { gte: sixMonthsAgo } },
      _count: { id: true },
    });

    return result.map((r) => ({ status: r.status, count: r._count.id }));
  }

  private async getRevenueByMonthExtended(clinicId: string, months: number) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);

    const invoices = await prisma.invoice.findMany({
      where: { clinicId, status: 'PAID', paidAt: { gte: startDate } },
      select: { paidAt: true, amount: true },
    });

    const monthlyRevenue: Record<string, number> = {};
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[key] = 0;
    }

    invoices.forEach((inv) => {
      if (inv.paidAt) {
        const key = `${inv.paidAt.getFullYear()}-${String(inv.paidAt.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyRevenue[key] !== undefined) monthlyRevenue[key] += Number(inv.amount);
      }
    });

    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue: Math.round(revenue * 100) / 100 }));
  }

  private async getAppointmentsByMonthExtended(clinicId: string, months: number) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);

    const appointments = await prisma.appointment.findMany({
      where: { clinicId, dateTime: { gte: startDate } },
      select: { dateTime: true, status: true },
    });

    const monthly: Record<string, { total: number; completed: number; cancelled: number; noShow: number }> = {};
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = { total: 0, completed: 0, cancelled: 0, noShow: 0 };
    }

    appointments.forEach((apt) => {
      const key = `${apt.dateTime.getFullYear()}-${String(apt.dateTime.getMonth() + 1).padStart(2, '0')}`;
      if (monthly[key]) {
        monthly[key].total++;
        if (apt.status === 'COMPLETED') monthly[key].completed++;
        if (apt.status === 'CANCELLED') monthly[key].cancelled++;
        if (apt.status === 'NO_SHOW') monthly[key].noShow++;
      }
    });

    return Object.entries(monthly).map(([month, data]) => ({ month, ...data }));
  }

  private async getPatientsByMonthExtended(clinicId: string, months: number) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);

    const patients = await prisma.patient.findMany({
      where: { clinicId, createdAt: { gte: startDate } },
      select: { createdAt: true },
    });

    const monthly: Record<string, number> = {};
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = 0;
    }

    patients.forEach((p) => {
      const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthly[key] !== undefined) monthly[key]++;
    });

    return Object.entries(monthly).map(([month, count]) => ({ month, count }));
  }

  async getSmartSchedulingSuggestions(clinicId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [cancelledSlots, waitingPatients] = await Promise.all([
      prisma.appointment.findMany({
        where: { clinicId, dateTime: { gte: today, lte: nextWeek }, status: { in: ['CANCELLED', 'NO_SHOW'] } },
        include: { doctor: true },
        orderBy: { dateTime: 'asc' },
      }),
      prisma.waitlistEntry.findMany({
        where: { clinicId, status: 'WAITING' },
        include: { patient: true },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        take: 20,
      }),
    ]);

    const suggestions = cancelledSlots.map((slot) => {
      const matching = waitingPatients.filter((w) => {
        if (w.doctorId && w.doctorId !== slot.doctorId) return false;
        if (w.preferredDate) {
          if (new Date(w.preferredDate).toDateString() !== slot.dateTime.toDateString()) return false;
        }
        return true;
      });
      return {
        slot: { id: slot.id, dateTime: slot.dateTime, doctor: `Dr. ${slot.doctor.firstName} ${slot.doctor.lastName}`, doctorId: slot.doctorId },
        matchingPatients: matching.map((w) => ({ waitlistId: w.id, patientId: w.patientId, patientName: `${w.patient.firstName} ${w.patient.lastName}`, priority: w.priority, reason: w.reason })),
      };
    }).filter((s) => s.matchingPatients.length > 0);

    return { openSlots: cancelledSlots.length, waitingPatients: waitingPatients.length, suggestions };
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
