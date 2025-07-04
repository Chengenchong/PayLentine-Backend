import { Request, Response } from 'express';
import { TransactionService } from '../services/TransactionService';
import { HTTP_STATUS } from '../constants';
import { AuthenticatedRequest } from '../middleware/auth';

export class WalletController {
  /**
   * @swagger
   * /api/wallet/balance:
   *   get:
   *     summary: Get wallet balance for specific currency
   *     tags: [Wallet]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: currency
   *         required: false
   *         schema:
   *           type: string
   *           default: USD
   *         description: Currency code (default USD)
   *     responses:
   *       200:
   *         description: Balance retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/WalletBalance'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  public static async getBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const currency = (req.query.currency as string) || 'USD';
      const result = await TransactionService.getWalletBalance(req.user.id, currency);
      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.NOT_FOUND;
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * @swagger
   * /api/wallet/create-currency:
   *   post:
   *     summary: Create a new currency wallet
   *     tags: [Wallet]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateCurrencyWalletRequest'
   *     responses:
   *       201:
   *         description: Currency wallet created successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/WalletBalance'
   *       400:
   *         description: Invalid request or wallet already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  public static async createCurrencyWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { currency } = req.body;

      if (!currency || typeof currency !== 'string') {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Valid currency code is required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await TransactionService.createCurrencyWallet(req.user.id, currency);
      const statusCode = result.success ? HTTP_STATUS.CREATED : HTTP_STATUS.BAD_REQUEST;
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * @swagger
   * /api/wallet/all-balances:
   *   get:
   *     summary: Get all wallet balances for user
   *     tags: [Wallet]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: All balances retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/WalletBalance'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  public static async getAllBalances(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await TransactionService.getAllWalletBalances(req.user.id);
      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.NOT_FOUND;
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * @swagger
   * /api/wallet/add-money:
   *   post:
   *     summary: Add money to wallet
   *     tags: [Wallet]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AddMoneyRequest'
   *     responses:
   *       200:
   *         description: Money added successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/WalletBalance'
   *       400:
   *         description: Invalid request
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  public static async addMoney(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { amount, currency } = req.body;

      if (!amount || amount <= 0) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Valid amount is required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await TransactionService.addMoney(req.user.id, amount, currency);
      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST;
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * @swagger
   * /api/wallet/transfer:
   *   post:
   *     summary: Transfer money to another user
   *     tags: [Wallet]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TransferRequest'
   *     responses:
   *       200:
   *         description: Transfer completed successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/TransferResponse'
   *       400:
   *         description: Invalid request or insufficient balance
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  public static async transfer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { toUserId, amount, currency, description } = req.body;

      if (!toUserId || !amount || amount <= 0) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Valid recipient user ID and amount are required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await TransactionService.transferMoney({
        fromUserId: req.user.id,
        toUserId,
        amount,
        currency,
        description,
      });

      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST;
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
} 