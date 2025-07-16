import { Op } from 'sequelize';
import { UserKYC, User } from '../models';
import { KYCLevel, KYCStatus, DocumentType } from '../models/UserKYC';

export interface KYCSubmissionData {
  userId: number;
  kycLevel: KYCLevel;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  documentsSubmitted: DocumentType[];
  documentUrls: string[];
  ipAddress?: string;
  deviceFingerprint?: string;
}

export interface KYCUpdateData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phoneNumber?: string;
  documentsSubmitted?: DocumentType[];
  documentUrls?: string[];
  ipAddress?: string;
  deviceFingerprint?: string;
}

export interface KYCFilterOptions {
  status?: KYCStatus | KYCStatus[];
  kycLevel?: KYCLevel | KYCLevel[];
  country?: string;
  riskScoreMin?: number;
  riskScoreMax?: number;
  submittedAfter?: Date;
  submittedBefore?: Date;
  expiringBefore?: Date;
  includeExpired?: boolean;
}

export interface KYCPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'submittedAt' | 'reviewedAt' | 'approvedAt' | 'riskScore';
  sortOrder?: 'ASC' | 'DESC';
}

export interface KYCReviewData {
  status: 'approved' | 'rejected' | 'requires_update';
  verificationNotes?: string;
  rejectionReason?: string;
  riskScore?: number;
}

export interface KYCStats {
  totalKYCs: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  requiresUpdate: number;
  expiringIn30Days: number;
  averageProcessingTimeHours: number;
  approvalRate: number;
}

export class UserKYCService {
  /**
   * Submit new KYC application
   */
  static async submitKYC(data: KYCSubmissionData): Promise<UserKYC> {
    try {
      // Check if user already has KYC
      const existingKYC = await UserKYC.findOne({
        where: { userId: data.userId }
      });

      if (existingKYC) {
        throw new Error('User already has a KYC application. Use updateKYC to modify existing application.');
      }

      // Validate user exists
      const user = await User.findByPk(data.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create KYC record
      const kyc = await UserKYC.create({
        ...data,
        dateOfBirth: new Date(data.dateOfBirth),
        status: 'pending',
        submittedAt: new Date()
      });

      return kyc;
    } catch (error: any) {
      throw new Error(`Failed to submit KYC: ${error.message}`);
    }
  }

  /**
   * Update existing KYC application (only allowed for pending or requires_update status)
   */
  static async updateKYC(userId: number, data: KYCUpdateData): Promise<UserKYC> {
    try {
      const kyc = await UserKYC.findOne({ where: { userId } });
      
      if (!kyc) {
        throw new Error('KYC application not found');
      }

      if (!['pending', 'requires_update'].includes(kyc.status)) {
        throw new Error('KYC can only be updated when status is pending or requires_update');
      }

      // Update fields
      const updateData: any = { ...data };
      if (data.dateOfBirth) {
        updateData.dateOfBirth = new Date(data.dateOfBirth);
      }

      // Reset status to pending if it was requires_update
      if (kyc.status === 'requires_update') {
        updateData.status = 'pending';
        updateData.rejectionReason = null;
        updateData.submittedAt = new Date();
      }

      await kyc.update(updateData);
      return kyc;
    } catch (error: any) {
      throw new Error(`Failed to update KYC: ${error.message}`);
    }
  }

  /**
   * Review KYC application (admin function)
   */
  static async reviewKYC(kycId: number, reviewData: KYCReviewData): Promise<UserKYC> {
    try {
      const kyc = await UserKYC.findByPk(kycId);
      
      if (!kyc) {
        throw new Error('KYC application not found');
      }

      if (kyc.status === 'approved') {
        throw new Error('KYC is already approved');
      }

      if (reviewData.status === 'approved') {
        await kyc.approve(reviewData.verificationNotes);
      } else if (reviewData.status === 'rejected') {
        if (!reviewData.rejectionReason) {
          throw new Error('Rejection reason is required for rejected KYC');
        }
        await kyc.reject(reviewData.rejectionReason);
      } else if (reviewData.status === 'requires_update') {
        if (!reviewData.rejectionReason) {
          throw new Error('Reason is required when requesting KYC update');
        }
        await kyc.requestUpdate(reviewData.rejectionReason);
      }

      // Update risk score if provided
      if (reviewData.riskScore !== undefined) {
        kyc.riskScore = reviewData.riskScore;
        await kyc.save();
      }

      return kyc;
    } catch (error: any) {
      throw new Error(`Failed to review KYC: ${error.message}`);
    }
  }

  /**
   * Get KYC by user ID
   */
  static async getKYCByUserId(userId: number): Promise<UserKYC | null> {
    try {
      return await UserKYC.findOne({
        where: { userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'username']
          }
        ]
      });
    } catch (error: any) {
      throw new Error(`Failed to get KYC: ${error.message}`);
    }
  }

  /**
   * Get KYC by ID
   */
  static async getKYCById(kycId: number): Promise<UserKYC | null> {
    try {
      return await UserKYC.findByPk(kycId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'username']
          }
        ]
      });
    } catch (error: any) {
      throw new Error(`Failed to get KYC: ${error.message}`);
    }
  }

  /**
   * Get all KYCs with filtering and pagination
   */
  static async getKYCs(
    filters: KYCFilterOptions = {},
    pagination: KYCPaginationOptions = {}
  ): Promise<{
    kycs: UserKYC[];
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
      const where: any = {};

      if (filters.status) {
        if (Array.isArray(filters.status)) {
          where.status = { [Op.in]: filters.status };
        } else {
          where.status = filters.status;
        }
      }

      if (filters.kycLevel) {
        if (Array.isArray(filters.kycLevel)) {
          where.kycLevel = { [Op.in]: filters.kycLevel };
        } else {
          where.kycLevel = filters.kycLevel;
        }
      }

      if (filters.country) {
        where.country = filters.country;
      }

      if (filters.riskScoreMin !== undefined || filters.riskScoreMax !== undefined) {
        where.riskScore = {};
        if (filters.riskScoreMin !== undefined) {
          where.riskScore[Op.gte] = filters.riskScoreMin;
        }
        if (filters.riskScoreMax !== undefined) {
          where.riskScore[Op.lte] = filters.riskScoreMax;
        }
      }

      if (filters.submittedAfter) {
        where.submittedAt = { ...where.submittedAt, [Op.gte]: filters.submittedAfter };
      }

      if (filters.submittedBefore) {
        where.submittedAt = { ...where.submittedAt, [Op.lte]: filters.submittedBefore };
      }

      if (filters.expiringBefore) {
        where.expiresAt = { [Op.lte]: filters.expiringBefore };
      }

      if (filters.includeExpired === false) {
        where[Op.or] = [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ];
      }

      const { rows: kycs, count: total } = await UserKYC.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'username']
          }
        ],
        limit,
        offset,
        order: [[sortBy, sortOrder]]
      });

      return {
        kycs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`Failed to get KYCs: ${error.message}`);
    }
  }

  /**
   * Get KYC statistics
   */
  static async getKYCStats(): Promise<KYCStats> {
    try {
      const totalKYCs = await UserKYC.count();

      const statusCounts = await UserKYC.findAll({
        attributes: [
          'status',
          [UserKYC.sequelize!.fn('COUNT', UserKYC.sequelize!.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      const statusMap = statusCounts.reduce((acc: any, item: any) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {});

      // KYCs expiring in 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiringIn30Days = await UserKYC.count({
        where: {
          status: 'approved',
          expiresAt: {
            [Op.lte]: thirtyDaysFromNow,
            [Op.gt]: new Date()
          }
        }
      });

      // Calculate average processing time for approved/rejected KYCs
      const processedKYCs = await UserKYC.findAll({
        where: {
          status: { [Op.in]: ['approved', 'rejected'] },
          reviewedAt: { [Op.not]: null }
        } as any,
        attributes: ['submittedAt', 'reviewedAt'],
        raw: true
      });

      let averageProcessingTimeHours = 0;
      if (processedKYCs.length > 0) {
        const totalProcessingTime = processedKYCs.reduce((sum: number, kyc: any) => {
          const processingTime = new Date(kyc.reviewedAt).getTime() - new Date(kyc.submittedAt).getTime();
          return sum + processingTime;
        }, 0);
        averageProcessingTimeHours = totalProcessingTime / processedKYCs.length / (1000 * 60 * 60);
      }

      // Calculate approval rate
      const totalProcessed = (statusMap.approved || 0) + (statusMap.rejected || 0);
      const approvalRate = totalProcessed > 0 ? (statusMap.approved || 0) / totalProcessed * 100 : 0;

      return {
        totalKYCs,
        pending: statusMap.pending || 0,
        underReview: statusMap.under_review || 0,
        approved: statusMap.approved || 0,
        rejected: statusMap.rejected || 0,
        requiresUpdate: statusMap.requires_update || 0,
        expiringIn30Days,
        averageProcessingTimeHours: Math.round(averageProcessingTimeHours * 100) / 100,
        approvalRate: Math.round(approvalRate * 100) / 100
      };
    } catch (error: any) {
      throw new Error(`Failed to get KYC statistics: ${error.message}`);
    }
  }

  /**
   * Get user's current KYC status and transaction limits
   */
  static async getUserKYCStatus(userId: number): Promise<{
    hasKYC: boolean;
    kyc?: UserKYC;
    isApproved: boolean;
    isExpired: boolean;
    complianceLevel: number;
    transactionLimits: {
      dailyLimit: number;
      monthlyLimit: number;
      singleTransactionLimit: number;
    };
  }> {
    try {
      const kyc = await UserKYC.findOne({ where: { userId } });

      if (!kyc) {
        return {
          hasKYC: false,
          isApproved: false,
          isExpired: false,
          complianceLevel: 0,
          transactionLimits: {
            dailyLimit: 0,
            monthlyLimit: 0,
            singleTransactionLimit: 0
          }
        };
      }

      return {
        hasKYC: true,
        kyc,
        isApproved: kyc.isApproved(),
        isExpired: kyc.isExpired(),
        complianceLevel: kyc.getComplianceLevel(),
        transactionLimits: kyc.getTransactionLimits()
      };
    } catch (error: any) {
      throw new Error(`Failed to get user KYC status: ${error.message}`);
    }
  }

  /**
   * Bulk approve KYCs (admin function)
   */
  static async bulkApproveKYCs(kycIds: number[], notes?: string): Promise<{
    successful: number[];
    failed: { id: number; error: string }[];
  }> {
    const successful: number[] = [];
    const failed: { id: number; error: string }[] = [];

    for (const kycId of kycIds) {
      try {
        await this.reviewKYC(kycId, {
          status: 'approved',
          verificationNotes: notes
        });
        successful.push(kycId);
      } catch (error: any) {
        failed.push({
          id: kycId,
          error: error.message
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Get KYCs that are expiring soon
   */
  static async getExpiringKYCs(daysUntilExpiry: number = 30): Promise<UserKYC[]> {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

      return await UserKYC.findAll({
        where: {
          status: 'approved',
          expiresAt: {
            [Op.lte]: expiryDate,
            [Op.gt]: new Date()
          }
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'username']
          }
        ],
        order: [['expiresAt', 'ASC']]
      });
    } catch (error: any) {
      throw new Error(`Failed to get expiring KYCs: ${error.message}`);
    }
  }

  /**
   * Check if user can perform transaction based on KYC limits
   */
  static async canPerformTransaction(
    userId: number,
    amount: number,
    transactionType: 'daily' | 'monthly' | 'single' = 'single'
  ): Promise<{
    allowed: boolean;
    reason?: string;
    currentLimit: number;
    usedAmount: number;
    availableAmount: number;
  }> {
    try {
      const kycStatus = await this.getUserKYCStatus(userId);

      if (!kycStatus.isApproved) {
        return {
          allowed: false,
          reason: 'KYC not approved',
          currentLimit: 0,
          usedAmount: 0,
          availableAmount: 0
        };
      }

      const limits = kycStatus.transactionLimits;
      let currentLimit: number;

      switch (transactionType) {
        case 'daily':
          currentLimit = limits.dailyLimit;
          break;
        case 'monthly':
          currentLimit = limits.monthlyLimit;
          break;
        default:
          currentLimit = limits.singleTransactionLimit;
      }

      // For this example, we're not tracking actual usage
      // In a real application, you'd query transaction history
      const usedAmount = 0;
      const availableAmount = currentLimit - usedAmount;

      return {
        allowed: amount <= availableAmount,
        reason: amount > availableAmount ? `Amount exceeds ${transactionType} limit` : undefined,
        currentLimit,
        usedAmount,
        availableAmount
      };
    } catch (error: any) {
      throw new Error(`Failed to check transaction limits: ${error.message}`);
    }
  }
}

export default UserKYCService;
