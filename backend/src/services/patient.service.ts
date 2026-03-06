import patientRepository from '../repositories/patient.repository';

export class PatientService {
  async create(clinicId: string, data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    dateOfBirth?: Date;
    address?: string;
    notes?: string;
  }) {
    return patientRepository.create({ ...data, clinicId });
  }

  async getById(id: string, clinicId: string) {
    return patientRepository.findById(id, clinicId);
  }

  async getAll(clinicId: string, search?: string, includeArchived?: boolean) {
    return patientRepository.findByClinic(clinicId, search, includeArchived);
  }

  async update(id: string, clinicId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: Date;
    address?: string;
    notes?: string;
  }) {
    return patientRepository.update(id, clinicId, data);
  }

  async archive(id: string, clinicId: string) {
    return patientRepository.delete(id, clinicId);
  }

  async restore(id: string, clinicId: string) {
    return patientRepository.restore(id, clinicId);
  }

  async regenerateToken(id: string, clinicId: string) {
    await patientRepository.regeneratePortalToken(id, clinicId);
    return patientRepository.findById(id, clinicId);
  }
}

export default new PatientService();
