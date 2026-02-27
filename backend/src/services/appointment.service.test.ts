import appointmentService from './appointment.service';
import { 
  cleanupDatabase, 
  createTestClinic, 
  createTestUser, 
  createTestPatient,
  createTestAppointment 
} from '../test/setup';

describe('AppointmentService', () => {
  let clinicId: string;
  let doctorId: string;
  let patientId: string;

  beforeAll(async () => {
    const clinic = await createTestClinic();
    clinicId = clinic.id;
    
    const doctor = await createTestUser(clinicId, 'DOCTOR');
    doctorId = doctor.id;
    
    const patient = await createTestPatient(clinicId);
    patientId = patient.id;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  describe('create', () => {
    it('should create a new appointment', async () => {
      const appointment = await appointmentService.create(clinicId, {
        patientId,
        doctorId,
        dateTime: new Date('2026-03-15T10:00:00Z'),
        notes: 'Test appointment',
      });

      expect(appointment).toBeDefined();
      expect(appointment.patientId).toBe(patientId);
      expect(appointment.doctorId).toBe(doctorId);
      expect(appointment.status).toBe('SCHEDULED');
    });

    it('should create appointment without notes', async () => {
      const appointment = await appointmentService.create(clinicId, {
        patientId,
        doctorId,
        dateTime: new Date(),
      });

      expect(appointment).toBeDefined();
    });
  });

  describe('getAll', () => {
    it('should return all appointments for clinic', async () => {
      const appointments = await appointmentService.getAll(clinicId);
      expect(appointments.length).toBeGreaterThan(0);
    });

    it('should filter by date range', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const appointments = await appointmentService.getAll(clinicId, today, tomorrow);
      expect(appointments).toBeDefined();
    });
  });

  describe('getById', () => {
    it('should return appointment by id', async () => {
      const appointments = await appointmentService.getAll(clinicId);
      const appointment = appointments[0];
      
      const found = await appointmentService.getById(appointment.id, clinicId);
      expect(found).toBeDefined();
      expect(found?.id).toBe(appointment.id);
    });

    it('should return null for non-existent appointment', async () => {
      const found = await appointmentService.getById('non-existent-id', clinicId);
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update appointment status', async () => {
      const appointment = await appointmentService.create(clinicId, {
        patientId,
        doctorId,
        dateTime: new Date(),
      });

      await appointmentService.update(appointment.id, clinicId, {
        status: 'COMPLETED',
      });
    });

    it('should update appointment notes', async () => {
      const appointment = await appointmentService.create(clinicId, {
        patientId,
        doctorId,
        dateTime: new Date(),
        notes: 'Original notes',
      });

      await appointmentService.update(appointment.id, clinicId, {
        notes: 'Updated notes',
      });
    });
  });

  describe('cancel', () => {
    it('should cancel appointment', async () => {
      const appointment = await appointmentService.create(clinicId, {
        patientId,
        doctorId,
        dateTime: new Date(),
      });

      await appointmentService.cancel(appointment.id, clinicId);
      
      const found = await appointmentService.getById(appointment.id, clinicId);
      expect(found?.status).toBe('CANCELLED');
    });
  });

  describe('complete', () => {
    it('should mark appointment as completed', async () => {
      const appointment = await appointmentService.create(clinicId, {
        patientId,
        doctorId,
        dateTime: new Date(),
      });

      await appointmentService.complete(appointment.id, clinicId);
      
      const found = await appointmentService.getById(appointment.id, clinicId);
      expect(found?.status).toBe('COMPLETED');
    });
  });

  describe('getByPatient', () => {
    it('should return appointments for a patient', async () => {
      const appointments = await appointmentService.getByPatient(patientId, clinicId);
      expect(appointments).toBeDefined();
    });
  });
});
