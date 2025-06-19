import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { ApiResponse } from '../types/express';
import { successResponse, errorResponse } from '../utils';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'user';
}

interface AuthResponse {
  user: Partial<typeof User.prototype>;
  token: string;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
  private static readonly JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hash password
   */
  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare password
   */
  public static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate JWT token
   */
  public static generateToken(userId: number, email: string, role: string): string {
    const payload = { 
      userId, 
      email, 
      role 
    };
    
    return jwt.sign(
      payload, 
      this.JWT_SECRET, 
      { 
        expiresIn: '24h',
        issuer: 'paylentine-backend',
        audience: 'paylentine-app'
      }
    );
  }

  /**
   * Verify JWT token
   */
  public static verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Register new user
   */
  public static async register(userData: RegisterData): Promise<ApiResponse<AuthResponse>> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: userData.email } });
      if (existingUser) {
        return errorResponse('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user with explicit role assignment
      const user = await User.create({
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || 'user', // Ensure role is always defined
        isActive: true,
      });

      // Generate token
      const token = this.generateToken(user.id, user.email, user.role);

      // Return response without password
      const userResponse = user.toJSON();

      return successResponse('User registered successfully', {
        user: userResponse,
        token,
      });
    } catch (error: any) {
      return errorResponse('Registration failed', error.message);
    }
  }

  /**
   * Login user
   */
  public static async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      // Find user by email
      const user = await User.findOne({ where: { email: credentials.email } });
      if (!user) {
        return errorResponse('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        return errorResponse('Account is disabled');
      }

      // Compare password
      const isPasswordValid = await this.comparePassword(credentials.password, user.password);
      if (!isPasswordValid) {
        return errorResponse('Invalid email or password');
      }

      // Update last login
      await user.update({ lastLoginAt: new Date() });

      // Generate token
      const token = this.generateToken(user.id, user.email, user.role);

      // Return response without password
      const userResponse = user.toJSON();

      return successResponse('Login successful', {
        user: userResponse,
        token,
      });
    } catch (error: any) {
      return errorResponse('Login failed', error.message);
    }
  }

  /**
   * Get user by ID
   */
  public static async getUserById(userId: number): Promise<User | null> {
    try {
      return await User.findByPk(userId);
    } catch (error) {
      return null;
    }
  }

  /**
   * Change password
   */
  public static async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return errorResponse('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return errorResponse('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Update password
      await user.update({ password: hashedNewPassword });

      return successResponse('Password changed successfully');
    } catch (error: any) {
      return errorResponse('Failed to change password', error.message);
    }
  }
} 