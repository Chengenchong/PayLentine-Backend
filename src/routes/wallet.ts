import { Router } from 'express';
import { WalletController } from '../controller/WalletController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet management and money transfer endpoints
 */

// All wallet routes require authentication
router.use(authenticateToken);

// Wallet routes
router.post('/create-currency', WalletController.createCurrencyWallet);
router.get('/balance', WalletController.getBalance);
router.get('/all-balances', WalletController.getAllBalances);
router.post('/add-money', WalletController.addMoney);
router.post('/transfer', WalletController.transfer);

export default router; 