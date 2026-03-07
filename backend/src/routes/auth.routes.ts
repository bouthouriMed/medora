import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.post('/register', validate([
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('clinicName').notEmpty(),
]), authController.register);

router.post('/login', validate([
  body('email').isEmail(),
  body('password').notEmpty(),
]), authController.login);

router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

// User management
router.get('/users', authenticate, authController.getUsers);
router.post('/users', authenticate, validate([
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('role').isIn(['DOCTOR', 'NURSE', 'STAFF', 'ADMIN']),
]), authController.createUser);
router.put('/users/:id', authenticate, authController.updateUser);
router.delete('/users/:id', authenticate, authController.deleteUser);

export default router;
