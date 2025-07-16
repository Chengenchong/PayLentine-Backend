import { Response } from 'express';
import { CustomRequest } from '../types/express';
import { UserKYCService } from '../services/UserKYCService';
import { KYCLevel, KYCStatus } from '../models/UserKYC';

export class UserKYCController {
  /**
   * Submit new KYC application
   */
  static async submitKYC(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const {
        kycLevel,
        firstName,
        lastName,
        dateOfBirth,
        nationality,
        address,
        city,
        postalCode,
        country,
        phoneNumber,
        documentsSubmitted,
        documentUrls,
        deviceFingerprint
      } = req.body;

      // Validation
      if (!firstName || !lastName || !dateOfBirth || !nationality || 
          !address || !city || !postalCode || !country || !phoneNumber) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      if (!['basic', 'intermediate', 'advanced'].includes(kycLevel)) {
        res.status(400).json({ error: 'Invalid KYC level' });
        return;
      }

      if (!Array.isArray(documentsSubmitted) || documentsSubmitted.length === 0) {
        res.status(400).json({ error: 'At least one document must be submitted' });
        return;
      }

      const kyc = await UserKYCService.submitKYC({
        userId: parseInt(userId),
        kycLevel,
        firstName,
        lastName,
        dateOfBirth,
        nationality,
        address,
        city,
        postalCode,
        country,
        phoneNumber,
        documentsSubmitted,
        documentUrls: documentUrls || [],
        ipAddress: req.ip,
        deviceFingerprint
      });

      res.status(201).json({
        message: 'KYC application submitted successfully',
        kyc: {
          id: kyc.id,
          status: kyc.status,
          kycLevel: kyc.kycLevel,
          submittedAt: kyc.submittedAt
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Update existing KYC application
   */
  static async updateKYC(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const {
        firstName,
        lastName,
        dateOfBirth,
        nationality,
        address,
        city,
        postalCode,
        country,
        phoneNumber,
        documentsSubmitted,
        documentUrls,
        deviceFingerprint
      } = req.body;

      const kyc = await UserKYCService.updateKYC(parseInt(userId), {
        firstName,
        lastName,
        dateOfBirth,
        nationality,
        address,
        city,
        postalCode,
        country,
        phoneNumber,
        documentsSubmitted,
        documentUrls,
        ipAddress: req.ip,
        deviceFingerprint
      });

      res.json({
        message: 'KYC application updated successfully',
        kyc: {
          id: kyc.id,
          status: kyc.status,
          kycLevel: kyc.kycLevel,
          submittedAt: kyc.submittedAt
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get current user's KYC status
   */
  static async getMyKYC(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const kycStatus = await UserKYCService.getUserKYCStatus(parseInt(userId));

      res.json({
        hasKYC: kycStatus.hasKYC,
        isApproved: kycStatus.isApproved,
        isExpired: kycStatus.isExpired,
        complianceLevel: kycStatus.complianceLevel,
        transactionLimits: kycStatus.transactionLimits,
        kyc: kycStatus.kyc ? {
          id: kycStatus.kyc.id,
          status: kycStatus.kyc.status,
          kycLevel: kycStatus.kyc.kycLevel,
          firstName: kycStatus.kyc.firstName,
          lastName: kycStatus.kyc.lastName,
          nationality: kycStatus.kyc.nationality,
          country: kycStatus.kyc.country,
          submittedAt: kycStatus.kyc.submittedAt,
          reviewedAt: kycStatus.kyc.reviewedAt,
          approvedAt: kycStatus.kyc.approvedAt,
          expiresAt: kycStatus.kyc.expiresAt,
          verificationNotes: kycStatus.kyc.verificationNotes,
          rejectionReason: kycStatus.kyc.rejectionReason,
          riskScore: kycStatus.kyc.riskScore
        } : null
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all KYCs with filtering and pagination (Admin only)
   */
  static async getKYCs(req: CustomRequest, res: Response): Promise<void> {
    try {
      const {
        status,
        kycLevel,
        country,
        riskScoreMin,
        riskScoreMax,
        submittedAfter,
        submittedBefore,
        expiringBefore,
        includeExpired,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      // Build filters
      const filters: any = {};
      if (status) {
        filters.status = typeof status === 'string' ? status.split(',') as KYCStatus[] : status;
      }
      if (kycLevel) {
        filters.kycLevel = typeof kycLevel === 'string' ? kycLevel.split(',') as KYCLevel[] : kycLevel;
      }
      if (country) filters.country = country as string;
      if (riskScoreMin) filters.riskScoreMin = parseInt(riskScoreMin as string);
      if (riskScoreMax) filters.riskScoreMax = parseInt(riskScoreMax as string);
      if (submittedAfter) filters.submittedAfter = new Date(submittedAfter as string);
      if (submittedBefore) filters.submittedBefore = new Date(submittedBefore as string);
      if (expiringBefore) filters.expiringBefore = new Date(expiringBefore as string);
      if (includeExpired !== undefined) filters.includeExpired = includeExpired === 'true';

      const result = await UserKYCService.getKYCs(filters, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as any,
        sortOrder: sortOrder as 'ASC' | 'DESC'
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get KYC by ID (Admin only)
   */
  static async getKYCById(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const kycId = parseInt(id);

      if (isNaN(kycId)) {
        res.status(400).json({ error: 'Invalid KYC ID' });
        return;
      }

      const kyc = await UserKYCService.getKYCById(kycId);

      if (!kyc) {
        res.status(404).json({ error: 'KYC not found' });
        return;
      }

      res.json(kyc);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Review KYC application (Admin only)
   */
  static async reviewKYC(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, verificationNotes, rejectionReason, riskScore } = req.body;
      const kycId = parseInt(id);

      if (isNaN(kycId)) {
        res.status(400).json({ error: 'Invalid KYC ID' });
        return;
      }

      if (!['approved', 'rejected', 'requires_update'].includes(status)) {
        res.status(400).json({ error: 'Invalid status. Must be approved, rejected, or requires_update' });
        return;
      }

      if ((status === 'rejected' || status === 'requires_update') && !rejectionReason) {
        res.status(400).json({ error: 'Rejection reason is required for rejected or requires_update status' });
        return;
      }

      if (riskScore !== undefined && (riskScore < 0 || riskScore > 100)) {
        res.status(400).json({ error: 'Risk score must be between 0 and 100' });
        return;
      }

      const kyc = await UserKYCService.reviewKYC(kycId, {
        status,
        verificationNotes,
        rejectionReason,
        riskScore
      });

      res.json({
        message: `KYC ${status} successfully`,
        kyc: {
          id: kyc.id,
          status: kyc.status,
          reviewedAt: kyc.reviewedAt,
          approvedAt: kyc.approvedAt,
          expiresAt: kyc.expiresAt,
          verificationNotes: kyc.verificationNotes,
          rejectionReason: kyc.rejectionReason,
          riskScore: kyc.riskScore
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get KYC statistics (Admin only)
   */
  static async getKYCStats(req: CustomRequest, res: Response): Promise<void> {
    try {
      const stats = await UserKYCService.getKYCStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get KYCs that are expiring soon (Admin only)
   */
  static async getExpiringKYCs(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { days = 30 } = req.query;
      const daysUntilExpiry = parseInt(days as string);

      if (isNaN(daysUntilExpiry) || daysUntilExpiry < 1) {
        res.status(400).json({ error: 'Days must be a positive number' });
        return;
      }

      const expiringKYCs = await UserKYCService.getExpiringKYCs(daysUntilExpiry);

      res.json({
        expiringKYCs,
        count: expiringKYCs.length,
        daysUntilExpiry
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Bulk approve KYCs (Admin only)
   */
  static async bulkApproveKYCs(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { kycIds, verificationNotes } = req.body;

      if (!Array.isArray(kycIds) || kycIds.length === 0) {
        res.status(400).json({ error: 'KYC IDs array is required' });
        return;
      }

      if (kycIds.some((id: any) => !Number.isInteger(id))) {
        res.status(400).json({ error: 'All KYC IDs must be integers' });
        return;
      }

      const result = await UserKYCService.bulkApproveKYCs(kycIds, verificationNotes);

      res.json({
        message: `Bulk approval completed`,
        successful: result.successful,
        failed: result.failed,
        totalProcessed: kycIds.length,
        successCount: result.successful.length,
        failedCount: result.failed.length
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Check transaction limits for current user
   */
  static async checkTransactionLimits(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { amount, transactionType = 'single' } = req.query;

      if (!amount) {
        res.status(400).json({ error: 'Amount is required' });
        return;
      }

      const transactionAmount = parseFloat(amount as string);
      if (isNaN(transactionAmount) || transactionAmount <= 0) {
        res.status(400).json({ error: 'Amount must be a positive number' });
        return;
      }

      if (!['daily', 'monthly', 'single'].includes(transactionType as string)) {
        res.status(400).json({ error: 'Invalid transaction type. Must be daily, monthly, or single' });
        return;
      }

      const result = await UserKYCService.canPerformTransaction(
        parseInt(userId),
        transactionAmount,
        transactionType as 'daily' | 'monthly' | 'single'
      );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get user KYC status by user ID (Admin only)
   */
  static async getUserKYCStatus(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const userIdNum = parseInt(userId);

      if (isNaN(userIdNum)) {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }

      const kycStatus = await UserKYCService.getUserKYCStatus(userIdNum);

      res.json(kycStatus);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default UserKYCController;
