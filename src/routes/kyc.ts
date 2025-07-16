import { Router } from 'express';
import { UserKYCController } from '../controller/UserKYCController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     KYCSubmission:
 *       type: object
 *       required:
 *         - kycLevel
 *         - firstName
 *         - lastName
 *         - dateOfBirth
 *         - nationality
 *         - address
 *         - city
 *         - postalCode
 *         - country
 *         - phoneNumber
 *         - documentsSubmitted
 *       properties:
 *         kycLevel:
 *           type: string
 *           enum: [basic, intermediate, advanced]
 *           description: Level of KYC verification required
 *         firstName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: User's first name
 *         lastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: User's last name
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: User's date of birth (YYYY-MM-DD)
 *         nationality:
 *           type: string
 *           description: User's nationality
 *         address:
 *           type: string
 *           maxLength: 500
 *           description: User's full address
 *         city:
 *           type: string
 *           maxLength: 100
 *           description: User's city
 *         postalCode:
 *           type: string
 *           maxLength: 20
 *           description: User's postal/zip code
 *         country:
 *           type: string
 *           maxLength: 50
 *           description: User's country of residence
 *         phoneNumber:
 *           type: string
 *           pattern: '^\\+?[\\d\\s\\-\\(\\)]+$'
 *           description: User's phone number with country code
 *         documentsSubmitted:
 *           type: array
 *           items:
 *             type: string
 *             enum: [passport, national_id, drivers_license, utility_bill, bank_statement]
 *           description: Types of documents submitted for verification
 *         documentUrls:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs to uploaded document files
 *         deviceFingerprint:
 *           type: string
 *           description: Device fingerprint for security tracking
 *     
 *     KYCUpdate:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         lastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         nationality:
 *           type: string
 *         address:
 *           type: string
 *           maxLength: 500
 *         city:
 *           type: string
 *           maxLength: 100
 *         postalCode:
 *           type: string
 *           maxLength: 20
 *         country:
 *           type: string
 *           maxLength: 50
 *         phoneNumber:
 *           type: string
 *           pattern: '^\\+?[\\d\\s\\-\\(\\)]+$'
 *         documentsSubmitted:
 *           type: array
 *           items:
 *             type: string
 *             enum: [passport, national_id, drivers_license, utility_bill, bank_statement]
 *         documentUrls:
 *           type: array
 *           items:
 *             type: string
 *         deviceFingerprint:
 *           type: string
 *     
 *     KYCReview:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [approved, rejected, requires_update]
 *           description: New KYC status after review
 *         verificationNotes:
 *           type: string
 *           description: Internal notes from reviewer
 *         rejectionReason:
 *           type: string
 *           description: Reason for rejection (required for rejected/requires_update)
 *         riskScore:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: Risk assessment score (0-100)
 *     
 *     KYCResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: KYC record ID
 *         userId:
 *           type: integer
 *           description: Associated user ID
 *         status:
 *           type: string
 *           enum: [pending, under_review, approved, rejected, requires_update]
 *         kycLevel:
 *           type: string
 *           enum: [basic, intermediate, advanced]
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         nationality:
 *           type: string
 *         country:
 *           type: string
 *         submittedAt:
 *           type: string
 *           format: date-time
 *         reviewedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         approvedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         verificationNotes:
 *           type: string
 *           nullable: true
 *         rejectionReason:
 *           type: string
 *           nullable: true
 *         riskScore:
 *           type: integer
 *           nullable: true
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             email:
 *               type: string
 *             username:
 *               type: string
 *     
 *     KYCStats:
 *       type: object
 *       properties:
 *         totalKYCs:
 *           type: integer
 *           description: Total number of KYC applications
 *         pending:
 *           type: integer
 *           description: Number of pending applications
 *         underReview:
 *           type: integer
 *           description: Number of applications under review
 *         approved:
 *           type: integer
 *           description: Number of approved applications
 *         rejected:
 *           type: integer
 *           description: Number of rejected applications
 *         requiresUpdate:
 *           type: integer
 *           description: Number of applications requiring update
 *         expiringIn30Days:
 *           type: integer
 *           description: Number of KYCs expiring in next 30 days
 *         averageProcessingTimeHours:
 *           type: number
 *           description: Average time to process applications (hours)
 *         approvalRate:
 *           type: number
 *           description: Percentage of applications approved
 *     
 *     TransactionLimits:
 *       type: object
 *       properties:
 *         dailyLimit:
 *           type: number
 *           description: Daily transaction limit in USD
 *         monthlyLimit:
 *           type: number
 *           description: Monthly transaction limit in USD
 *         singleTransactionLimit:
 *           type: number
 *           description: Single transaction limit in USD
 *     
 *     KYCStatus:
 *       type: object
 *       properties:
 *         hasKYC:
 *           type: boolean
 *           description: Whether user has submitted KYC
 *         isApproved:
 *           type: boolean
 *           description: Whether KYC is approved and valid
 *         isExpired:
 *           type: boolean
 *           description: Whether KYC has expired
 *         complianceLevel:
 *           type: number
 *           description: Compliance score (0-100)
 *         transactionLimits:
 *           $ref: '#/components/schemas/TransactionLimits'
 *         kyc:
 *           $ref: '#/components/schemas/KYCResponse'
 *           nullable: true
 */

/**
 * @swagger
 * /api/kyc/submit:
 *   post:
 *     summary: Submit new KYC application
 *     description: Submit a new Know Your Customer verification application
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KYCSubmission'
 *     responses:
 *       201:
 *         description: KYC application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 kyc:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     kycLevel:
 *                       type: string
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input or user already has KYC
 *       401:
 *         description: Authentication required
 */
router.post('/submit', authenticateToken, UserKYCController.submitKYC);

/**
 * @swagger
 * /api/kyc/update:
 *   put:
 *     summary: Update existing KYC application
 *     description: Update a pending or requires_update KYC application
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KYCUpdate'
 *     responses:
 *       200:
 *         description: KYC application updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 kyc:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     kycLevel:
 *                       type: string
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: KYC cannot be updated in current status
 *       401:
 *         description: Authentication required
 *       404:
 *         description: KYC application not found
 */
router.put('/update', authenticateToken, UserKYCController.updateKYC);

/**
 * @swagger
 * /api/kyc/my-status:
 *   get:
 *     summary: Get current user's KYC status
 *     description: Retrieve the authenticated user's KYC verification status and transaction limits
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's KYC status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KYCStatus'
 *       401:
 *         description: Authentication required
 */
router.get('/my-status', authenticateToken, UserKYCController.getMyKYC);

/**
 * @swagger
 * /api/kyc/check-limits:
 *   get:
 *     summary: Check transaction limits
 *     description: Check if a transaction amount is within user's KYC limits
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *           minimum: 0.01
 *         description: Transaction amount to check
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [single, daily, monthly]
 *           default: single
 *         description: Type of transaction limit to check
 *     responses:
 *       200:
 *         description: Transaction limit check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allowed:
 *                   type: boolean
 *                   description: Whether transaction is allowed
 *                 reason:
 *                   type: string
 *                   description: Reason if transaction is not allowed
 *                 currentLimit:
 *                   type: number
 *                   description: Current limit for the transaction type
 *                 usedAmount:
 *                   type: number
 *                   description: Amount already used in current period
 *                 availableAmount:
 *                   type: number
 *                   description: Available amount for transactions
 *       400:
 *         description: Invalid amount or transaction type
 *       401:
 *         description: Authentication required
 */
router.get('/check-limits', authenticateToken, UserKYCController.checkTransactionLimits);

// Admin routes
/**
 * @swagger
 * /api/kyc/admin/all:
 *   get:
 *     summary: Get all KYC applications (Admin)
 *     description: Retrieve all KYC applications with filtering and pagination
 *     tags: [KYC Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (comma-separated for multiple)
 *       - in: query
 *         name: kycLevel
 *         schema:
 *           type: string
 *         description: Filter by KYC level (comma-separated for multiple)
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country
 *       - in: query
 *         name: riskScoreMin
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Minimum risk score filter
 *       - in: query
 *         name: riskScoreMax
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Maximum risk score filter
 *       - in: query
 *         name: submittedAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter submissions after this date
 *       - in: query
 *         name: submittedBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter submissions before this date
 *       - in: query
 *         name: expiringBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter KYCs expiring before this date
 *       - in: query
 *         name: includeExpired
 *         schema:
 *           type: boolean
 *         description: Include expired KYCs in results
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, submittedAt, reviewedAt, approvedAt, riskScore]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: KYC applications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 kycs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/KYCResponse'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get('/admin/all', authenticateToken, UserKYCController.getKYCs);

/**
 * @swagger
 * /api/kyc/admin/{id}:
 *   get:
 *     summary: Get KYC application by ID (Admin)
 *     description: Retrieve a specific KYC application by its ID
 *     tags: [KYC Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: KYC application ID
 *     responses:
 *       200:
 *         description: KYC application retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KYCResponse'
 *       400:
 *         description: Invalid KYC ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: KYC application not found
 */
router.get('/admin/:id', authenticateToken, UserKYCController.getKYCById);

/**
 * @swagger
 * /api/kyc/admin/{id}/review:
 *   post:
 *     summary: Review KYC application (Admin)
 *     description: Approve, reject, or request update for a KYC application
 *     tags: [KYC Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: KYC application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KYCReview'
 *     responses:
 *       200:
 *         description: KYC application reviewed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 kyc:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     reviewedAt:
 *                       type: string
 *                       format: date-time
 *                     approvedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     verificationNotes:
 *                       type: string
 *                       nullable: true
 *                     rejectionReason:
 *                       type: string
 *                       nullable: true
 *                     riskScore:
 *                       type: integer
 *                       nullable: true
 *       400:
 *         description: Invalid input or KYC cannot be reviewed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: KYC application not found
 */
router.post('/admin/:id/review', authenticateToken, UserKYCController.reviewKYC);

/**
 * @swagger
 * /api/kyc/admin/stats:
 *   get:
 *     summary: Get KYC statistics (Admin)
 *     description: Retrieve comprehensive statistics about KYC applications
 *     tags: [KYC Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KYCStats'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get('/admin/stats', authenticateToken, UserKYCController.getKYCStats);

/**
 * @swagger
 * /api/kyc/admin/expiring:
 *   get:
 *     summary: Get expiring KYCs (Admin)
 *     description: Retrieve KYC applications that are expiring soon
 *     tags: [KYC Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 30
 *         description: Number of days until expiry to filter by
 *     responses:
 *       200:
 *         description: Expiring KYCs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 expiringKYCs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/KYCResponse'
 *                 count:
 *                   type: integer
 *                 daysUntilExpiry:
 *                   type: integer
 *       400:
 *         description: Invalid days parameter
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get('/admin/expiring', authenticateToken, UserKYCController.getExpiringKYCs);

/**
 * @swagger
 * /api/kyc/admin/bulk-approve:
 *   post:
 *     summary: Bulk approve KYCs (Admin)
 *     description: Approve multiple KYC applications at once
 *     tags: [KYC Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kycIds
 *             properties:
 *               kycIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of KYC IDs to approve
 *               verificationNotes:
 *                 type: string
 *                 description: Optional notes to add to all approved KYCs
 *     responses:
 *       200:
 *         description: Bulk approval completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 successful:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   description: Array of successfully approved KYC IDs
 *                 failed:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       error:
 *                         type: string
 *                   description: Array of failed approvals with error messages
 *                 totalProcessed:
 *                   type: integer
 *                 successCount:
 *                   type: integer
 *                 failedCount:
 *                   type: integer
 *       400:
 *         description: Invalid KYC IDs array
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.post('/admin/bulk-approve', authenticateToken, UserKYCController.bulkApproveKYCs);

/**
 * @swagger
 * /api/kyc/admin/user/{userId}:
 *   get:
 *     summary: Get user's KYC status by user ID (Admin)
 *     description: Retrieve KYC status and transaction limits for a specific user
 *     tags: [KYC Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to get KYC status for
 *     responses:
 *       200:
 *         description: User's KYC status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KYCStatus'
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get('/admin/user/:userId', authenticateToken, UserKYCController.getUserKYCStatus);

export default router;
