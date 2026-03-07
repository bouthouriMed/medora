import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, dashboardController.getDashboard);
router.get('/analytics', authenticate, dashboardController.getAnalytics);
router.get('/smart-scheduling', authenticate, dashboardController.getSmartScheduling);

export default router;
