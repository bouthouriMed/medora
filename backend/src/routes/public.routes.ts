import { Router } from 'express';
import publicPortalController from '../controllers/public.controller';
import * as messageController from '../controllers/message.controller';
import * as prescriptionRequestController from '../controllers/prescriptionRequest.controller';
import * as ratingController from '../controllers/rating.controller';
import * as marketplaceController from '../controllers/marketplace.controller';

const router = Router();

// Patient portal
router.get('/patient/:token', publicPortalController.getPatientByToken);
router.post('/patient/:token/chat', publicPortalController.chatWithAI);
router.post('/patient/:token/messages', messageController.sendPortalMessage);
router.get('/patient/:token/messages', messageController.getPortalMessages);
router.post('/patient/:token/prescription-request', prescriptionRequestController.createPortalPrescriptionRequest);
router.post('/patient/:token/marketplace/order', marketplaceController.createPublicOrder);

// Public booking
router.post('/triage', publicPortalController.triageSymptoms);
router.get('/clinic/:clinicId/doctors', publicPortalController.getClinicDoctors);
router.get('/clinic/:clinicId/:doctorId/slots/:date', publicPortalController.getAvailableSlots);
router.post('/clinic/:clinicId/appointment/request', publicPortalController.requestAppointment);
router.post('/clinic/:clinicId/rating', ratingController.createPublicRating);
router.get('/clinic/:clinicId/marketplace', marketplaceController.getPublicItems);

export default router;
