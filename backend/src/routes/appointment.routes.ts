import { Router } from 'express';
import { body } from 'express-validator';
import appointmentController from '../controllers/appointment.controller';
import * as recurringAppointmentController from '../controllers/recurringAppointment.controller';
import * as appointmentRequestController from '../controllers/appointmentRequest.controller';
import * as waitlistController from '../controllers/waitlist.controller';
import * as reminderController from '../controllers/reminder.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Appointments CRUD
router.get('/', authenticate, appointmentController.getAll);
router.get('/:id', authenticate, appointmentController.getById);
router.post('/', authenticate, validate([
  body('patientId').notEmpty(),
  body('doctorId').notEmpty(),
  body('dateTime').isISO8601(),
]), appointmentController.create);
router.put('/:id', authenticate, appointmentController.update);
router.delete('/:id', authenticate, appointmentController.cancel);
router.post('/:id/complete-with-invoice', authenticate, appointmentController.completeWithInvoice);

export default router;

// Exported sub-routers for mounting at different paths
export function mountSchedulingRoutes(parentRouter: Router) {
  // Patient appointments (mounted under /patients)
  // handled in patient.routes via separate import

  // Recurring appointments
  parentRouter.get('/recurring-appointments', authenticate, recurringAppointmentController.getAllRecurringAppointments);
  parentRouter.post('/recurring-appointments', authenticate, validate([
    body('patientId').notEmpty(),
    body('doctorId').notEmpty(),
    body('frequency').notEmpty(),
  ]), recurringAppointmentController.createRecurringAppointment);
  parentRouter.delete('/recurring-appointments/:id', authenticate, recurringAppointmentController.deleteRecurringAppointment);

  // Appointment requests
  parentRouter.get('/appointment-requests', authenticate, appointmentRequestController.getAppointmentRequests);
  parentRouter.post('/appointment-requests/:id/approve', authenticate, appointmentRequestController.approveAppointmentRequest);
  parentRouter.post('/appointment-requests/:id/reject', authenticate, appointmentRequestController.rejectAppointmentRequest);

  // Waitlist
  parentRouter.get('/waitlist', authenticate, waitlistController.getWaitlist);
  parentRouter.post('/waitlist', authenticate, validate([
    body('patientId').notEmpty(),
  ]), waitlistController.createWaitlistEntry);
  parentRouter.put('/waitlist/:id', authenticate, waitlistController.updateWaitlistEntry);
  parentRouter.delete('/waitlist/:id', authenticate, waitlistController.deleteWaitlistEntry);
  parentRouter.post('/waitlist/:id/book', authenticate, validate([
    body('dateTime').isISO8601(),
  ]), waitlistController.bookFromWaitlist);

  // Reminders
  parentRouter.get('/reminders', authenticate, reminderController.getPendingReminders);
  parentRouter.post('/reminders/send', authenticate, reminderController.triggerReminders);
}
