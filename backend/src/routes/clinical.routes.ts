import { Router } from 'express';
import { body } from 'express-validator';
import * as medicalRecordController from '../controllers/medicalRecord.controller';
import * as labResultController from '../controllers/labResult.controller';
import * as clinicalController from '../controllers/clinical.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Medical History (mounted under /patients/:patientId)
export function mountMedicalRoutes(patientRouter: Router) {
  patientRouter.get('/:patientId/medical-history', authenticate, medicalRecordController.getPatientMedicalHistory);
  patientRouter.post('/:patientId/vitals', authenticate, medicalRecordController.createVital);
  patientRouter.post('/:patientId/diagnoses', authenticate, medicalRecordController.createDiagnosis);
  patientRouter.post('/:patientId/prescriptions', authenticate, medicalRecordController.createPrescription);
  patientRouter.post('/:patientId/allergies', authenticate, medicalRecordController.createAllergy);
  patientRouter.post('/:patientId/conditions', authenticate, medicalRecordController.createCondition);
  patientRouter.post('/:patientId/medical-records', authenticate, medicalRecordController.createMedicalRecord);
  patientRouter.post('/:patientId/generate-summary', authenticate, medicalRecordController.generatePatientSummary);
}

// Standalone medical record routes
router.put('/diagnoses/:id', authenticate, medicalRecordController.updateDiagnosis);
router.delete('/diagnoses/:id', authenticate, medicalRecordController.deleteDiagnosis);
router.put('/prescriptions/:id', authenticate, medicalRecordController.updatePrescription);
router.delete('/prescriptions/:id', authenticate, medicalRecordController.deletePrescription);
router.delete('/allergies/:id', authenticate, medicalRecordController.deleteAllergy);
router.delete('/conditions/:id', authenticate, medicalRecordController.deleteCondition);
router.put('/medical-records/:id', authenticate, medicalRecordController.updateMedicalRecord);

// Lab Results
router.get('/lab-results', authenticate, labResultController.getLabResults);
router.get('/lab-results/:id', authenticate, labResultController.getLabResult);
router.post('/lab-results', authenticate, validate([
  body('patientId').notEmpty(),
  body('testName').notEmpty(),
]), labResultController.createLabResult);
router.put('/lab-results/:id', authenticate, labResultController.updateLabResult);
router.delete('/lab-results/:id', authenticate, labResultController.deleteLabResult);

// Clinical Decision Support
router.post('/clinical/drug-interactions', authenticate, validate([
  body('medications').isArray({ min: 2 }),
]), clinicalController.checkDrugInteractions);
router.post('/clinical/allergy-check', authenticate, validate([
  body('patientId').notEmpty(),
  body('medication').notEmpty(),
]), clinicalController.checkAllergyConflict);
router.get('/clinical/briefing/:patientId', authenticate, clinicalController.getDoctorBriefing);

// Generate visit note (from appointment)
router.post('/appointments/:id/generate-note', authenticate, medicalRecordController.generateVisitNote);

export default router;
