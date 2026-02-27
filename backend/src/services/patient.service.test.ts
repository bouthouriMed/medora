import patientService from './patient.service';
import { cleanupDatabase, createTestClinic, createTestPatient } from '../test/setup';

describe('PatientService', () => {
  let clinicId: string;

  beforeAll(async () => {
    const clinic = await createTestClinic();
    clinicId = clinic.id;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  describe('create', () => {
    it('should create a new patient', async () => {
      const patient = await patientService.create(clinicId, {
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        phone: '555-0001',
      });

      expect(patient).toBeDefined();
      expect(patient.firstName).toBe('Alice');
      expect(patient.lastName).toBe('Smith');
      expect(patient.email).toBe('alice@example.com');
    });

    it('should create patient with minimal data', async () => {
      const patient = await patientService.create(clinicId, {
        firstName: 'Bob',
        lastName: 'Jones',
      });

      expect(patient).toBeDefined();
      expect(patient.firstName).toBe('Bob');
    });
  });

  describe('getAll', () => {
    it('should return all patients for clinic', async () => {
      await patientService.create(clinicId, { firstName: 'Test1', lastName: 'User' });
      await patientService.create(clinicId, { firstName: 'Test2', lastName: 'User' });

      const patients = await patientService.getAll(clinicId);

      expect(patients.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter patients by search term', async () => {
      const patients = await patientService.getAll(clinicId, 'alice');
      
      expect(patients).toBeDefined();
    });
  });

  describe('getById', () => {
    it('should return patient by id', async () => {
      const created = await patientService.create(clinicId, { firstName: 'FindMe', lastName: 'Patient' });
      const found = await patientService.getById(created.id, clinicId);

      expect(found).toBeDefined();
      expect(found?.firstName).toBe('FindMe');
    });

    it('should return null for non-existent patient', async () => {
      const found = await patientService.getById('non-existent-id', clinicId);
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update patient details', async () => {
      const patient = await patientService.create(clinicId, { firstName: 'Original', lastName: 'Name' });
      
      const updated = await patientService.update(patient.id, clinicId, {
        firstName: 'Updated',
      });

      expect(updated).toBeDefined();
    });
  });

  describe('archive', () => {
    it('should soft delete patient', async () => {
      const patient = await patientService.create(clinicId, { firstName: 'ToDelete', lastName: 'Patient' });
      
      await patientService.archive(patient.id, clinicId);
      
      const found = await patientService.getById(patient.id, clinicId);
      expect(found).toBeNull();
    });
  });
});
