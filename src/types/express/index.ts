import { Request, Response } from 'express';

// Extend Express Request interface
export interface CustomRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Extend Express Response interface  
export interface CustomResponse extends Response {
  // Add custom response methods here if needed
}

// Common API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
} 