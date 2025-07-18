import { ApiResponse } from '../types/express';

/**
 * Create a standardized API response
 */
export const createResponse = <T = any>(
  success: boolean,
  message: string,
  data?: T,
  error?: string
): ApiResponse<T> => {
  return {
    success,
    message,
    data,
    error,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Create a success response
 */
export const successResponse = <T = any>(
  message: string,
  data?: T
): ApiResponse<T> => {
  return createResponse(true, message, data);
};

/**
 * Create an error response
 */
export const errorResponse = (
  message: string,
  error?: string
): ApiResponse => {
  return createResponse(false, message, undefined, error);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate random string
 */
export const generateRandomString = (length: number = 10): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Delay execution (useful for testing)
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Export seed phrase generator
export { SeedPhraseGenerator } from './seedPhraseGenerator';