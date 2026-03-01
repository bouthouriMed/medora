import { Response } from 'express';
import presetService from '../services/preset.service';
import type { AuthRequest } from '../types/express.d';

export class PresetController {
  async create(req: AuthRequest, res: Response) {
    try {
      const preset = await presetService.create(req.user!.clinicId, req.body);
      res.status(201).json(preset);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async createBulk(req: AuthRequest, res: Response) {
    try {
      const { presets } = req.body;
      if (!Array.isArray(presets) || presets.length === 0) {
        return res.status(400).json({ error: 'Presets array is required' });
      }
      const result = await presetService.createBulk(req.user!.clinicId, presets);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async getAll(req: AuthRequest, res: Response) {
    try {
      const { type } = req.query;
      const presets = await presetService.getAll(req.user!.clinicId, type as any);
      res.json(presets);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await presetService.delete(req.params.id as string, req.user!.clinicId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export default new PresetController();
