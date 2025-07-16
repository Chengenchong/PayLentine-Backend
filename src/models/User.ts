import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';

interface UserAttributes {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  isActive: boolean;
  seedPhraseHash: string;
  profilePicture?: string;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt' | 'profilePicture' | 'isActive' | 'role' | 'seedPhraseHash'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: 'admin' | 'user';
  public isActive!: boolean;
  public seedPhraseHash!: string;
  public profilePicture?: string;
  public lastLoginAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual fields
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Instance methods
  public toJSON(): Partial<UserAttributes> {
    const values = { ...this.get() } as any;
    delete values.password; // Never return password in JSON
    delete values.seedPhraseHash; // Never return seed phrase hash in JSON
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        len: [5, 255],
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255],
      },
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
      },
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
      },
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    seedPhraseHash: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        len: [1, 500],
      },
    },
    profilePicture: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['role'],
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);

export default User; 