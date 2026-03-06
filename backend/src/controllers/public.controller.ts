import { Response, Request } from 'express';
import patientRepository from '../repositories/patient.repository';
import clinicRepository from '../repositories/clinic.repository';
import userRepository from '../repositories/user.repository';
import appointmentRepository from '../repositories/appointment.repository';
import aiService from '../services/ai.service';
import notificationService from '../services/notification.service';
import prisma from '../utils/prisma';

export class PublicPortalController {
  async triageSymptoms(req: Request, res: Response) {
    try {
      const { symptoms, conditions, medications, allergies } = req.body;
      
      const result = await aiService.triagePatient(symptoms, {
        conditions,
        medications,
        allergies,
      });
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getClinicDoctors(req: Request, res: Response) {
    try {
      const { clinicId } = req.params;
      
      const clinic = await clinicRepository.findById(clinicId);
      if (!clinic) {
        return res.status(404).json({ error: 'Clinic not found' });
      }

      const doctors = await userRepository.findByClinic(clinicId);
      const doctorList = doctors
        .filter(d => d.role === 'DOCTOR')
        .map(d => ({
          id: d.id,
          firstName: d.firstName,
          lastName: d.lastName,
          email: d.email,
        }));

      res.json({ clinic: { name: clinic.name, address: clinic.address, phone: clinic.phone }, doctors: doctorList });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async requestAppointment(req: Request, res: Response) {
    try {
      const { clinicId } = req.params;
      const { patientName, patientEmail, patientPhone, doctorId, dateTime, reason } = req.body;

      const clinic = await clinicRepository.findById(clinicId);
      if (!clinic) {
        return res.status(404).json({ error: 'Clinic not found' });
      }

      const doctor = await prisma.user.findUnique({ where: { id: doctorId } });

      let patient = null;
      if (patientEmail) {
        patient = await prisma.patient.findFirst({
          where: { clinicId, email: patientEmail, deletedAt: null },
        });
      }

      const appointmentDate = new Date(dateTime);
      
      if (patient) {
        const appointment = await appointmentRepository.create({
          patientId: patient.id,
          doctorId,
          clinicId,
          dateTime: appointmentDate,
          notes: reason,
        });
        
        await prisma.message.create({
          data: {
            clinicId,
            senderId: 'system',
            senderType: 'SYSTEM',
            receiverId: doctorId,
            receiverType: 'USER',
            patientId: patient.id,
            subject: 'New Appointment Booked',
            body: `A new appointment has been booked by ${patient.firstName} ${patient.lastName}.\n\n📅 Date: ${appointmentDate.toLocaleDateString()}\n⏰ Time: ${appointmentDate.toLocaleTimeString()}\n📝 Reason: ${reason || 'Not provided'}\n\nPlease review and confirm this appointment.`,
          },
        });

        notificationService.notifyAppointmentRequest(
          doctorId,
          `${patient.firstName} ${patient.lastName}`,
          appointmentDate,
          appointment.id
        ).catch(() => {});

        return res.status(201).json({
          message: 'Appointment requested successfully',
          appointmentId: appointment.id,
          patientExists: true,
        });
      } else {
        const appointmentRequest = await prisma.appointmentRequest.create({
          data: {
            clinicId,
            patientName,
            patientEmail,
            patientPhone,
            doctorId,
            requestedDateTime: appointmentDate,
            reason,
            status: 'PENDING',
          },
        });

        await prisma.message.create({
          data: {
            clinicId,
            senderId: 'system',
            senderType: 'SYSTEM',
            receiverId: doctorId,
            receiverType: 'USER',
            subject: 'New Appointment Request',
            body: `A new appointment request has been submitted.\n\n👤 Patient: ${patientName}\n📞 Phone: ${patientPhone || 'Not provided'}\n📧 Email: ${patientEmail || 'Not provided'}\n📅 Date: ${appointmentDate.toLocaleDateString()}\n⏰ Time: ${appointmentDate.toLocaleTimeString()}\n📝 Reason: ${reason || 'Not provided'}\n\nPlease review and approve this request.`,
          },
        });

        notificationService.notifyAppointmentRequest(
          doctorId,
          patientName,
          appointmentDate,
          appointmentRequest.id
        ).catch(() => {});

        return res.status(201).json({
          message: 'Appointment requested successfully. The clinic will contact you to confirm.',
          patientExists: false,
        });
      }
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getAvailableSlots(req: Request, res: Response) {
    try {
      const { clinicId, doctorId, date } = req.params;
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const existingAppointments = await prisma.appointment.findMany({
        where: {
          clinicId,
          doctorId,
          dateTime: { gte: dayStart, lte: dayEnd },
          status: { not: 'CANCELLED' },
          deletedAt: null,
        },
        select: { dateTime: true },
      });

      const bookedTimes = existingAppointments.map(a => {
        const d = new Date(a.dateTime);
        return d.getHours() * 60 + d.getMinutes();
      });

      const slots: string[] = [];
      const startHour = 9;
      const endHour = 17;
      const slotDuration = 30;

      for (let hour = startHour; hour < endHour; hour++) {
        for (let min = 0; min < 60; min += slotDuration) {
          const timeInMinutes = hour * 60 + min;
          if (!bookedTimes.includes(timeInMinutes)) {
            const slotDate = new Date(date);
            slotDate.setHours(hour, min, 0, 0);
            slots.push(slotDate.toISOString());
          }
        }
      }

      res.json({ slots });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

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
