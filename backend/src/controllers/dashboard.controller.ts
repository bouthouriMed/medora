import { Response } from 'express';
import dashboardService from '../services/dashboard.service';
import type { AuthRequest } from '../types/express.d';

export class DashboardController {
  async getDashboard(req: AuthRequest, res: Response) {
    try {
      const dashboard = await dashboardService.getDashboard(req.user!.clinicId);
      res.json(dashboard);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}

export default new DashboardController();
