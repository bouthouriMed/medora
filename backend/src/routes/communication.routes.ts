import { Router } from 'express';
import { body } from 'express-validator';
import * as messageController from '../controllers/message.controller';
import * as taskController from '../controllers/task.controller';
import * as notificationController from '../controllers/notification.controller';
import * as prescriptionRequestController from '../controllers/prescriptionRequest.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Messages
router.get('/messages', authenticate, messageController.getMessages);
router.get('/messages/unread', authenticate, messageController.getUnreadCount);
router.get('/messages/:otherId', authenticate, messageController.getConversation);
router.post('/messages', authenticate, validate([
  body('receiverId').notEmpty(),
  body('receiverType').notEmpty(),
  body('body').notEmpty(),
]), messageController.sendMessage);

// Tasks
router.get('/tasks', authenticate, taskController.getTasks);
router.post('/tasks', authenticate, validate([
  body('title').notEmpty(),
]), taskController.createTask);
router.put('/tasks/:id', authenticate, taskController.updateTask);
router.delete('/tasks/:id', authenticate, taskController.deleteTask);

// Notifications
router.get('/notifications', authenticate, notificationController.getNotifications);
router.get('/notifications/unread-count', authenticate, notificationController.getUnreadCount);
router.put('/notifications/:id/read', authenticate, notificationController.markAsRead);
router.put('/notifications/read-all', authenticate, notificationController.markAllAsRead);
router.delete('/notifications/:id', authenticate, notificationController.deleteNotification);

// Prescription Requests
router.get('/prescription-requests', authenticate, prescriptionRequestController.getPrescriptionRequests);
router.put('/prescription-requests/:id', authenticate, validate([
  body('status').isIn(['APPROVED', 'DENIED']),
]), prescriptionRequestController.reviewPrescriptionRequest);

export default router;
