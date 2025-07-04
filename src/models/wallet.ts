import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';

interface WalletAttributes {
  id: number;
  userId: number;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WalletCreationAttributes extends Optional<WalletAttributes, 'id' | 'createdAt' | 'updatedAt' | 'balance' | 'currency' | 'isActive'> {}

class Wallet extends Model<WalletAttributes, WalletCreationAttributes> implements WalletAttributes {
  public id!: number;
  public userId!: number;
  public balance!: number;
  public currency!: string;
  public isActive!: boolean;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public async addBalance(amount: number): Promise<void> {
    await this.increment('balance', { by: amount });
  }

  public async subtractBalance(amount: number): Promise<void> {
    await this.decrement('balance', { by: amount });
  }

  public hasInsufficientBalance(amount: number): boolean {
    return this.balance < amount;
  }
}

Wallet.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
      validate: {
        len: [3, 3],
        isUppercase: true,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'wallets',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'currency'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['currency'],
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);

export default Wallet;
