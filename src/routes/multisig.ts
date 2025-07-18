import { Router } from 'express';
import { MultiSigController } from '../controller/MultiSigController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     MultiSigSettings:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Settings ID
 *         isEnabled:
 *           type: boolean
 *           description: Whether multi-signature is enabled
 *         thresholdAmount:
 *           type: number
 *           description: Minimum amount to trigger multi-signature
 *         signerUserId:
 *           type: integer
 *           nullable: true
 *           description: ID of the designated signer
 *         requiresSeedPhrase:
 *           type: boolean
 *           description: Whether settings are "locked" (true = locked, requires seed phrase for changes; false = unlocked, easy setup mode)
 *         signer:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: integer
 *             email:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     MultiSigSettingsUpdate:
 *       type: object
 *       required:
 *         - isEnabled
 *         - thresholdAmount
 *       properties:
 *         isEnabled:
 *           type: boolean
 *           description: Enable or disable multi-signature
 *         thresholdAmount:
 *           type: number
 *           minimum: 0.01
 *           description: Minimum amount to trigger multi-signature
 *         signerUserId:
 *           type: integer
 *           description: ID of the designated signer (cannot be yourself)
 *         requiresSeedPhrase:
 *           type: boolean
 *           description: Whether to require seed phrase for settings changes
 *     
 *     PendingTransaction:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Transaction ID
 *         initiatorUserId:
 *           type: integer
 *           description: User who initiated the transaction
 *         signerUserId:
 *           type: integer
 *           description: User who needs to approve the transaction
 *         transactionType:
 *           type: string
 *           enum: [wallet_transfer, community_market, withdrawal, payment]
 *         amount:
 *           type: number
 *           description: Transaction amount
 *         currency:
 *           type: string
 *           default: USD
 *         recipientAddress:
 *           type: string
 *           nullable: true
 *         recipientUserId:
 *           type: integer
 *           nullable: true
 *         description:
 *           type: string
 *           nullable: true
 *         transactionData:
 *           type: object
 *           description: Additional transaction details
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected, expired, cancelled]
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         approvedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         rejectedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         approvalMessage:
 *           type: string
 *           nullable: true
 *         rejectionReason:
 *           type: string
 *           nullable: true
 *         timeRemaining:
 *           type: number
 *           description: Time remaining in milliseconds
 *         timeRemainingHours:
 *           type: number
 *           description: Time remaining in hours
 *         initiator:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             email:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *         signer:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             email:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *         recipient:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: integer
 *             email:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     CreatePendingTransaction:
 *       type: object
 *       required:
 *         - transactionType
 *         - amount
 *       properties:
 *         transactionType:
 *           type: string
 *           enum: [wallet_transfer, community_market, withdrawal, payment]
 *         amount:
 *           type: number
 *           minimum: 0.01
 *         currency:
 *           type: string
 *           default: USD
 *         recipientAddress:
 *           type: string
 *         recipientUserId:
 *           type: integer
 *         description:
 *           type: string
 *         transactionData:
 *           type: object
 *         expiresInHours:
 *           type: integer
 *           default: 24
 *           minimum: 1
 *           maximum: 168
 *     
 *     MultiSigStats:
 *       type: object
 *       properties:
 *         pendingApprovals:
 *           type: integer
 *           description: Number of transactions pending your approval
 *         initiatedPending:
 *           type: integer
 *           description: Number of your transactions pending approval
 *         totalApproved:
 *           type: integer
 *           description: Total transactions you've approved
 *         totalRejected:
 *           type: integer
 *           description: Total transactions you've rejected
 *         expiringSoon:
 *           type: integer
 *           description: Transactions expiring within 24 hours
 */

/**
 * @swagger
 * /api/multisig/settings:
 *   get:
 *     summary: Get user's multi-signature settings
 *     description: Retrieve the current user's multi-signature configuration
 *     tags: [Multi-Signature]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Multi-signature settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasSettings:
 *                   type: boolean
 *                 settings:
 *                   $ref: '#/components/schemas/MultiSigSettings'
 *       401:
 *         description: Authentication required
 */
router.get('/settings', authenticateToken, MultiSigController.getSettings);

/**
 * @swagger
 * /api/multisig/settings-by-email:
 *   put:
 *     summary: Update multi-signature settings using signer email
 *     description: Update multi-signature settings by providing the signer's email address instead of user ID. The system will look up the user ID from your contacts.
 *     tags: [Multi-Signature]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isEnabled
 *               - thresholdAmount
 *             properties:
 *               isEnabled:
 *                 type: boolean
 *                 description: Enable or disable multi-signature
 *                 example: true
 *               thresholdAmount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Minimum amount to trigger multi-signature
 *                 example: 1000
 *               signerEmail:
 *                 type: string
 *                 format: email
 *                 description: Email address of the signer (must be in your contacts)
 *                 example: "bruno.hoffman@example.com"
 *               requiresSeedPhrase:
 *                 type: boolean
 *                 description: Whether to "lock" multi-sig settings (false = unlocked for easy setup, true = locked and requires verification token for changes)
 *                 example: false
 *               verificationToken:
 *                 type: string
 *                 description: Verification token obtained from /api/multisig/validate-seed-phrase (required only if current settings are locked with requiresSeedPhrase = true)
 *                 example: "abc123def456..."
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Multi-signature settings updated successfully"
 *                 settings:
 *                   $ref: '#/components/schemas/MultiSigSettings'
 *       400:
 *         description: Invalid input, email not in contacts, user not found, or verification token validation failed for locked settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Verification token required to modify locked multi-signature settings"
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.put('/settings-by-email', authenticateToken, MultiSigController.updateSettingsByEmail);

/**
 * @swagger
 * /api/multisig/check-required:
 *   get:
 *     summary: Check if transaction requires multi-signature
 *     description: Check if a transaction amount triggers multi-signature approval
 *     tags: [Multi-Signature]
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
 *     responses:
 *       200:
 *         description: Multi-signature requirement check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requiresMultiSig:
 *                   type: boolean
 *                 reason:
 *                   type: string
 *                 settings:
 *                   $ref: '#/components/schemas/MultiSigSettings'
 *                 signerUserId:
 *                   type: integer
 *       400:
 *         description: Invalid amount parameter
 *       401:
 *         description: Authentication required
 */
router.get('/check-required', authenticateToken, MultiSigController.checkMultiSigRequired);

/**
 * @swagger
 * /api/multisig/create-pending:
 *   post:
 *     summary: Create pending transaction for approval
 *     description: Create a transaction that requires multi-signature approval
 *     tags: [Multi-Signature]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePendingTransaction'
 *     responses:
 *       201:
 *         description: Pending transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                     signerUserId:
 *                       type: integer
 *       400:
 *         description: Invalid input or multi-signature not required
 *       401:
 *         description: Authentication required
 */
router.post('/create-pending', authenticateToken, MultiSigController.createPendingTransaction);

/**
 * @swagger
 * /api/multisig/pending-approvals:
 *   get:
 *     summary: Get transactions pending your approval
 *     description: Retrieve transactions that are waiting for the current user's approval
 *     tags: [Multi-Signature]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           default: pending
 *         description: Filter by status (comma-separated for multiple)
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *         description: Filter by transaction type (comma-separated for multiple)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, expiresAt, amount]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Pending approvals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PendingTransaction'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Authentication required
 */
router.get('/pending-approvals', authenticateToken, MultiSigController.getPendingApprovals);

/**
 * @swagger
 * /api/multisig/initiated-transactions:
 *   get:
 *     summary: Get your initiated transactions
 *     description: Retrieve transactions that you initiated and are pending approval
 *     tags: [Multi-Signature]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (comma-separated for multiple)
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *         description: Filter by transaction type (comma-separated for multiple)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, expiresAt, amount]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Initiated transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PendingTransaction'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Authentication required
 */
router.get('/initiated-transactions', authenticateToken, MultiSigController.getInitiatedTransactions);

/**
 * @swagger
 * /api/multisig/transaction/{id}:
 *   get:
 *     summary: Get transaction details
 *     description: Retrieve detailed information about a specific transaction
 *     tags: [Multi-Signature]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction:
 *                   $ref: '#/components/schemas/PendingTransaction'
 *       400:
 *         description: Invalid transaction ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Transaction not found
 */
router.get('/transaction/:id', authenticateToken, MultiSigController.getTransactionById);

/**
 * @swagger
 * /api/multisig/transaction/{id}/approve:
 *   post:
 *     summary: Approve a pending transaction
 *     description: Approve a transaction that is waiting for your signature
 *     tags: [Multi-Signature]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Optional approval message
 *     responses:
 *       200:
 *         description: Transaction approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     approvedAt:
 *                       type: string
 *                       format: date-time
 *                     approvalMessage:
 *                       type: string
 *       400:
 *         description: Invalid transaction ID or transaction cannot be approved
 *       401:
 *         description: Authentication required
 */
router.post('/transaction/:id/approve', authenticateToken, MultiSigController.approveTransaction);

/**
 * @swagger
 * /api/multisig/transaction/{id}/reject:
 *   post:
 *     summary: Reject a pending transaction
 *     description: Reject a transaction that is waiting for your signature
 *     tags: [Multi-Signature]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for rejection
 *     responses:
 *       200:
 *         description: Transaction rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     rejectedAt:
 *                       type: string
 *                       format: date-time
 *                     rejectionReason:
 *                       type: string
 *       400:
 *         description: Invalid transaction ID, missing reason, or transaction cannot be rejected
 *       401:
 *         description: Authentication required
 */
router.post('/transaction/:id/reject', authenticateToken, MultiSigController.rejectTransaction);

/**
 * @swagger
 * /api/multisig/transaction/{id}/cancel:
 *   post:
 *     summary: Cancel a pending transaction
 *     description: Cancel a transaction that you initiated (only allowed for initiator)
 *     tags: [Multi-Signature]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *       400:
 *         description: Invalid transaction ID or transaction cannot be cancelled
 *       401:
 *         description: Authentication required
 */
router.post('/transaction/:id/cancel', authenticateToken, MultiSigController.cancelTransaction);

/**
 * @swagger
 * /api/multisig/stats:
 *   get:
 *     summary: Get multi-signature statistics
 *     description: Retrieve statistics about your multi-signature transactions
 *     tags: [Multi-Signature]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MultiSigStats'
 *       401:
 *         description: Authentication required
 */
router.get('/stats', authenticateToken, MultiSigController.getStats);

/**
 * @swagger
 * /api/multisig/validate-seed-phrase:
 *   post:
 *     summary: Validate seed phrase
 *     description: Validate the user's 12-word seed phrase for security verification
 *     tags: [Multi-Signature]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - seedPhrase
 *             properties:
 *               seedPhrase:
 *                 type: string
 *                 description: 12-word seed phrase
 *     responses:
 *       200:
 *         description: Seed phrase validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 verificationToken:
 *                   type: string
 *                   description: Temporary verification token (only provided if valid=true, expires in 5 minutes)
 *                   example: "abc123def456..."
 *       400:
 *         description: Seed phrase is required
 *       401:
 *         description: Authentication required
 */
router.post('/validate-seed-phrase', authenticateToken, MultiSigController.validateSeedPhrase);

// Admin routes
/**
 * @swagger
 * /api/multisig/admin/cleanup-expired:
 *   post:
 *     summary: Clean up expired transactions (Admin)
 *     description: Mark expired pending transactions as expired
 *     tags: [Multi-Signature Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 updatedCount:
 *                   type: integer
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.post('/admin/cleanup-expired', authenticateToken, MultiSigController.cleanupExpiredTransactions);

export default router;
