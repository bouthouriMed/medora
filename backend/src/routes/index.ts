import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/auth.controller';
import patientController from '../controllers/patient.controller';
import appointmentController from '../controllers/appointment.controller';
import invoiceController from '../controllers/invoice.controller';
import dashboardController from '../controllers/dashboard.controller';
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
  body('role').isIn(['DOCTOR', 'STAFF']),
]), authController.createUser);
router.put('/auth/users/:id', authenticate, authController.updateUser);
router.delete('/auth/users/:id', authenticate, authController.deleteUser);

router.get('/dashboard', authenticate, dashboardController.getDashboard);

router.get('/patients', authenticate, patientController.getAll);
router.get('/patients/:id', authenticate, patientController.getById);
router.post('/patients', authenticate, validate([
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
]), patientController.create);
router.put('/patients/:id', authenticate, patientController.update);
router.delete('/patients/:id', authenticate, patientController.archive);

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

export default router;
