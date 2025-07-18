import { Router } from 'express';
import { AuthController } from '../controller/AuthController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization endpoints
 */

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/seed-phrase-login', AuthController.seedPhraseLogin);
router.post('/setup-database', AuthController.setupDatabase);

// Protected routes
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/change-password', authenticateToken, AuthController.changePassword);

export default router; 