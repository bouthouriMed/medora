import { Router } from 'express';
import authRoutes from './auth.routes';
import dashboardRoutes from './dashboard.routes';
import patientRoutes from './patient.routes';
import appointmentRoutes, { mountSchedulingRoutes } from './appointment.routes';
import clinicalRoutes from './clinical.routes';
import billingRoutes from './billing.routes';
import communicationRoutes from './communication.routes';
import adminRoutes from './admin.routes';
import publicRoutes from './public.routes';
import advancedRoutes from './advanced.routes';
import exportRoutes from './export';
import { authenticate } from '../middleware/auth';

// Cross-domain imports for nested patient routes
import appointmentController from '../controllers/appointment.controller';
import * as medicalRecordController from '../controllers/medicalRecord.controller';

const router = Router();

// ── Auth & Dashboard ──────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);

// ── Patients (CRUD + tags + custom fields) ────────────────────
router.use('/patients', patientRoutes);

// ── Patient sub-resources (cross-domain) ──────────────────────
router.get('/patients/:patientId/appointments', authenticate, appointmentController.getByPatient);
router.get('/patients/:patientId/medical-history', authenticate, medicalRecordController.getPatientMedicalHistory);
router.post('/patients/:patientId/vitals', authenticate, medicalRecordController.createVital);
router.post('/patients/:patientId/diagnoses', authenticate, medicalRecordController.createDiagnosis);
router.post('/patients/:patientId/prescriptions', authenticate, medicalRecordController.createPrescription);
router.post('/patients/:patientId/allergies', authenticate, medicalRecordController.createAllergy);
router.post('/patients/:patientId/conditions', authenticate, medicalRecordController.createCondition);
router.post('/patients/:patientId/medical-records', authenticate, medicalRecordController.createMedicalRecord);
router.post('/patients/:patientId/generate-summary', authenticate, medicalRecordController.generatePatientSummary);

// ── Appointments ──────────────────────────────────────────────
router.use('/appointments', appointmentRoutes);

// ── Clinical (lab results, decision support, medical records) ─
router.use('/', clinicalRoutes);

// ── Billing (invoices, payments, insurance) ───────────────────
router.use('/', billingRoutes);

// ── Communication (messages, tasks, notifications) ────────────
router.use('/', communicationRoutes);

// ── Administration (tags, presets, settings, audit logs, etc.) ─
router.use('/', adminRoutes);

// ── Scheduling (recurring, waitlist, reminders, requests) ─────
mountSchedulingRoutes(router);

// ── Public (portal, booking - no auth) ────────────────────────
router.use('/public', publicRoutes);

// ── Advanced (telemedicine, monitoring, marketplace, groups) ──
router.use('/', advancedRoutes);

// ── Export ─────────────────────────────────────────────────────
router.use('/export', authenticate, exportRoutes);

export default router;
