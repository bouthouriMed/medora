import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/auth.controller';
import patientController from '../controllers/patient.controller';
import appointmentController from '../controllers/appointment.controller';
import invoiceController from '../controllers/invoice.controller';
import dashboardController from '../controllers/dashboard.controller';
import presetController from '../controllers/preset.controller';
import publicPortalController from '../controllers/public.controller';
import * as tagController from '../controllers/tag.controller';
import * as customFieldController from '../controllers/customField.controller';
import * as noteTemplateController from '../controllers/noteTemplate.controller';
import * as recurringAppointmentController from '../controllers/recurringAppointment.controller';
import * as settingsController from '../controllers/settings.controller';
import * as labResultController from '../controllers/labResult.controller';
import * as taskController from '../controllers/task.controller';
import * as medicalRecordController from '../controllers/medicalRecord.controller';
import * as waitlistController from '../controllers/waitlist.controller';
import * as ratingController from '../controllers/rating.controller';
import * as messageController from '../controllers/message.controller';
import * as insuranceController from '../controllers/insurance.controller';
import * as prescriptionRequestController from '../controllers/prescriptionRequest.controller';
import * as clinicalController from '../controllers/clinical.controller';
import * as paymentController from '../controllers/payment.controller';
import exportRoutes from './export';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.post('/auth/register', validate([
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('clinicName').notEmpty(),
]), authController.register);

router.post('/auth/login', validate([
  body('email').isEmail(),
  body('password').notEmpty(),
]), authController.login);

router.post('/auth/logout', authenticate, authController.logout);

router.get('/auth/me', authenticate, authController.me);

router.get('/auth/users', authenticate, authController.getUsers);
router.post('/auth/users', authenticate, validate([
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('role').isIn(['DOCTOR', 'NURSE', 'STAFF', 'ADMIN']),
]), authController.createUser);
router.put('/auth/users/:id', authenticate, authController.updateUser);
router.delete('/auth/users/:id', authenticate, authController.deleteUser);

router.get('/dashboard', authenticate, dashboardController.getDashboard);
router.get('/dashboard/analytics', authenticate, dashboardController.getAnalytics);
router.get('/dashboard/smart-scheduling', authenticate, dashboardController.getSmartScheduling);

router.get('/patients', authenticate, patientController.getAll);
router.get('/patients/:id', authenticate, patientController.getById);
router.post('/patients', authenticate, validate([
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
]), patientController.create);
router.put('/patients/:id', authenticate, patientController.update);
router.delete('/patients/:id', authenticate, patientController.archive);
router.post('/patients/:id/regenerate-token', authenticate, patientController.regenerateToken);

router.get('/appointments', authenticate, appointmentController.getAll);
router.get('/appointments/:id', authenticate, appointmentController.getById);
router.get('/patients/:patientId/appointments', authenticate, appointmentController.getByPatient);
router.post('/appointments', authenticate, validate([
  body('patientId').notEmpty(),
  body('doctorId').notEmpty(),
  body('dateTime').isISO8601(),
]), appointmentController.create);
router.put('/appointments/:id', authenticate, appointmentController.update);
router.delete('/appointments/:id', authenticate, appointmentController.cancel);

router.get('/invoices', authenticate, invoiceController.getAll);
router.get('/invoices/unpaid', authenticate, invoiceController.getUnpaid);
router.get('/invoices/revenue', authenticate, invoiceController.getRevenueSummary);
router.get('/invoices/:id', authenticate, invoiceController.getById);
router.post('/invoices', authenticate, validate([
  body('appointmentId').notEmpty(),
  body('patientId').notEmpty(),
  body('amount').isFloat({ min: 0 }),
]), invoiceController.create);
router.put('/invoices/:id/pay', authenticate, invoiceController.markAsPaid);
router.put('/invoices/:id/unpay', authenticate, invoiceController.markAsUnpaid);
router.delete('/invoices/:id', authenticate, invoiceController.delete);

router.get('/presets', authenticate, presetController.getAll);
router.post('/presets', authenticate, validate([
  body('name').notEmpty(),
  body('type').isIn(['DIAGNOSIS', 'PRESCRIPTION', 'PROCEDURE']),
]), presetController.create);
router.post('/presets/bulk', authenticate, validate([
  body('presets').isArray({ min: 1 }),
]), presetController.createBulk);
router.delete('/presets/:id', authenticate, presetController.delete);

router.get('/public/patient/:token', publicPortalController.getPatientByToken);
router.post('/public/patient/:token/chat', publicPortalController.chatWithAI);

router.post('/public/triage', publicPortalController.triageSymptoms);
router.get('/public/clinic/:clinicId/doctors', publicPortalController.getClinicDoctors);
router.get('/public/clinic/:clinicId/:doctorId/slots/:date', publicPortalController.getAvailableSlots);
router.post('/public/clinic/:clinicId/appointment/request', publicPortalController.requestAppointment);

router.get('/tags', authenticate, tagController.getAllTags);
router.post('/tags', authenticate, validate([
  body('name').notEmpty(),
]), tagController.createTag);
router.delete('/tags/:id', authenticate, tagController.deleteTag);
router.get('/patients/:patientId/tags', authenticate, tagController.getPatientTags);
router.post('/patients/tags', authenticate, validate([
  body('patientId').notEmpty(),
  body('tagId').notEmpty(),
]), tagController.addTagToPatient);
router.delete('/patients/:patientId/tags/:tagId', authenticate, tagController.removeTagFromPatient);

router.get('/custom-fields', authenticate, customFieldController.getAllCustomFields);
router.post('/custom-fields', authenticate, validate([
  body('name').notEmpty(),
]), customFieldController.createCustomField);
router.delete('/custom-fields/:id', authenticate, customFieldController.deleteCustomField);
router.get('/patients/:patientId/custom-fields', authenticate, customFieldController.getPatientCustomFields);
router.post('/patients/:patientId/custom-fields', authenticate, customFieldController.savePatientCustomField);

router.get('/note-templates', authenticate, noteTemplateController.getAllNoteTemplates);
router.post('/note-templates', authenticate, validate([
  body('name').notEmpty(),
  body('content').notEmpty(),
]), noteTemplateController.createNoteTemplate);
router.delete('/note-templates/:id', authenticate, noteTemplateController.deleteNoteTemplate);

router.get('/recurring-appointments', authenticate, recurringAppointmentController.getAllRecurringAppointments);
router.post('/recurring-appointments', authenticate, validate([
  body('patientId').notEmpty(),
  body('doctorId').notEmpty(),
  body('frequency').notEmpty(),
]), recurringAppointmentController.createRecurringAppointment);
router.delete('/recurring-appointments/:id', authenticate, recurringAppointmentController.deleteRecurringAppointment);

router.get('/settings', authenticate, settingsController.getClinicSettings);
router.put('/settings', authenticate, settingsController.updateClinicSettings);
router.post('/settings/test-email', authenticate, settingsController.sendTestEmail);

router.get('/lab-results', authenticate, labResultController.getLabResults);
router.get('/lab-results/:id', authenticate, labResultController.getLabResult);
router.post('/lab-results', authenticate, validate([
  body('patientId').notEmpty(),
  body('testName').notEmpty(),
]), labResultController.createLabResult);
router.put('/lab-results/:id', authenticate, labResultController.updateLabResult);
router.delete('/lab-results/:id', authenticate, labResultController.deleteLabResult);

router.get('/tasks', authenticate, taskController.getTasks);
router.post('/tasks', authenticate, validate([
  body('title').notEmpty(),
]), taskController.createTask);
router.put('/tasks/:id', authenticate, taskController.updateTask);
router.delete('/tasks/:id', authenticate, taskController.deleteTask);

router.get('/patients/:patientId/medical-history', authenticate, medicalRecordController.getPatientMedicalHistory);
router.post('/patients/:patientId/vitals', authenticate, medicalRecordController.createVital);
router.post('/patients/:patientId/diagnoses', authenticate, medicalRecordController.createDiagnosis);
router.put('/diagnoses/:id', authenticate, medicalRecordController.updateDiagnosis);
router.delete('/diagnoses/:id', authenticate, medicalRecordController.deleteDiagnosis);
router.post('/patients/:patientId/prescriptions', authenticate, medicalRecordController.createPrescription);
router.put('/prescriptions/:id', authenticate, medicalRecordController.updatePrescription);
router.delete('/prescriptions/:id', authenticate, medicalRecordController.deletePrescription);
router.post('/patients/:patientId/allergies', authenticate, medicalRecordController.createAllergy);
router.delete('/allergies/:id', authenticate, medicalRecordController.deleteAllergy);
router.post('/patients/:patientId/conditions', authenticate, medicalRecordController.createCondition);
router.delete('/conditions/:id', authenticate, medicalRecordController.deleteCondition);
router.post('/patients/:patientId/medical-records', authenticate, medicalRecordController.createMedicalRecord);
router.put('/medical-records/:id', authenticate, medicalRecordController.updateMedicalRecord);
router.post('/appointments/:id/generate-note', authenticate, medicalRecordController.generateVisitNote);
router.post('/patients/:patientId/generate-summary', authenticate, medicalRecordController.generatePatientSummary);

router.use('/export', authenticate, exportRoutes);

// Waitlist
router.get('/waitlist', authenticate, waitlistController.getWaitlist);
router.post('/waitlist', authenticate, validate([
  body('patientId').notEmpty(),
]), waitlistController.createWaitlistEntry);
router.put('/waitlist/:id', authenticate, waitlistController.updateWaitlistEntry);
router.delete('/waitlist/:id', authenticate, waitlistController.deleteWaitlistEntry);
router.post('/waitlist/:id/book', authenticate, validate([
  body('dateTime').isISO8601(),
]), waitlistController.bookFromWaitlist);

// Doctor Ratings
router.get('/ratings', authenticate, ratingController.getAllDoctorRatingSummaries);
router.get('/ratings/:doctorId', authenticate, ratingController.getDoctorRatings);
router.post('/ratings', authenticate, validate([
  body('doctorId').notEmpty(),
  body('overall').isInt({ min: 1, max: 5 }),
]), ratingController.createRating);

// Messages
router.get('/messages', authenticate, messageController.getMessages);
router.get('/messages/unread', authenticate, messageController.getUnreadCount);
router.get('/messages/:otherId', authenticate, messageController.getConversation);
router.post('/messages', authenticate, validate([
  body('receiverId').notEmpty(),
  body('receiverType').notEmpty(),
  body('body').notEmpty(),
]), messageController.sendMessage);

// Insurance Claims
router.get('/insurance', authenticate, insuranceController.getClaims);
router.get('/insurance/stats', authenticate, insuranceController.getClaimStats);
router.get('/insurance/:id', authenticate, insuranceController.getClaim);
router.post('/insurance', authenticate, validate([
  body('patientId').notEmpty(),
  body('insuranceProvider').notEmpty(),
  body('claimAmount').isFloat({ min: 0 }),
]), insuranceController.createClaim);
router.put('/insurance/:id', authenticate, insuranceController.updateClaim);
router.delete('/insurance/:id', authenticate, insuranceController.deleteClaim);

// Prescription Requests
router.get('/prescription-requests', authenticate, prescriptionRequestController.getPrescriptionRequests);
router.put('/prescription-requests/:id', authenticate, validate([
  body('status').isIn(['APPROVED', 'DENIED']),
]), prescriptionRequestController.reviewPrescriptionRequest);

// Clinical Decision Support
router.post('/clinical/drug-interactions', authenticate, validate([
  body('medications').isArray({ min: 2 }),
]), clinicalController.checkDrugInteractions);
router.post('/clinical/allergy-check', authenticate, validate([
  body('patientId').notEmpty(),
  body('medication').notEmpty(),
]), clinicalController.checkAllergyConflict);
router.get('/clinical/briefing/:patientId', authenticate, clinicalController.getDoctorBriefing);

// Payments
router.get('/payments', authenticate, paymentController.getPayments);
router.post('/payments/checkout', authenticate, validate([
  body('invoiceId').notEmpty(),
  body('returnUrl').notEmpty(),
]), paymentController.createCheckoutSession);
router.post('/payments/manual', authenticate, validate([
  body('invoiceId').notEmpty(),
  body('patientId').notEmpty(),
  body('amount').isFloat({ min: 0 }),
  body('method').notEmpty(),
]), paymentController.recordManualPayment);

// Public Portal - Messages & Prescription Requests
router.post('/public/patient/:token/messages', messageController.sendPortalMessage);
router.get('/public/patient/:token/messages', messageController.getPortalMessages);
router.post('/public/patient/:token/prescription-request', prescriptionRequestController.createPortalPrescriptionRequest);
router.post('/public/clinic/:clinicId/rating', ratingController.createPublicRating);

export default router;
