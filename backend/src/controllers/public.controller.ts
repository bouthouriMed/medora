import { Response, Request } from 'express';
import patientRepository from '../repositories/patient.repository';

export class PublicPortalController {
  async getPatientByToken(req: Request, res: Response) {
    try {
      const token = req.params.token as string;
      const patient = await patientRepository.findByPortalToken(token);
      
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found or invalid token' });
      }

      const now = new Date();
      const upcomingAppointments = patient.appointments.filter(
        (apt) => new Date(apt.dateTime) >= now && apt.status !== 'CANCELLED'
      );
      const pastAppointments = patient.appointments.filter(
        (apt) => new Date(apt.dateTime) < now || apt.status === 'COMPLETED'
      );
      const outstandingInvoices = patient.invoices.filter(
        (inv) => inv.status === 'UNPAID'
      );

      res.json({
        patient: {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
          phone: patient.phone,
          dateOfBirth: patient.dateOfBirth,
          address: patient.address,
        },
        clinic: {
          name: patient.clinic.name,
          address: patient.clinic.address,
          phone: patient.clinic.phone,
          email: patient.clinic.email,
        },
        upcomingAppointments,
        pastAppointments,
        outstandingInvoices,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}

export default new PublicPortalController();
