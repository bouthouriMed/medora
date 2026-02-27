import invoiceService from './invoice.service';
import appointmentService from './appointment.service';
import { 
  cleanupDatabase, 
  createTestClinic, 
  createTestPatient,
  createTestUser,
  createTestAppointment
} from '../test/setup';

describe('InvoiceService', () => {
  let clinicId: string;
  let patientId: string;

  beforeAll(async () => {
    const clinic = await createTestClinic();
    clinicId = clinic.id;
    
    const patient = await createTestPatient(clinicId);
    patientId = patient.id;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  beforeEach(async () => {
    const doctor = await createTestUser(clinicId, 'DOCTOR');
    await createTestAppointment(clinicId, patientId, doctor.id);
  });

  describe('create', () => {
    it('should create a new invoice', async () => {
      const appointments = await appointmentService.getAll(clinicId);
      const appointmentId = appointments[0].id;
      
      const invoice = await invoiceService.create(clinicId, {
        patientId,
        appointmentId,
        amount: 150.00,
      });

      expect(invoice).toBeDefined();
      expect(invoice.patientId).toBe(patientId);
      expect(Number(invoice.amount)).toBe(150.00);
      expect(invoice.status).toBe('UNPAID');
    });

    it('should create invoice with due date', async () => {
      const appointments = await appointmentService.getAll(clinicId);
      const appointmentId = appointments[0].id;
      
      const invoice = await invoiceService.create(clinicId, {
        patientId,
        appointmentId,
        amount: 200.00,
        dueDate: new Date('2026-04-01'),
      });

      expect(invoice).toBeDefined();
      expect(invoice.dueDate).toBeDefined();
    });
  });

  describe('getAll', () => {
    it('should return all invoices for clinic', async () => {
      const invoices = await invoiceService.getAll(clinicId);
      expect(invoices.length).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const unpaidInvoices = await invoiceService.getAll(clinicId, 'UNPAID');
      expect(unpaidInvoices.every((i: any) => i.status === 'UNPAID')).toBe(true);
    });
  });

  describe('getById', () => {
    it('should return invoice by id', async () => {
      const doctor = await createTestUser(clinicId, 'DOCTOR');
      const apt = await createTestAppointment(clinicId, patientId, doctor.id);
      const invoice = await invoiceService.create(clinicId, {
        patientId,
        appointmentId: apt.id,
        amount: 100.00,
      });
      
      const found = await invoiceService.getById(invoice.id, clinicId);
      expect(found).toBeDefined();
      expect(found?.id).toBe(invoice.id);
    });

    it('should return null for non-existent invoice', async () => {
      const found = await invoiceService.getById('non-existent-id', clinicId);
      expect(found).toBeNull();
    });
  });

  describe('markAsPaid', () => {
    it('should mark invoice as paid', async () => {
      const doctor = await createTestUser(clinicId, 'DOCTOR');
      const apt = await createTestAppointment(clinicId, patientId, doctor.id);
      const invoice = await invoiceService.create(clinicId, {
        patientId,
        appointmentId: apt.id,
        amount: 100.00,
      });

      await invoiceService.markAsPaid(invoice.id, clinicId);
      
      const found = await invoiceService.getById(invoice.id, clinicId);
      expect(found?.status).toBe('PAID');
    });
  });

  describe('markAsUnpaid', () => {
    it('should mark invoice as unpaid', async () => {
      const doctor = await createTestUser(clinicId, 'DOCTOR');
      const apt = await createTestAppointment(clinicId, patientId, doctor.id);
      const invoice = await invoiceService.create(clinicId, {
        patientId,
        appointmentId: apt.id,
        amount: 100.00,
      });

      await invoiceService.markAsPaid(invoice.id, clinicId);
      await invoiceService.markAsUnpaid(invoice.id, clinicId);
      
      const found = await invoiceService.getById(invoice.id, clinicId);
      expect(found?.status).toBe('UNPAID');
    });
  });

  describe('delete', () => {
    it('should delete invoice', async () => {
      const doctor = await createTestUser(clinicId, 'DOCTOR');
      const apt = await createTestAppointment(clinicId, patientId, doctor.id);
      const invoice = await invoiceService.create(clinicId, {
        patientId,
        appointmentId: apt.id,
        amount: 50.00,
      });

      await invoiceService.delete(invoice.id, clinicId);
      
      const found = await invoiceService.getById(invoice.id, clinicId);
      expect(found).toBeNull();
    });
  });

  describe('getUnpaid', () => {
    it('should return all unpaid invoices', async () => {
      const unpaidInvoices = await invoiceService.getUnpaid(clinicId);
      expect(unpaidInvoices.every((i: any) => i.status === 'UNPAID')).toBe(true);
    });
  });
});
