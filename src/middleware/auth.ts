import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { CustomRequest } from '../types/express';
import { errorResponse } from '../utils';
import { HTTP_STATUS } from '../constants';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json(
        errorResponse('Access token is required')
      );
      return;
    }

    // Verify token
    const decoded = AuthService.verifyToken(token);
    
    // Get user from database
    const user = await AuthService.getUserById(decoded.userId);
    
    if (!user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json(
        errorResponse('Invalid token - user not found')
      );
      return;
    }

    if (!user.isActive) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json(
        errorResponse('Account is disabled')
      );
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error: any) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(
      errorResponse('Invalid or expired token', error.message)
    );
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(
      errorResponse('Authentication required')
    );
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(HTTP_STATUS.FORBIDDEN).json(
      errorResponse('Admin access required')
    );
    return;
  }

  next();
};

/**
 * Middleware to check if user has specific role
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json(
        errorResponse('Authentication required')
      );
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(HTTP_STATUS.FORBIDDEN).json(
        errorResponse(`Access denied. Required roles: ${allowedRoles.join(', ')}`)
      );
      return;
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require it
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = AuthService.verifyToken(token);
      const user = await AuthService.getUserById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
}; 