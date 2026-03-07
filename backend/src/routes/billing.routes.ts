import { Router } from 'express';
import { body } from 'express-validator';
import invoiceController from '../controllers/invoice.controller';
import * as paymentController from '../controllers/payment.controller';
import * as insuranceController from '../controllers/insurance.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Invoices
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

export default router;
