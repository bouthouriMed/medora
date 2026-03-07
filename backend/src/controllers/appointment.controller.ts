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

      const parseLocalDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
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
        end.setHours(23, 59, 59, 999);
      } else if (startDate) {
        start = parseLocalDate(startDate as string);
        const endDateSingle = parseLocalDate(startDate as string);
        endDateSingle.setHours(23, 59, 59, 999);
        end = endDateSingle;
      }

      const appointments = await appointmentService.getAll(req.user!.clinicId, start, end);
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
      const appointmentId = req.params.id as string;
      const clinicId = req.user!.clinicId;
      const { status } = req.body;

      const result = await appointmentService.update(appointmentId, clinicId, req.body);

      // Fire-and-forget notifications on status changes
      if (status) {
        appointmentService.notifyOnStatusChange(appointmentId, clinicId, status);
      }

      res.json(result);
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

  async completeWithInvoice(req: AuthRequest, res: Response) {
    try {
      const result = await appointmentService.completeWithInvoice(
        req.params.id,
        req.user!.clinicId,
        req.body.items,
        req.body.notes
      );
      res.json(result);
    } catch (error) {
      const message = (error as Error).message;
      if (message === 'Appointment not found') {
        return res.status(404).json({ error: message });
      }
      if (message === 'Appointment already completed') {
        return res.status(400).json({ error: message });
      }
      res.status(500).json({ error: message });
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
