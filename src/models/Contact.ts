import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';

// Define the attributes interface
export interface ContactAttributes {
  id: number;
  ownerId: number;
  contactUserId: number;
  nickname: string;
  publicKey?: string;
  isVerified: boolean;
  isTrusted: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define creation attributes (optional fields during creation)
export interface ContactCreationAttributes extends Optional<ContactAttributes, 'id' | 'publicKey' | 'notes' | 'createdAt' | 'updatedAt'> {}

// Define the Contact model class
class Contact extends Model<ContactAttributes, ContactCreationAttributes> implements ContactAttributes {
  public id!: number;
  public ownerId!: number;
  public contactUserId!: number;
  public nickname!: string;
  public publicKey?: string;
  public isVerified!: boolean;
  public isTrusted!: boolean;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Define associations
  public static associate() {
    // Will be defined in models/index.ts
  }
}

// Initialize the Contact model
Contact.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    ownerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    contactUserId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    nickname: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Nickname cannot be empty',
        },
        len: {
          args: [1, 100],
          msg: 'Nickname must be between 1 and 100 characters',
        },
      },
    },
    publicKey: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'Public key must not exceed 500 characters',
        },
      },
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isTrusted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Contact',
    tableName: 'Contacts',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['owner_id', 'contact_user_id'],
        name: 'unique_owner_contact',
      },
      {
        fields: ['owner_id'],
        name: 'idx_contact_owner',
      },
      {
        fields: ['contact_user_id'],
        name: 'idx_contact_user',
      },
      {
        fields: ['is_verified'],
        name: 'idx_contact_verified',
      },
      {
        fields: ['is_trusted'],
        name: 'idx_contact_trusted',
      },
    ],
  }
);

export default Contact;
