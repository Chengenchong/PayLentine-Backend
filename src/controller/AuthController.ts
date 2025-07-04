import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { HTTP_STATUS } from '../constants';
import { AuthenticatedRequest } from '../middleware/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class AuthController {
  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterRequest'
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/AuthResponse'
   *       400:
   *         description: Registration failed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Email, password, first name, and last name are required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Register user
      const result = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
        role: role || 'user',
      });

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
   * /api/auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/AuthResponse'
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Email and password are required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Login user
      const result = await AuthService.login({ email, password });

      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.UNAUTHORIZED;
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
   * /api/auth/profile:
   *   get:
   *     summary: Get current user profile
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  public static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const user = await AuthService.getUserById(req.user.id);
      
      if (!user) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'User not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: user.toJSON(),
        timestamp: new Date().toISOString(),
      });
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
   * /api/auth/change-password:
   *   put:
   *     summary: Change user password
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [currentPassword, newPassword]
   *             properties:
   *               currentPassword:
   *                 type: string
   *                 description: Current password
   *                 example: "oldpassword123"
   *               newPassword:
   *                 type: string
   *                 description: New password
   *                 example: "newpassword123"
   *     responses:
   *       200:
   *         description: Password changed successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       400:
   *         description: Invalid request
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  public static async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Current password and new password are required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await AuthService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );

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
   * /api/auth/setup-database:
   *   post:
   *     summary: Initialize database tables and seed data (No authentication required)
   *     tags: [Authentication]
   *     responses:
   *       200:
   *         description: Database setup completed successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       500:
   *         description: Database setup failed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  public static async setupDatabase(req: Request, res: Response): Promise<void> {
    try {
      // Execute the seed command
      const { stdout, stderr } = await execAsync('npm run seed');
      
      if (stderr && !stderr.includes('npm WARN')) {
        throw new Error(`Database setup failed: ${stderr}`);
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Database setup completed successfully',
        data: {
          output: stdout,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Database setup failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
} 