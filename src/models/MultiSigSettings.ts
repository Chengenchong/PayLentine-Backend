import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';

export interface MultiSigSettingsAttributes {
  id: number;
  userId: number;
  isEnabled: boolean;
  thresholdAmount: number;
  signerUserId?: number;
  requiresSeedPhrase: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MultiSigSettingsCreationAttributes
  extends Optional<
    MultiSigSettingsAttributes,
    'id' | 'isEnabled' | 'requiresSeedPhrase' | 'createdAt' | 'updatedAt'
  > {}

class MultiSigSettings
  extends Model<MultiSigSettingsAttributes, MultiSigSettingsCreationAttributes>
  implements MultiSigSettingsAttributes
{
  public id!: number;
  public userId!: number;
  public isEnabled!: boolean;
  public thresholdAmount!: number;
  public signerUserId?: number;
  public requiresSeedPhrase!: boolean;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public shouldTriggerMultiSig(amount: number): boolean {
    return (
      this.isEnabled &&
      amount >= this.thresholdAmount &&
      this.signerUserId !== null
    );
  }

  public hasValidSigner(): boolean {
    return this.signerUserId !== null && this.signerUserId !== undefined;
  }
}

MultiSigSettings.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    isEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_enabled',
    },
    thresholdAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 1000.0,
      field: 'threshold_amount',
      validate: {
        min: 0.01,
        max: 999999999.99,
      },
    },
    signerUserId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'signer_user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    requiresSeedPhrase: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'requires_seed_phrase',
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
    modelName: 'MultiSigSettings',
    tableName: 'multi_sig_settings',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id'],
        unique: true,
      },
      {
        fields: ['signer_user_id'],
      },
      {
        fields: ['is_enabled'],
      },
    ],
  }
);

export default MultiSigSettings;
