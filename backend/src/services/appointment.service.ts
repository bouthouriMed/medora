import appointmentRepository from '../repositories/appointment.repository';

export class AppointmentService {
  async create(clinicId: string, data: {
    patientId: string;
    doctorId: string;
    dateTime: Date;
    notes?: string;
  }) {
    return appointmentRepository.create({ ...data, clinicId });
  }

  async getById(id: string, clinicId: string) {
    return appointmentRepository.findById(id, clinicId);
  }

  async getAll(clinicId: string, startDate?: Date, endDate?: Date) {
    return appointmentRepository.findByClinic(clinicId, startDate, endDate);
  }

  async getByDoctor(doctorId: string, clinicId: string, startDate?: Date, endDate?: Date) {
    return appointmentRepository.findByDoctor(doctorId, clinicId, startDate, endDate);
  }

  async getByPatient(patientId: string, clinicId: string) {
    return appointmentRepository.findByPatient(patientId, clinicId);
  }

  async update(id: string, clinicId: string, data: {
    dateTime?: Date;
    status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    notes?: string;
  }) {
    return appointmentRepository.update(id, clinicId, data);
  }

  async cancel(id: string, clinicId: string) {
    return appointmentRepository.update(id, clinicId, { status: 'CANCELLED' });
  }

  async complete(id: string, clinicId: string) {
    return appointmentRepository.update(id, clinicId, { status: 'COMPLETED' });
  }

  async markNoShow(id: string, clinicId: string) {
    return appointmentRepository.update(id, clinicId, { status: 'NO_SHOW' });
  }

  async delete(id: string, clinicId: string) {
    return appointmentRepository.delete(id, clinicId);
  }
}

export default new AppointmentService();
