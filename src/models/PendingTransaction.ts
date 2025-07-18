import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';

export type PendingTransactionType = 'wallet_transfer' | 'community_market' | 'withdrawal' | 'payment';
export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';

export interface PendingTransactionAttributes {
  id: number;
  initiatorUserId: number;
  signerUserId: number;
  transactionType: PendingTransactionType;
  amount: number;
  currency: string;
  recipientAddress?: string;
  recipientUserId?: number;
  description?: string;
  transactionData: any; // JSON field for additional transaction details
  status: TransactionStatus;
  expiresAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  approvalMessage?: string;
  rejectionReason?: string;
  originalRequestId?: string; // Reference to original transaction/request
  createdAt?: Date;
  updatedAt?: Date;
}

interface PendingTransactionCreationAttributes extends Optional<
  PendingTransactionAttributes,
  'id' | 'status' | 'approvedAt' | 'rejectedAt' | 'approvalMessage' | 'rejectionReason' | 'createdAt' | 'updatedAt'
> {}

class PendingTransaction extends Model<PendingTransactionAttributes, PendingTransactionCreationAttributes> 
  implements PendingTransactionAttributes {
  
  public id!: number;
  public initiatorUserId!: number;
  public signerUserId!: number;
  public transactionType!: PendingTransactionType;
  public amount!: number;
  public currency!: string;
  public recipientAddress?: string;
  public recipientUserId?: number;
  public description?: string;
  public transactionData!: any;
  public status!: TransactionStatus;
  public expiresAt!: Date;
  public approvedAt?: Date;
  public rejectedAt?: Date;
  public approvalMessage?: string;
  public rejectionReason?: string;
  public originalRequestId?: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  public canBeApproved(): boolean {
    return this.status === 'pending' && !this.isExpired();
  }

  public async approve(message?: string): Promise<void> {
    if (!this.canBeApproved()) {
      throw new Error('Transaction cannot be approved in current state');
    }

    this.status = 'approved';
    this.approvedAt = new Date();
    this.approvalMessage = message;
    await this.save();
  }

  public async reject(reason: string): Promise<void> {
    if (!this.canBeApproved()) {
      throw new Error('Transaction cannot be rejected in current state');
    }

    this.status = 'rejected';
    this.rejectedAt = new Date();
    this.rejectionReason = reason;
    await this.save();
  }

  public async cancel(): Promise<void> {
    if (this.status !== 'pending') {
      throw new Error('Only pending transactions can be cancelled');
    }

    this.status = 'cancelled';
    await this.save();
  }

  public getTimeRemaining(): number {
    const now = new Date().getTime();
    const expiryTime = this.expiresAt.getTime();
    return Math.max(0, expiryTime - now);
  }

  public getTimeRemainingHours(): number {
    return Math.floor(this.getTimeRemaining() / (1000 * 60 * 60));
  }
}

PendingTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    initiatorUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'initiator_user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    signerUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'signer_user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    transactionType: {
      type: DataTypes.ENUM('wallet_transfer', 'community_market', 'withdrawal', 'payment'),
      allowNull: false,
      field: 'transaction_type',
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'USD',
    },
    recipientAddress: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'recipient_address',
    },
    recipientUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'recipient_user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    transactionData: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      field: 'transaction_data',
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at',
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'rejected_at',
    },
    approvalMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'approval_message',
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason',
    },
    originalRequestId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'original_request_id',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    modelName: 'PendingTransaction',
    tableName: 'pending_transactions',
    timestamps: true,
    indexes: [
      {
        fields: ['initiator_user_id'],
      },
      {
        fields: ['signer_user_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['expires_at'],
      },
      {
        fields: ['transaction_type'],
      },
      {
        name: 'pending_signer_status_idx',
        fields: ['signer_user_id', 'status'],
      },
      {
        name: 'pending_initiator_status_idx',
        fields: ['initiator_user_id', 'status'],
      },
    ],
    hooks: {
      beforeUpdate: (transaction: PendingTransaction) => {
        // Auto-expire transactions
        if (transaction.isExpired() && transaction.status === 'pending') {
          transaction.status = 'expired';
        }
      },
    },
  }
);

export default PendingTransaction;
