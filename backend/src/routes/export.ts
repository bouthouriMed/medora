import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../types/express.d';

const router = Router();

router.get('/patients', authenticate, async (req: AuthRequest, res) => {
  try {
    const { clinicId } = req.user!;
    const patients = await prisma.patient.findMany({
      where: { clinicId, deletedAt: null },
      include: { appointments: true, invoices: true },
      orderBy: { createdAt: 'desc' },
    });

    const csv = [
      'ID,First Name,Last Name,Email,Phone,Date of Birth,Address,Created At,Total Appointments,Total Invoices',
      ...patients.map(p => 
        `"${p.id}","${p.firstName}","${p.lastName}","${p.email || ''}","${p.phone || ''}","${p.dateOfBirth || ''}","${p.address || ''}","${p.createdAt.toISOString()}",${p.appointments.length},${p.invoices.length}`
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=patients_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export patients' });
  }
});

router.get('/appointments', authenticate, async (req: AuthRequest, res) => {
  try {
    const { clinicId } = req.user!;
    const { startDate, endDate, status } = req.query;

    const where: any = { clinicId };
    
    if (startDate || endDate) {
      where.dateTime = {};
      if (startDate) where.dateTime.gte = new Date(startDate as string);
      if (endDate) where.dateTime.lte = new Date(endDate as string);
    }
    if (status) where.status = status;

    const appointments = await prisma.appointment.findMany({
      where,
      include: { patient: true, doctor: true },
      orderBy: { dateTime: 'desc' },
    });

    const csv = [
      'ID,Date Time,Patient,Doctor,Status,Notes,Created At',
      ...appointments.map(a => 
        `"${a.id}","${a.dateTime.toISOString()}","${a.patient.firstName} ${a.patient.lastName}","Dr. ${a.doctor.firstName} ${a.doctor.lastName}","${a.status}","${(a.notes || '').replace(/"/g, '""')}","${a.createdAt.toISOString()}"`
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=appointments_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export appointments' });
  }
});

router.get('/invoices', authenticate, async (req: AuthRequest, res) => {
  try {
    const { clinicId } = req.user!;
    const { status, startDate, endDate } = req.query;

    const where: any = { clinicId };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: { patient: true, appointment: true },
      orderBy: { createdAt: 'desc' },
    });

    const csv = [
      'ID,Invoice Number,Patient,Amount,Status,Due Date,Created At,Appointment Date',
      ...invoices.map(i => 
        `"${i.id}","#${i.id.slice(0, 8).toUpperCase()}","${i.patient.firstName} ${i.patient.lastName}","${i.amount}","${i.status}","${i.dueDate ? i.dueDate.toISOString().split('T')[0] : ''}","${i.createdAt.toISOString()}","${i.appointment?.dateTime.toISOString() || ''}"`
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=invoices_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export invoices' });
  }
});

export default router;
