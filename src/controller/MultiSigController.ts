import { Response } from 'express';
import { CustomRequest } from '../types/express';
import { MultiSigService } from '../services/MultiSigService';
import { PendingTransactionType } from '../models/PendingTransaction';
import * as crypto from 'crypto';

// Temporary storage for seed phrase verification tokens
// In production, use Redis or another cache solution
const seedPhraseVerificationTokens = new Map<string, { token: string; expiresAt: number }>();

// Helper function to clean up expired tokens
const cleanupExpiredTokens = () => {
  const now = Date.now();
  for (const [userId, tokenData] of seedPhraseVerificationTokens.entries()) {
    if (now > tokenData.expiresAt) {
      seedPhraseVerificationTokens.delete(userId);
    }
  }
};

// Clean up expired tokens every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);

export class MultiSigController {
  /**
   * Get user's multi-signature settings
   */
  static async getSettings(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const settings = await MultiSigService.getSettings(parseInt(userId));

      if (!settings) {
        res.json({
          hasSettings: false,
          settings: {
            isEnabled: false,
            thresholdAmount: 1000,
            signerUserId: null,
            requiresSeedPhrase: false // Default to false for easy setup
          }
        });
        return;
      }

      res.json({
        hasSettings: true,
        settings: {
          id: settings.id,
          isEnabled: settings.isEnabled,
          thresholdAmount: parseFloat(settings.thresholdAmount.toString()),
          signerUserId: settings.signerUserId,
          requiresSeedPhrase: settings.requiresSeedPhrase,
          signer: (settings as any).signer || null,
          createdAt: settings.createdAt,
          updatedAt: settings.updatedAt
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }


  /**
   * Update user's multi-signature settings using signer email
   */
  static async updateSettingsByEmail(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const { isEnabled, thresholdAmount, signerEmail, requiresSeedPhrase, verificationToken } = req.body;

      // Validation
      if (typeof isEnabled !== 'boolean') {
        res.status(400).json({ success: false, message: 'isEnabled must be a boolean' });
        return;
      }

      if (thresholdAmount && (typeof thresholdAmount !== 'number' || thresholdAmount < 0.01)) {
        res.status(400).json({ success: false, message: 'thresholdAmount must be a positive number >= 0.01' });
        return;
      }

      // Check if current settings are "locked" (requiresSeedPhrase is true)
      let seedPhraseVerified = false;
      const existingSettings = await MultiSigService.getSettings(parseInt(userId));
      
      if (existingSettings && existingSettings.requiresSeedPhrase) {
        // Settings are locked, need verification token
        if (!verificationToken || typeof verificationToken !== 'string') {
          res.status(400).json({ 
            success: false, 
            message: 'Verification token required to modify locked multi-signature settings' 
          });
          return;
        }

        // Check if token is valid and not expired
        const storedToken = seedPhraseVerificationTokens.get(userId);
        if (!storedToken || storedToken.token !== verificationToken || Date.now() > storedToken.expiresAt) {
          res.status(400).json({ 
            success: false, 
            message: 'Invalid or expired verification token' 
          });
          return;
        }

        seedPhraseVerified = true;
        // Remove the used token
        seedPhraseVerificationTokens.delete(userId);
      }

      let signerUserId = null;
      
      // If signerEmail is provided, find the corresponding user
      if (signerEmail) {
        try {
          // First verify this email exists in user's contacts
          const contactExists = await MultiSigService.checkContactExists(parseInt(userId), signerEmail);
          if (!contactExists) {
            res.status(400).json({ 
              success: false, 
              message: 'Selected email is not in your contacts list' 
            });
            return;
          }

          // Find the actual user with this email
          const signerUser = await MultiSigService.findUserByEmail(signerEmail);
          if (!signerUser) {
            res.status(400).json({ 
              success: false, 
              message: 'No registered user found with this email address' 
            });
            return;
          }

          if (signerUser.id === parseInt(userId)) {
            res.status(400).json({ 
              success: false, 
              message: 'Cannot set yourself as the signer' 
            });
            return;
          }

          signerUserId = signerUser.id;
        } catch (error: any) {
          res.status(400).json({ 
            success: false, 
            message: `Error validating signer email: ${error.message}` 
          });
          return;
        }
      }

      // Update settings
      const updatedSettings = await MultiSigService.updateSettings(
        parseInt(userId),
        {
          isEnabled,
          thresholdAmount,
          signerUserId: signerUserId || undefined,
          requiresSeedPhrase
        },
        seedPhraseVerified
      );

      res.json({
        success: true,
        message: 'Multi-signature settings updated successfully',
        settings: updatedSettings
      });

    } catch (error: any) {
      console.error('Error updating multi-sig settings by email:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Check if a transaction requires multi-signature approval
   */
  static async checkMultiSigRequired(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { amount } = req.query;

      if (!amount) {
        res.status(400).json({ error: 'Amount is required' });
        return;
      }

      const transactionAmount = parseFloat(amount as string);
      if (isNaN(transactionAmount) || transactionAmount <= 0) {
        res.status(400).json({ error: 'Amount must be a positive number' });
        return;
      }

      const result = await MultiSigService.checkMultiSigRequired(parseInt(userId), transactionAmount);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create a pending transaction for multi-sig approval
   */
  static async createPendingTransaction(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const {
        transactionType,
        amount,
        currency,
        recipientAddress,
        recipientUserId,
        description,
        transactionData,
        expiresInHours
      } = req.body;

      // Validation
      if (!transactionType || !['wallet_transfer', 'community_market', 'withdrawal', 'payment'].includes(transactionType)) {
        res.status(400).json({ error: 'Invalid transaction type' });
        return;
      }

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({ error: 'Amount must be a positive number' });
        return;
      }

      // Check if multi-sig is required
      const multiSigCheck = await MultiSigService.checkMultiSigRequired(parseInt(userId), amount);
      if (!multiSigCheck.requiresMultiSig) {
        res.status(400).json({ error: 'Multi-signature not required for this transaction', reason: multiSigCheck.reason });
        return;
      }

      const pendingTransaction = await MultiSigService.createPendingTransaction({
        initiatorUserId: parseInt(userId),
        signerUserId: multiSigCheck.signerUserId!,
        transactionType: transactionType as PendingTransactionType,
        amount,
        currency,
        recipientAddress,
        recipientUserId: recipientUserId ? parseInt(recipientUserId) : undefined,
        description,
        transactionData,
        expiresInHours
      });

      res.status(201).json({
        message: 'Pending transaction created successfully',
        transaction: {
          id: pendingTransaction.id,
          status: pendingTransaction.status,
          amount: parseFloat(pendingTransaction.amount.toString()),
          expiresAt: pendingTransaction.expiresAt,
          signerUserId: pendingTransaction.signerUserId
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get pending transactions that need approval (for signer)
   */
  static async getPendingApprovals(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const {
        status = 'pending',
        transactionType,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const result = await MultiSigService.getPendingApprovals(
        parseInt(userId),
        {
          status: typeof status === 'string' ? status.split(',') : (status as string[]),
          transactionType: typeof transactionType === 'string' ? transactionType.split(',') : (transactionType as string[])
        },
        {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          sortBy: sortBy as any,
          sortOrder: sortOrder as 'ASC' | 'DESC'
        }
      );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get user's initiated transactions
   */
  static async getInitiatedTransactions(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const {
        status,
        transactionType,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const result = await MultiSigService.getInitiatedTransactions(
        parseInt(userId),
        {
          status: typeof status === 'string' ? status.split(',') : (status as string[]),
          transactionType: typeof transactionType === 'string' ? transactionType.split(',') : (transactionType as string[])
        },
        {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          sortBy: sortBy as any,
          sortOrder: sortOrder as 'ASC' | 'DESC'
        }
      );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Approve a pending transaction
   */
  static async approveTransaction(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const { message } = req.body;

      const transactionId = parseInt(id);
      if (isNaN(transactionId)) {
        res.status(400).json({ error: 'Invalid transaction ID' });
        return;
      }

      const transaction = await MultiSigService.approveTransaction(
        transactionId,
        parseInt(userId),
        message
      );

      res.json({
        message: 'Transaction approved successfully',
        transaction: {
          id: transaction.id,
          status: transaction.status,
          approvedAt: transaction.approvedAt,
          approvalMessage: transaction.approvalMessage
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Reject a pending transaction
   */
  static async rejectTransaction(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const { reason } = req.body;

      const transactionId = parseInt(id);
      if (isNaN(transactionId)) {
        res.status(400).json({ error: 'Invalid transaction ID' });
        return;
      }

      if (!reason || reason.trim().length === 0) {
        res.status(400).json({ error: 'Rejection reason is required' });
        return;
      }

      const transaction = await MultiSigService.rejectTransaction(
        transactionId,
        parseInt(userId),
        reason
      );

      res.json({
        message: 'Transaction rejected successfully',
        transaction: {
          id: transaction.id,
          status: transaction.status,
          rejectedAt: transaction.rejectedAt,
          rejectionReason: transaction.rejectionReason
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Cancel a pending transaction (by initiator)
   */
  static async cancelTransaction(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { id } = req.params;

      const transactionId = parseInt(id);
      if (isNaN(transactionId)) {
        res.status(400).json({ error: 'Invalid transaction ID' });
        return;
      }

      const transaction = await MultiSigService.cancelTransaction(
        transactionId,
        parseInt(userId)
      );

      res.json({
        message: 'Transaction cancelled successfully',
        transaction: {
          id: transaction.id,
          status: transaction.status
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get transaction details by ID
   */
  static async getTransactionById(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { id } = req.params;

      const transactionId = parseInt(id);
      if (isNaN(transactionId)) {
        res.status(400).json({ error: 'Invalid transaction ID' });
        return;
      }

      const transaction = await MultiSigService.getTransactionById(transactionId);

      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      // Check if user has permission to view this transaction
      const userIdNum = parseInt(userId);
      if (transaction.initiatorUserId !== userIdNum && transaction.signerUserId !== userIdNum) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json({
        transaction: {
          id: transaction.id,
          initiatorUserId: transaction.initiatorUserId,
          signerUserId: transaction.signerUserId,
          transactionType: transaction.transactionType,
          amount: parseFloat(transaction.amount.toString()),
          currency: transaction.currency,
          recipientAddress: transaction.recipientAddress,
          recipientUserId: transaction.recipientUserId,
          description: transaction.description,
          transactionData: transaction.transactionData,
          status: transaction.status,
          expiresAt: transaction.expiresAt,
          approvedAt: transaction.approvedAt,
          rejectedAt: transaction.rejectedAt,
          approvalMessage: transaction.approvalMessage,
          rejectionReason: transaction.rejectionReason,
          timeRemaining: transaction.getTimeRemaining(),
          timeRemainingHours: transaction.getTimeRemainingHours(),
          initiator: (transaction as any).initiator,
          signer: (transaction as any).signer,
          recipient: (transaction as any).recipient,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get multi-sig statistics for current user
   */
  static async getStats(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const stats = await MultiSigService.getMultiSigStats(parseInt(userId));

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Validate seed phrase
   */
  static async validateSeedPhrase(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { seedPhrase } = req.body;

      if (!seedPhrase || typeof seedPhrase !== 'string') {
        res.status(400).json({ error: 'Seed phrase is required' });
        return;
      }

      const isValid = await MultiSigService.validateSeedPhrase(parseInt(userId), seedPhrase);

      if (isValid) {
        // Generate a temporary verification token (valid for 5 minutes)
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // Store the token temporarily
        seedPhraseVerificationTokens.set(userId, {
          token: verificationToken,
          expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
        });

        res.json({
          valid: true,
          message: 'Seed phrase is valid',
          verificationToken
        });
      } else {
        res.json({
          valid: false,
          message: 'Invalid seed phrase'
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Clean up expired transactions (Admin function)
   */
  static async cleanupExpiredTransactions(req: CustomRequest, res: Response): Promise<void> {
    try {
      const updatedCount = await MultiSigService.cleanupExpiredTransactions();

      res.json({
        message: 'Expired transactions cleaned up successfully',
        updatedCount
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default MultiSigController;
