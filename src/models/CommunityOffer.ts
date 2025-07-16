import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';

export type OfferType = 'buy' | 'sell';
export type OfferStatus = 'active' | 'completed' | 'cancelled' | 'expired';
export type UserTag = 'verified' | 'p2p' | 'premium' | 'new';

interface CommunityOfferAttributes {
  id: number;
  userId: number;
  offerType: OfferType;
  amount: number;
  currency: string;
  rate: number;
  status: OfferStatus;
  tags: UserTag[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface CommunityOfferCreationAttributes
  extends Optional<
    CommunityOfferAttributes,
    'id' | 'status' | 'tags' | 'createdAt' | 'updatedAt'
  > {}

class CommunityOffer
  extends Model<CommunityOfferAttributes, CommunityOfferCreationAttributes>
  implements CommunityOfferAttributes
{
  public id!: number;
  public userId!: number;
  public offerType!: OfferType;
  public amount!: number;
  public currency!: string;
  public rate!: number;
  public status!: OfferStatus;
  public tags!: UserTag[];

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association
  public user?: any; // Will be populated by include

  // Instance methods
  public isActive(): boolean {
    return this.status === 'active';
  }

  public async completeOffer(): Promise<void> {
    this.status = 'completed';
    await this.save();
  }

  public async cancelOffer(): Promise<void> {
    this.status = 'cancelled';
    await this.save();
  }

  // Get formatted display information matching your UI
  public getDisplayInfo() {
    return {
      id: this.id,
      user: this.userId,
      type: this.offerType,
      amount: `${this.amount} ${this.currency}`,
      rate: this.rate,
      status: this.status,
      tags: this.tags,
      isActive: this.isActive(),
      createdAt: this.createdAt,
    };
  }
}

CommunityOffer.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    offerType: {
      type: DataTypes.ENUM('buy', 'sell'),
      allowNull: false,
      field: 'offer_type',
      validate: {
        isIn: [['buy', 'sell']],
      },
    },
    amount: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
      validate: {
        min: 0.0001,
        isDecimal: true,
      },
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isUppercase: true,
        len: [3, 10],
      },
    },
    rate: {
      type: DataTypes.DECIMAL(15, 8),
      allowNull: false,
      validate: {
        min: 0.00000001,
        isDecimal: true,
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'cancelled', 'expired'),
      allowNull: false,
      defaultValue: 'active',
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      validate: {
        isArrayOfValidTags(value: any) {
          if (!Array.isArray(value)) {
            throw new Error('Tags must be an array');
          }
          const validTags = ['verified', 'p2p', 'premium', 'new'];
          for (const tag of value) {
            if (!validTags.includes(tag)) {
              throw new Error(`Invalid tag: ${tag}`);
            }
          }
        },
      },
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
    modelName: 'CommunityOffer',
    tableName: 'community_offers',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['currency'],
      },
      {
        fields: ['offer_type'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['rate'],
      },
      {
        fields: ['created_at'],
      },
      {
        name: 'currency_type_idx',
        fields: ['currency', 'offer_type'],
      },
    ],
  }
);

export default CommunityOffer;
