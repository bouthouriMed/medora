import { Router } from 'express';
import { body } from 'express-validator';
import * as tagController from '../controllers/tag.controller';
import * as customFieldController from '../controllers/customField.controller';
import * as noteTemplateController from '../controllers/noteTemplate.controller';
import presetController from '../controllers/preset.controller';
import * as settingsController from '../controllers/settings.controller';
import * as auditLogController from '../controllers/auditLog.controller';
import * as ratingController from '../controllers/rating.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Tags
router.get('/tags', authenticate, tagController.getAllTags);
router.post('/tags', authenticate, validate([
  body('name').notEmpty(),
]), tagController.createTag);
router.delete('/tags/:id', authenticate, tagController.deleteTag);

// Custom Fields
router.get('/custom-fields', authenticate, customFieldController.getAllCustomFields);
router.post('/custom-fields', authenticate, validate([
  body('name').notEmpty(),
]), customFieldController.createCustomField);
router.delete('/custom-fields/:id', authenticate, customFieldController.deleteCustomField);

// Note Templates
router.get('/note-templates', authenticate, noteTemplateController.getAllNoteTemplates);
router.post('/note-templates', authenticate, validate([
  body('name').notEmpty(),
  body('content').notEmpty(),
]), noteTemplateController.createNoteTemplate);
router.delete('/note-templates/:id', authenticate, noteTemplateController.deleteNoteTemplate);

// Presets
router.get('/presets', authenticate, presetController.getAll);
router.post('/presets', authenticate, validate([
  body('name').notEmpty(),
  body('type').isIn(['DIAGNOSIS', 'PRESCRIPTION', 'PROCEDURE']),
]), presetController.create);
router.post('/presets/bulk', authenticate, validate([
  body('presets').isArray({ min: 1 }),
]), presetController.createBulk);
router.delete('/presets/:id', authenticate, presetController.delete);

// Settings
router.get('/settings', authenticate, settingsController.getClinicSettings);
router.put('/settings', authenticate, settingsController.updateClinicSettings);
router.post('/settings/test-email', authenticate, settingsController.sendTestEmail);

// Audit Logs
router.get('/audit-logs', authenticate, auditLogController.getAuditLogs);
router.get('/audit-logs/stats', authenticate, auditLogController.getAuditLogStats);

// Doctor Ratings
router.get('/ratings', authenticate, ratingController.getAllDoctorRatingSummaries);
router.get('/ratings/:doctorId', authenticate, ratingController.getDoctorRatings);
router.post('/ratings', authenticate, validate([
  body('doctorId').notEmpty(),
  body('overall').isInt({ min: 1, max: 5 }),
]), ratingController.createRating);

export default router;
