import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';

export type KYCStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'requires_update';
export type DocumentType = 'passport' | 'national_id' | 'drivers_license' | 'utility_bill' | 'bank_statement';
export type KYCLevel = 'basic' | 'intermediate' | 'advanced';

interface UserKYCAttributes {
  id: number;
  userId: number;
  kycLevel: KYCLevel;
  status: KYCStatus;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  nationality: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  documentsSubmitted: DocumentType[];
  documentUrls: string[];
  verificationNotes?: string;
  rejectionReason?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  expiresAt?: Date;
  riskScore?: number;
  ipAddress?: string;
  deviceFingerprint?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserKYCCreationAttributes extends Optional<
  UserKYCAttributes,
  'id' | 'status' | 'verificationNotes' | 'rejectionReason' | 'reviewedAt' | 
  'approvedAt' | 'expiresAt' | 'riskScore' | 'ipAddress' | 'deviceFingerprint' | 
  'createdAt' | 'updatedAt'
> {}

class UserKYC extends Model<UserKYCAttributes, UserKYCCreationAttributes> 
  implements UserKYCAttributes {
  
  public id!: number;
  public userId!: number;
  public kycLevel!: KYCLevel;
  public status!: KYCStatus;
  public firstName!: string;
  public lastName!: string;
  public dateOfBirth!: Date;
  public nationality!: string;
  public address!: string;
  public city!: string;
  public postalCode!: string;
  public country!: string;
  public phoneNumber!: string;
  public documentsSubmitted!: DocumentType[];
  public documentUrls!: string[];
  public verificationNotes?: string;
  public rejectionReason?: string;
  public submittedAt!: Date;
  public reviewedAt?: Date;
  public approvedAt?: Date;
  public expiresAt?: Date;
  public riskScore?: number;
  public ipAddress?: string;
  public deviceFingerprint?: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public isApproved(): boolean {
    return this.status === 'approved' && 
           (!this.expiresAt || this.expiresAt > new Date());
  }

  public isExpired(): boolean {
    return this.expiresAt ? this.expiresAt <= new Date() : false;
  }

  public async approve(notes?: string): Promise<void> {
    this.status = 'approved';
    this.approvedAt = new Date();
    this.reviewedAt = new Date();
    if (notes) this.verificationNotes = notes;
    
    // Set expiration based on KYC level (basic: 1 year, intermediate: 2 years, advanced: 3 years)
    const expirationMonths = this.kycLevel === 'basic' ? 12 : this.kycLevel === 'intermediate' ? 24 : 36;
    const expiration = new Date();
    expiration.setMonth(expiration.getMonth() + expirationMonths);
    this.expiresAt = expiration;
    
    await this.save();
  }

  public async reject(reason: string): Promise<void> {
    this.status = 'rejected';
    this.rejectionReason = reason;
    this.reviewedAt = new Date();
    await this.save();
  }

  public async requestUpdate(reason: string): Promise<void> {
    this.status = 'requires_update';
    this.rejectionReason = reason;
    this.reviewedAt = new Date();
    await this.save();
  }

  public getComplianceLevel(): number {
    if (!this.isApproved()) return 0;
    
    let score = 0;
    
    // Base score for approval
    score += 40;
    
    // Level bonus
    if (this.kycLevel === 'basic') score += 20;
    else if (this.kycLevel === 'intermediate') score += 35;
    else if (this.kycLevel === 'advanced') score += 50;
    
    // Document completeness
    score += Math.min(this.documentsSubmitted.length * 5, 20);
    
    // Risk score (lower is better)
    if (this.riskScore) {
      score -= Math.max(0, (this.riskScore - 50) / 10); // Penalty for high risk
    }
    
    // Age penalty for old KYC
    if (this.approvedAt) {
      const monthsOld = Math.floor((Date.now() - this.approvedAt.getTime()) / (1000 * 60 * 60 * 24 * 30));
      score -= monthsOld; // 1 point per month
    }
    
    return Math.max(0, Math.min(100, score));
  }

  // Get transaction limits based on KYC level and compliance
  public getTransactionLimits(): {
    dailyLimit: number;
    monthlyLimit: number;
    singleTransactionLimit: number;
  } {
    if (!this.isApproved()) {
      return { dailyLimit: 0, monthlyLimit: 0, singleTransactionLimit: 0 };
    }

    const complianceLevel = this.getComplianceLevel();
    const multiplier = complianceLevel / 100;

    const baseLimits = {
      basic: { daily: 1000, monthly: 10000, single: 500 },
      intermediate: { daily: 5000, monthly: 50000, single: 2500 },
      advanced: { daily: 25000, monthly: 250000, single: 10000 }
    };

    const limits = baseLimits[this.kycLevel];
    
    return {
      dailyLimit: Math.floor(limits.daily * multiplier),
      monthlyLimit: Math.floor(limits.monthly * multiplier),
      singleTransactionLimit: Math.floor(limits.single * multiplier)
    };
  }
}

UserKYC.init(
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
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    kycLevel: {
      type: DataTypes.ENUM('basic', 'intermediate', 'advanced'),
      allowNull: false,
      defaultValue: 'basic',
      field: 'kyc_level',
    },
    status: {
      type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected', 'requires_update'),
      allowNull: false,
      defaultValue: 'pending',
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name',
      validate: {
        len: [2, 100],
      },
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name',
      validate: {
        len: [2, 100],
      },
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'date_of_birth',
      validate: {
        isDate: true,
        isBefore: new Date().toISOString(), // Must be in the past
      },
    },
    nationality: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'postal_code',
    },
    country: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'phone_number',
      validate: {
        is: /^\+?[\d\s\-\(\)]+$/,
      },
    },
    documentsSubmitted: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: 'documents_submitted',
      validate: {
        isArrayOfValidDocuments(value: any) {
          if (!Array.isArray(value)) {
            throw new Error('Documents must be an array');
          }
          const validTypes = ['passport', 'national_id', 'drivers_license', 'utility_bill', 'bank_statement'];
          for (const doc of value) {
            if (!validTypes.includes(doc)) {
              throw new Error(`Invalid document type: ${doc}`);
            }
          }
        },
      },
    },
    documentUrls: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: 'document_urls',
    },
    verificationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'verification_notes',
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason',
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'submitted_at',
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reviewed_at',
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at',
    },
    riskScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'risk_score',
      validate: {
        min: 0,
        max: 100,
      },
    },
    ipAddress: {
      type: DataTypes.STRING(45), // IPv6 support
      allowNull: true,
      field: 'ip_address',
    },
    deviceFingerprint: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'device_fingerprint',
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
    modelName: 'UserKYC',
    tableName: 'user_kyc',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id'],
        unique: true,
      },
      {
        fields: ['status'],
      },
      {
        fields: ['kyc_level'],
      },
      {
        fields: ['submitted_at'],
      },
      {
        fields: ['expires_at'],
      },
      {
        name: 'kyc_status_level_idx',
        fields: ['status', 'kyc_level'],
      },
    ],
    hooks: {
      beforeUpdate: (kyc: UserKYC) => {
        // Auto-update status if KYC has expired
        if (kyc.isExpired() && kyc.status === 'approved') {
          kyc.status = 'requires_update';
          kyc.rejectionReason = 'KYC verification has expired and requires renewal';
        }
      },
    },
  }
);

export default UserKYC;
