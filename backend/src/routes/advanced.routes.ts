import { Router } from 'express';
import { body } from 'express-validator';
import * as deviceReadingController from '../controllers/deviceReading.controller';
import * as videoSessionController from '../controllers/videoSession.controller';
import * as marketplaceController from '../controllers/marketplace.controller';
import * as clinicGroupController from '../controllers/clinicGroup.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Remote Patient Monitoring - Device Readings
router.get('/device-readings', authenticate, deviceReadingController.getReadings);
router.get('/device-readings/patient/:patientId', authenticate, deviceReadingController.getPatientReadings);
router.get('/device-readings/patient/:patientId/alerts', authenticate, deviceReadingController.getPatientAlerts);
router.post('/device-readings', authenticate, validate([
  body('patientId').notEmpty(),
  body('deviceType').notEmpty(),
  body('value').isFloat(),
  body('unit').notEmpty(),
]), deviceReadingController.createReading);
router.delete('/device-readings/:id', authenticate, deviceReadingController.deleteReading);

// Video Sessions (Telemedicine)
router.get('/video-sessions', authenticate, videoSessionController.getSessions);
router.get('/video-sessions/:id', authenticate, videoSessionController.getSession);
router.post('/video-sessions', authenticate, validate([
  body('patientId').notEmpty(),
]), videoSessionController.createSession);
router.put('/video-sessions/:id', authenticate, videoSessionController.updateSession);
router.get('/video-sessions/room/:roomId', authenticate, videoSessionController.joinByRoom);

// Medical Marketplace
router.get('/marketplace/items', authenticate, marketplaceController.getItems);
router.post('/marketplace/items', authenticate, validate([
  body('type').isIn(['LAB_TEST', 'MEDICATION', 'SERVICE']),
  body('name').notEmpty(),
  body('price').isFloat({ min: 0 }),
]), marketplaceController.createItem);
router.put('/marketplace/items/:id', authenticate, marketplaceController.updateItem);
router.delete('/marketplace/items/:id', authenticate, marketplaceController.deleteItem);
router.get('/marketplace/orders', authenticate, marketplaceController.getOrders);
router.post('/marketplace/orders', authenticate, validate([
  body('patientId').notEmpty(),
  body('itemId').notEmpty(),
]), marketplaceController.createOrder);
router.put('/marketplace/orders/:id', authenticate, marketplaceController.updateOrder);

// Clinic Groups (Multi-clinic / Franchise)
router.get('/clinic-group', authenticate, clinicGroupController.getClinicGroup);
router.post('/clinic-group', authenticate, validate([
  body('name').notEmpty(),
]), clinicGroupController.createClinicGroup);
router.post('/clinic-group/add-clinic', authenticate, validate([
  body('clinicName').notEmpty(),
]), clinicGroupController.addClinicToGroup);
router.get('/clinic-group/analytics', authenticate, clinicGroupController.getGroupAnalytics);

export default router;
