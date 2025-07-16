import { Router } from 'express';
import authRoutes from './auth';
import walletRoutes from './wallet';
import communityMarketRoutes from './communityMarket';
import kycRoutes from './kyc';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 message:
 *                   type: string
 *                   example: "PayLentine Backend is running!"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-01-01T00:00:00.000Z"
 */

// Mount authentication routes
router.use('/auth', authRoutes);

// Mount wallet routes
router.use('/wallet', walletRoutes);

// Mount community market routes
router.use('/community-market', communityMarketRoutes);

// Mount KYC routes
router.use('/kyc', kycRoutes);

// Health check route (also available at root level)
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'PayLentine Backend API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router; 