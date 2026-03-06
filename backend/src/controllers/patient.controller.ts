import { Response } from 'express';
import patientService from '../services/patient.service';
import type { AuthRequest } from '../types/express.d';

export class PatientController {
  async create(req: AuthRequest, res: Response) {
    try {
      const patient = await patientService.create(req.user!.clinicId, req.body);
      res.status(201).json(patient);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async getAll(req: AuthRequest, res: Response) {
    try {
      const { search, includeArchived } = req.query;
      const patients = await patientService.getAll(
        req.user!.clinicId,
        search as string,
        includeArchived === 'true'
      );
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const patient = await patientService.getById(req.params.id as string, req.user!.clinicId);
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const patient = await patientService.update(req.params.id as string, req.user!.clinicId, req.body);
      res.json(patient);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async archive(req: AuthRequest, res: Response) {
    try {
      await patientService.archive(req.params.id as string, req.user!.clinicId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async restore(req: AuthRequest, res: Response) {
    try {
      await patientService.restore(req.params.id as string, req.user!.clinicId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async regenerateToken(req: AuthRequest, res: Response) {
    try {
      const patient = await patientService.regenerateToken(req.params.id as string, req.user!.clinicId);
      res.json(patient);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export default new PatientController();
