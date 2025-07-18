import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';

// Define the attributes interface
export interface ContactAttributes {
  id: number;
  ownerId: number;
  contactUserId: number;
  nickname: string;
  isVerified: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define creation attributes (optional fields during creation)
export interface ContactCreationAttributes extends Optional<ContactAttributes, 'id' | 'notes' | 'createdAt' | 'updatedAt'> {}

// Define the Contact model class
class Contact extends Model<ContactAttributes, ContactCreationAttributes> implements ContactAttributes {
  public id!: number;
  public ownerId!: number;
  public contactUserId!: number;
  public nickname!: string;
  public isVerified!: boolean;
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
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    contactUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
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
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    ],
  }
);

export default Contact;
