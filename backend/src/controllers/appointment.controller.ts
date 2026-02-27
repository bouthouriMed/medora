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
      const { startDate, endDate } = req.query;
      
      const parseLocalDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date;
      };

      const appointments = await appointmentService.getAll(
        req.user!.clinicId,
        startDate ? parseLocalDate(startDate as string) : undefined,
        endDate ? parseLocalDate(endDate as string) : undefined
      );
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
