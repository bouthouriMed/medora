import { Router } from 'express';
import { body } from 'express-validator';
import patientController from '../controllers/patient.controller';
import * as tagController from '../controllers/tag.controller';
import * as customFieldController from '../controllers/customField.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Patient CRUD
router.get('/', authenticate, patientController.getAll);
router.get('/:id', authenticate, patientController.getById);
router.post('/', authenticate, validate([
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
]), patientController.create);
router.put('/:id', authenticate, patientController.update);
router.delete('/:id', authenticate, patientController.archive);
router.post('/:id/restore', authenticate, patientController.restore);
router.post('/:id/regenerate-token', authenticate, patientController.regenerateToken);

// Patient tags
router.get('/:patientId/tags', authenticate, tagController.getPatientTags);
router.post('/tags', authenticate, validate([
  body('patientId').notEmpty(),
  body('tagId').notEmpty(),
]), tagController.addTagToPatient);
router.delete('/:patientId/tags/:tagId', authenticate, tagController.removeTagFromPatient);

// Patient custom fields
router.get('/:patientId/custom-fields', authenticate, customFieldController.getPatientCustomFields);
router.post('/:patientId/custom-fields', authenticate, customFieldController.savePatientCustomField);

export default router;
