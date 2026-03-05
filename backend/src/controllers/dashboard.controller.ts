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

  async getAnalytics(req: AuthRequest, res: Response) {
    try {
      const analytics = await dashboardService.getAnalytics(req.user!.clinicId);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getSmartScheduling(req: AuthRequest, res: Response) {
    try {
      const data = await dashboardService.getSmartSchedulingSuggestions(req.user!.clinicId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}

export default new DashboardController();
