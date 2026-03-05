import { Response, Request } from 'express';
import patientRepository from '../repositories/patient.repository';
import aiService from '../services/ai.service';

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

      const summary = patient.medicalRecords?.[0]?.description || null;

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
        diagnoses: patient.diagnoses || [],
        prescriptions: patient.prescriptions || [],
        allergies: patient.allergies || [],
        conditions: patient.conditions || [],
        vitals: patient.vitals || [],
        labResults: patient.labResults || [],
        summary,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async chatWithAI(req: Request, res: Response) {
    try {
      const token = req.params.token as string;
      const { message, history } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const patient = await patientRepository.findByPortalToken(token);
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found or invalid token' });
      }

      const response = await aiService.portalChat({
        patient: {
          firstName: patient.firstName,
          lastName: patient.lastName,
          dateOfBirth: patient.dateOfBirth?.toISOString() || null,
        },
        history: {
          diagnoses: patient.diagnoses?.map(d => ({ icdCode: d.icdCode, description: d.description, status: d.status })) || [],
          prescriptions: patient.prescriptions?.map(p => ({ medication: p.medication, dosage: p.dosage, frequency: p.frequency, status: p.status })) || [],
          allergies: patient.allergies?.map(a => ({ allergen: a.allergen, severity: a.severity, reaction: a.reaction })) || [],
          conditions: patient.conditions?.map(c => ({ name: c.name, status: c.status })) || [],
          vitals: patient.vitals?.map(v => ({
            bloodPressureSystolic: v.bloodPressureSystolic,
            bloodPressureDiastolic: v.bloodPressureDiastolic,
            heartRate: v.heartRate,
            temperature: v.temperature,
            weight: v.weight,
            oxygenSat: v.oxygenSat,
            recordedAt: v.recordedAt.toISOString(),
          })) || [],
          labResults: patient.labResults?.map(l => ({ testName: l.testName, result: l.result, status: l.status, orderedAt: l.orderedAt.toISOString() })) || [],
        },
        message,
        conversationHistory: history || [],
      });

      res.json({ response });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}

export default new PublicPortalController();
