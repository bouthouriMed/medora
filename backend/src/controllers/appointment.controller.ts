import { Response } from 'express';
import appointmentService from '../services/appointment.service';
import type { AuthRequest } from '../types/express.d';

export class AppointmentController {
  async create(req: AuthRequest, res: Response) {
    try {
      const appointment = await appointmentService.create(req.user!.clinicId, req.body);
      res.status(201).json(appointment);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async getAll(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, filter } = req.query;
      
      console.log('==== APPOINTMENT GETALL ====');
      console.log('filter param:', filter);
      console.log('startDate param:', startDate);
      console.log('endDate param:', endDate);
      
      const parseLocalDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date;
      };

      let start: Date | undefined;
      let end: Date | undefined;

      if (filter === 'upcoming') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        start = tomorrow;
      } else if (startDate && endDate) {
        start = parseLocalDate(startDate as string);
        end = parseLocalDate(endDate as string);
      } else if (startDate) {
        start = parseLocalDate(startDate as string);
        const endDateSingle = parseLocalDate(startDate as string);
        endDateSingle.setHours(23, 59, 59, 999);
        end = endDateSingle;
      }

      const appointments = await appointmentService.getAll(
        req.user!.clinicId,
        start,
        end
      );
      console.log('Returning appointments count:', appointments.length);
      res.set('X-Debug-Count', appointments.length.toString());
      res.set('X-Debug-Filter', filter as string || 'none');
      res.set('X-Debug-Start', start?.toISOString() || 'none');
      res.set('X-Debug-End', end?.toISOString() || 'none');
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const appointment = await appointmentService.getById(req.params.id as string, req.user!.clinicId);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getByPatient(req: AuthRequest, res: Response) {
    try {
      const appointments = await appointmentService.getByPatient(
        req.params.patientId as string,
        req.user!.clinicId
      );
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const appointment = await appointmentService.update(
        req.params.id as string,
        req.user!.clinicId,
        req.body
      );
      res.json(appointment);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async cancel(req: AuthRequest, res: Response) {
    try {
      await appointmentService.cancel(req.params.id as string, req.user!.clinicId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async complete(req: AuthRequest, res: Response) {
    try {
      await appointmentService.complete(req.params.id as string, req.user!.clinicId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await appointmentService.delete(req.params.id as string, req.user!.clinicId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export default new AppointmentController();
