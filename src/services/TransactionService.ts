import { Transaction } from 'sequelize';
import { User, Wallet, sequelize } from '../models';
import { ApiResponse } from '../types/express';
import { successResponse, errorResponse } from '../utils';

interface TransferData {
  fromUserId: number;
  toUserId: number;
  amount: number;
  currency?: string;
  description?: string;
}

interface TransferResponse {
  fromUser: {
    id: number;
    name: string;
    newBalance: number;
  };
  toUser: {
    id: number;
    name: string;
    newBalance: number;
  };
  amount: number;
  currency: string;
  description?: string;
}

export class TransactionService {
  /**
   * Create currency wallet for user
   */
  public static async createCurrencyWallet(userId: number, currency: string): Promise<ApiResponse<{ balance: number; currency: string }>> {
    try {
      // Check if user exists
      const user = await User.findByPk(userId);
      if (!user || !user.isActive) {
        return errorResponse('User not found or inactive');
      }

      // Check if wallet already exists for this currency
      const existingWallet = await this.getWalletByUserIdAndCurrency(userId, currency);
      if (existingWallet) {
        return errorResponse(`Wallet already exists for currency ${currency}`);
      }

      // Create new wallet
      const wallet = await Wallet.create({
        userId,
        balance: 0.00,
        currency: currency.toUpperCase(),
        isActive: true,
      });

      return successResponse('Currency wallet created successfully', {
        balance: parseFloat(wallet.balance.toString()),
        currency: wallet.currency,
      });
    } catch (error: any) {
      return errorResponse('Failed to create currency wallet', error.message);
    }
  }

  /**
   * Create wallet for user if it doesn't exist (legacy method)
   */
  public static async createWalletForUser(userId: number, currency: string = 'USD'): Promise<Wallet> {
    try {
      const [wallet, created] = await Wallet.findOrCreate({
        where: { userId, currency },
        defaults: {
          userId,
          balance: 0.00,
          currency,
          isActive: true,
        },
      });

      return wallet;
    } catch (error: any) {
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet by user ID and currency
   */
  public static async getWalletByUserIdAndCurrency(userId: number, currency: string): Promise<Wallet | null> {
    try {
      return await Wallet.findOne({ where: { userId, currency, isActive: true } });
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all wallets for a user
   */
  public static async getWalletsByUserId(userId: number): Promise<Wallet[]> {
    try {
      return await Wallet.findAll({ where: { userId, isActive: true } });
    } catch (error) {
      return [];
    }
  }

  /**
   * Get wallet balance for specific currency
   */
  public static async getWalletBalance(userId: number, currency: string = 'USD'): Promise<ApiResponse<{ balance: number; currency: string }>> {
    try {
      const wallet = await this.getWalletByUserIdAndCurrency(userId, currency);
      if (!wallet) {
        return errorResponse('Wallet not found for this currency');
      }

      return successResponse('Wallet balance retrieved successfully', {
        balance: parseFloat(wallet.balance.toString()),
        currency: wallet.currency,
      });
    } catch (error: any) {
      return errorResponse('Failed to get wallet balance', error.message);
    }
  }

  /**
   * Get all wallet balances for a user
   */
  public static async getAllWalletBalances(userId: number): Promise<ApiResponse<{ balance: number; currency: string }[]>> {
    try {
      const wallets = await this.getWalletsByUserId(userId);
      if (wallets.length === 0) {
        return errorResponse('No wallets found for this user');
      }

      const balances = wallets.map(wallet => ({
        balance: parseFloat(wallet.balance.toString()),
        currency: wallet.currency,
      }));

      return successResponse('Wallet balances retrieved successfully', balances);
    } catch (error: any) {
      return errorResponse('Failed to get wallet balances', error.message);
    }
  }

  /**
   * Transfer money between users
   */
  public static async transferMoney(transferData: TransferData): Promise<ApiResponse<TransferResponse>> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const { fromUserId, toUserId, amount, currency = 'USD', description } = transferData;

      // Validate input
      if (fromUserId === toUserId) {
        await transaction.rollback();
        return errorResponse('Cannot transfer money to yourself');
      }

      if (amount <= 0) {
        await transaction.rollback();
        return errorResponse('Transfer amount must be greater than zero');
      }

      // Get users
      const fromUser = await User.findByPk(fromUserId, { transaction });
      const toUser = await User.findByPk(toUserId, { transaction });

      if (!fromUser || !toUser) {
        await transaction.rollback();
        return errorResponse('One or both users not found');
      }

      if (!fromUser.isActive || !toUser.isActive) {
        await transaction.rollback();
        return errorResponse('One or both user accounts are inactive');
      }

      // Get or create wallets
      const fromWallet = await this.findOrCreateWallet(fromUserId, currency, transaction);
      const toWallet = await this.findOrCreateWallet(toUserId, currency, transaction);

      // Check if sender has sufficient balance
      if (fromWallet.hasInsufficientBalance(amount)) {
        await transaction.rollback();
        return errorResponse('Insufficient balance for transfer');
      }

      // Check currency compatibility
      if (fromWallet.currency !== currency || toWallet.currency !== currency) {
        await transaction.rollback();
        return errorResponse('Currency mismatch between wallets');
      }

      // Perform the transfer
      await fromWallet.decrement('balance', { by: amount, transaction });
      await toWallet.increment('balance', { by: amount, transaction });

      // Reload wallets to get updated balances
      await fromWallet.reload({ transaction });
      await toWallet.reload({ transaction });

      // Commit the transaction
      await transaction.commit();

      return successResponse('Transfer completed successfully', {
        fromUser: {
          id: fromUser.id,
          name: fromUser.fullName,
          newBalance: parseFloat(fromWallet.balance.toString()),
        },
        toUser: {
          id: toUser.id,
          name: toUser.fullName,
          newBalance: parseFloat(toWallet.balance.toString()),
        },
        amount,
        currency,
        description,
      });
    } catch (error: any) {
      await transaction.rollback();
      return errorResponse('Transfer failed', error.message);
    }
  }

  /**
   * Add money to user's wallet
   */
  public static async addMoney(userId: number, amount: number, currency: string = 'USD'): Promise<ApiResponse<{ balance: number; currency: string }>> {
    try {
      if (amount <= 0) {
        return errorResponse('Amount must be greater than zero');
      }

      const user = await User.findByPk(userId);
      if (!user || !user.isActive) {
        return errorResponse('User not found or inactive');
      }

      const wallet = await this.findOrCreateWallet(userId, currency);
      await wallet.increment('balance', { by: amount });
      await wallet.reload();

      return successResponse('Money added successfully', {
        balance: parseFloat(wallet.balance.toString()),
        currency: wallet.currency,
      });
    } catch (error: any) {
      return errorResponse('Failed to add money', error.message);
    }
  }

  /**
   * Helper method to find or create wallet
   */
  private static async findOrCreateWallet(userId: number, currency: string, transaction?: Transaction): Promise<Wallet> {
    const [wallet] = await Wallet.findOrCreate({
      where: { userId, currency },
      defaults: {
        userId,
        balance: 0.00,
        currency,
        isActive: true,
      },
      transaction,
    });

    return wallet;
  }
} 