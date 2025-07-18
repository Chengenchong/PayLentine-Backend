import { Op } from 'sequelize';
import { MultiSigSettings, PendingTransaction, User, Contact } from '../models';
import { PendingTransactionType } from '../models/PendingTransaction';

export interface MultiSigSettingsData {
  isEnabled: boolean;
  thresholdAmount: number;
  signerUserId?: number;
  requiresSeedPhrase?: boolean;
}

export interface CreatePendingTransactionData {
  initiatorUserId: number;
  signerUserId: number;
  transactionType: PendingTransactionType;
  amount: number;
  currency?: string;
  recipientAddress?: string;
  recipientUserId?: number;
  description?: string;
  transactionData?: any;
  expiresInHours?: number;
  originalRequestId?: string;
}

export interface MultiSigCheckResult {
  requiresMultiSig: boolean;
  reason?: string;
  settings?: MultiSigSettings;
  signerUserId?: number;
}

export interface PendingTransactionFilters {
  status?: string | string[];
  transactionType?: string | string[];
  initiatorUserId?: number;
  signerUserId?: number;
  expiringBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface PendingTransactionPagination {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'expiresAt' | 'amount';
  sortOrder?: 'ASC' | 'DESC';
}

export class MultiSigService {
  /**
   * Get user's multi-signature settings
   */
  static async getSettings(userId: number): Promise<MultiSigSettings | null> {
    try {
      return await MultiSigSettings.findOne({
        where: { userId },
        include: [
          {
            model: User,
            as: 'signer',
            attributes: ['id', 'email', 'firstName', 'lastName']
          }
        ]
      });
    } catch (error: any) {
      throw new Error(`Failed to get multi-sig settings: ${error.message}`);
    }
  }

  /**
   * Create or update user's multi-signature settings
   */
  static async updateSettings(
    userId: number, 
    settingsData: MultiSigSettingsData,
    seedPhraseVerified: boolean = false
  ): Promise<MultiSigSettings> {
    try {
      // Check if settings exist
      let settings = await MultiSigSettings.findOne({ where: { userId } });

      if (settings) {
        // If disabling multi-sig or changing signer, require seed phrase verification
        const requiresVerification = (
          (settings.isEnabled && !settingsData.isEnabled) || // Disabling
          (settings.signerUserId !== settingsData.signerUserId) // Changing signer
        );

        if (requiresVerification && settings.requiresSeedPhrase && !seedPhraseVerified) {
          throw new Error('Seed phrase verification required for this operation');
        }

        // Update existing settings
        await settings.update(settingsData);
      } else {
        // Create new settings
        settings = await MultiSigSettings.create({
          userId,
          ...settingsData
        });
      }

      // Validate signer exists if provided
      if (settings.signerUserId) {
        const signer = await User.findByPk(settings.signerUserId);
        if (!signer) {
          throw new Error('Signer user not found');
        }
        if (signer.id === userId) {
          throw new Error('Cannot set yourself as the signer');
        }
      }

      return settings;
    } catch (error: any) {
      throw new Error(`Failed to update multi-sig settings: ${error.message}`);
    }
  }

  /**
   * Check if a transaction requires multi-signature approval
   */
  static async checkMultiSigRequired(
    userId: number, 
    amount: number
  ): Promise<MultiSigCheckResult> {
    try {
      const settings = await MultiSigSettings.findOne({ where: { userId } });

      if (!settings) {
        return { requiresMultiSig: false, reason: 'Multi-sig not configured' };
      }

      if (!settings.isEnabled) {
        return { requiresMultiSig: false, reason: 'Multi-sig disabled' };
      }

      if (!settings.hasValidSigner()) {
        return { requiresMultiSig: false, reason: 'No valid signer assigned' };
      }

      if (amount < settings.thresholdAmount) {
        return { 
          requiresMultiSig: false, 
          reason: `Amount (${amount}) below threshold (${settings.thresholdAmount})` 
        };
      }

      return {
        requiresMultiSig: true,
        settings,
        signerUserId: settings.signerUserId
      };
    } catch (error: any) {
      throw new Error(`Failed to check multi-sig requirements: ${error.message}`);
    }
  }

  /**
   * Create a pending transaction for multi-sig approval
   */
  static async createPendingTransaction(data: CreatePendingTransactionData): Promise<PendingTransaction> {
    try {
      // Validate initiator exists
      const initiator = await User.findByPk(data.initiatorUserId);
      if (!initiator) {
        throw new Error('Initiator user not found');
      }

      // Validate signer exists
      const signer = await User.findByPk(data.signerUserId);
      if (!signer) {
        throw new Error('Signer user not found');
      }

      // Set expiration time (default 24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (data.expiresInHours || 24));

      const pendingTransaction = await PendingTransaction.create({
        initiatorUserId: data.initiatorUserId,
        signerUserId: data.signerUserId,
        transactionType: data.transactionType,
        amount: data.amount,
        currency: data.currency || 'USD',
        recipientAddress: data.recipientAddress,
        recipientUserId: data.recipientUserId,
        description: data.description,
        transactionData: data.transactionData || {},
        expiresAt,
        originalRequestId: data.originalRequestId,
        status: 'pending'
      });

      return pendingTransaction;
    } catch (error: any) {
      throw new Error(`Failed to create pending transaction: ${error.message}`);
    }
  }

  /**
   * Get pending transactions for a signer
   */
  static async getPendingApprovals(
    signerUserId: number,
    filters: PendingTransactionFilters = {},
    pagination: PendingTransactionPagination = {}
  ): Promise<{
    transactions: PendingTransaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = pagination;

      const offset = (page - 1) * limit;

      // Build where clause
      const where: any = {
        signerUserId,
        ...filters
      };

      // Handle status filter
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          where.status = { [Op.in]: filters.status };
        } else {
          where.status = filters.status;
        }
      }

      // Handle transaction type filter
      if (filters.transactionType) {
        if (Array.isArray(filters.transactionType)) {
          where.transactionType = { [Op.in]: filters.transactionType };
        } else {
          where.transactionType = filters.transactionType;
        }
      }

      // Handle date filters
      if (filters.expiringBefore) {
        where.expiresAt = { [Op.lte]: filters.expiringBefore };
      }

      if (filters.createdAfter || filters.createdBefore) {
        where.createdAt = {};
        if (filters.createdAfter) {
          where.createdAt[Op.gte] = filters.createdAfter;
        }
        if (filters.createdBefore) {
          where.createdAt[Op.lte] = filters.createdBefore;
        }
      }

      const { rows: transactions, count: total } = await PendingTransaction.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'initiator',
            attributes: ['id', 'email', 'firstName', 'lastName']
          },
          {
            model: User,
            as: 'recipient',
            attributes: ['id', 'email', 'firstName', 'lastName']
          }
        ],
        limit,
        offset,
        order: [[sortBy, sortOrder]]
      });

      return {
        transactions,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`Failed to get pending approvals: ${error.message}`);
    }
  }

  /**
   * Get user's initiated transactions
   */
  static async getInitiatedTransactions(
    initiatorUserId: number,
    filters: PendingTransactionFilters = {},
    pagination: PendingTransactionPagination = {}
  ): Promise<{
    transactions: PendingTransaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const result = await this.getPendingApprovals(0, { // Use 0 as dummy signer
        ...filters,
        initiatorUserId
      }, pagination);

      // Update the where clause to use initiatorUserId instead of signerUserId
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = pagination;

      const offset = (page - 1) * limit;
      const where: any = { initiatorUserId, ...filters };

      // Handle status filter
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          where.status = { [Op.in]: filters.status };
        } else {
          where.status = filters.status;
        }
      }

      const { rows: transactions, count: total } = await PendingTransaction.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'signer',
            attributes: ['id', 'email', 'firstName', 'lastName']
          },
          {
            model: User,
            as: 'recipient',
            attributes: ['id', 'email', 'firstName', 'lastName']
          }
        ],
        limit,
        offset,
        order: [[sortBy, sortOrder]]
      });

      return {
        transactions,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`Failed to get initiated transactions: ${error.message}`);
    }
  }

  /**
   * Approve a pending transaction
   */
  static async approveTransaction(
    transactionId: number,
    signerUserId: number,
    message?: string
  ): Promise<PendingTransaction> {
    try {
      const transaction = await PendingTransaction.findOne({
        where: {
          id: transactionId,
          signerUserId,
          status: 'pending'
        },
        include: [
          {
            model: User,
            as: 'initiator',
            attributes: ['id', 'email', 'firstName', 'lastName']
          }
        ]
      });

      if (!transaction) {
        throw new Error('Pending transaction not found or already processed');
      }

      await transaction.approve(message);
      return transaction;
    } catch (error: any) {
      throw new Error(`Failed to approve transaction: ${error.message}`);
    }
  }

  /**
   * Reject a pending transaction
   */
  static async rejectTransaction(
    transactionId: number,
    signerUserId: number,
    reason: string
  ): Promise<PendingTransaction> {
    try {
      const transaction = await PendingTransaction.findOne({
        where: {
          id: transactionId,
          signerUserId,
          status: 'pending'
        },
        include: [
          {
            model: User,
            as: 'initiator',
            attributes: ['id', 'email', 'firstName', 'lastName']
          }
        ]
      });

      if (!transaction) {
        throw new Error('Pending transaction not found or already processed');
      }

      if (!reason || reason.trim().length === 0) {
        throw new Error('Rejection reason is required');
      }

      await transaction.reject(reason);
      return transaction;
    } catch (error: any) {
      throw new Error(`Failed to reject transaction: ${error.message}`);
    }
  }

  /**
   * Cancel a pending transaction (by initiator)
   */
  static async cancelTransaction(
    transactionId: number,
    initiatorUserId: number
  ): Promise<PendingTransaction> {
    try {
      const transaction = await PendingTransaction.findOne({
        where: {
          id: transactionId,
          initiatorUserId,
          status: 'pending'
        }
      });

      if (!transaction) {
        throw new Error('Pending transaction not found or cannot be cancelled');
      }

      await transaction.cancel();
      return transaction;
    } catch (error: any) {
      throw new Error(`Failed to cancel transaction: ${error.message}`);
    }
  }

  /**
   * Get transaction by ID
   */
  static async getTransactionById(transactionId: number): Promise<PendingTransaction | null> {
    try {
      return await PendingTransaction.findByPk(transactionId, {
        include: [
          {
            model: User,
            as: 'initiator',
            attributes: ['id', 'email', 'firstName', 'lastName']
          },
          {
            model: User,
            as: 'signer',
            attributes: ['id', 'email', 'firstName', 'lastName']
          },
          {
            model: User,
            as: 'recipient',
            attributes: ['id', 'email', 'firstName', 'lastName']
          }
        ]
      });
    } catch (error: any) {
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }

  /**
   * Clean up expired transactions
   */
  static async cleanupExpiredTransactions(): Promise<number> {
    try {
      const [updatedCount] = await PendingTransaction.update(
        { status: 'expired' },
        {
          where: {
            status: 'pending',
            expiresAt: { [Op.lt]: new Date() }
          }
        }
      );

      return updatedCount;
    } catch (error: any) {
      throw new Error(`Failed to cleanup expired transactions: ${error.message}`);
    }
  }

  /**
   * Get multi-sig statistics for a user
   */
  static async getMultiSigStats(userId: number): Promise<{
    pendingApprovals: number;
    initiatedPending: number;
    totalApproved: number;
    totalRejected: number;
    expiringSoon: number;
  }> {
    try {
      const oneDayFromNow = new Date();
      oneDayFromNow.setHours(oneDayFromNow.getHours() + 24);

      const [
        pendingApprovals,
        initiatedPending,
        totalApproved,
        totalRejected,
        expiringSoon
      ] = await Promise.all([
        PendingTransaction.count({
          where: { signerUserId: userId, status: 'pending' }
        }),
        PendingTransaction.count({
          where: { initiatorUserId: userId, status: 'pending' }
        }),
        PendingTransaction.count({
          where: { signerUserId: userId, status: 'approved' }
        }),
        PendingTransaction.count({
          where: { signerUserId: userId, status: 'rejected' }
        }),
        PendingTransaction.count({
          where: {
            signerUserId: userId,
            status: 'pending',
            expiresAt: { [Op.lte]: oneDayFromNow }
          }
        })
      ]);

      return {
        pendingApprovals,
        initiatedPending,
        totalApproved,
        totalRejected,
        expiringSoon
      };
    } catch (error: any) {
      throw new Error(`Failed to get multi-sig statistics: ${error.message}`);
    }
  }

  /**
   * Validate seed phrase (placeholder - implement according to your seed phrase system)
   */
  static async validateSeedPhrase(userId: number, seedPhrase: string): Promise<boolean> {
    try {
      // TODO: Implement actual seed phrase validation
      // This is a placeholder implementation
      
      // In a real implementation, you would:
      // 1. Retrieve the user's stored seed phrase hash
      // 2. Compare the provided seed phrase with the stored hash
      // 3. Return true if they match, false otherwise
      
      // For now, we'll return true if the seed phrase has 12 words
      const words = seedPhrase.trim().split(/\s+/);
      return words.length === 12;
    } catch (error: any) {
      throw new Error(`Failed to validate seed phrase: ${error.message}`);
    }
  }

  /**
   * Check if an email exists in user's contacts and return the contact user
   */
  static async checkContactExists(userId: number, email: string): Promise<boolean> {
    try {
      // Find the contact by joining with User table to check email
      const contact = await Contact.findOne({
        where: {
          ownerId: userId // Contact belongs to current user
        },
        include: [
          {
            model: User,
            as: 'contactUser', // This should match your association
            where: {
              email: email
            },
            attributes: ['id', 'email']
          }
        ]
      });

      return !!contact;
    } catch (error: any) {
      throw new Error(`Failed to check contact: ${error.message}`);
    }
  }

  /**
   * Find a user by email address
   */
  static async findUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await User.findOne({
        where: { email: email },
        attributes: ['id', 'email', 'firstName', 'lastName']
      });

      return user;
    } catch (error: any) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }
}

export default MultiSigService;
