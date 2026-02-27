import invoiceRepository from '../repositories/invoice.repository';

export class InvoiceService {
  async create(clinicId: string, data: {
    appointmentId: string;
    patientId: string;
    amount: number;
    dueDate?: Date;
  }) {
    return invoiceRepository.create({ ...data, clinicId });
  }

  async getById(id: string, clinicId: string) {
    return invoiceRepository.findById(id, clinicId);
  }

  async getAll(clinicId: string, status?: 'PAID' | 'UNPAID') {
    return invoiceRepository.findByClinic(clinicId, status);
  }

  async getByPatient(patientId: string, clinicId: string) {
    return invoiceRepository.findByPatient(patientId, clinicId);
  }

  async getUnpaid(clinicId: string) {
    return invoiceRepository.findUnpaid(clinicId);
  }

  async getRevenueSummary(clinicId: string, startDate: Date, endDate: Date) {
    return invoiceRepository.getRevenueSummary(clinicId, startDate, endDate);
  }

  async markAsPaid(id: string, clinicId: string) {
    return invoiceRepository.update(id, clinicId, {
      status: 'PAID',
      paidAt: new Date(),
    });
  }

  async markAsUnpaid(id: string, clinicId: string) {
    return invoiceRepository.update(id, clinicId, {
      status: 'UNPAID',
      paidAt: undefined,
    });
  }

  async delete(id: string, clinicId: string) {
    return invoiceRepository.delete(id, clinicId);
  }
}

export default new InvoiceService();
