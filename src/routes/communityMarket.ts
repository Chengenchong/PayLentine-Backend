import { Router } from 'express';
import { CommunityMarketController } from '../controller/CommunityMarketController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CommunityOffer:
 *       type: object
 *       required:
 *         - userId
 *         - offerType
 *         - amount
 *         - currency
 *         - rate
 *       properties:
 *         id:
 *           type: integer
 *           description: Offer ID
 *           example: 1
 *         userId:
 *           type: integer
 *           description: User ID who created the offer
 *           example: 123
 *         offerType:
 *           type: string
 *           enum: [buy, sell]
 *           description: Type of offer
 *           example: buy
 *         amount:
 *           type: number
 *           description: Amount of currency
 *           example: 1000.50
 *         currency:
 *           type: string
 *           description: Currency code
 *           example: USD
 *         rate:
 *           type: number
 *           description: Exchange rate
 *           example: 1.0800
 *         status:
 *           type: string
 *           enum: [active, completed, cancelled, expired]
 *           description: Offer status
 *           example: active
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *             enum: [verified, p2p, premium, new]
 *           description: User tags
 *           example: ["verified"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     CreateOfferRequest:
 *       type: object
 *       required:
 *         - offerType
 *         - amount
 *         - currency
 *         - rate
 *       properties:
 *         offerType:
 *           type: string
 *           enum: [buy, sell]
 *           description: Type of offer
 *           example: buy
 *         amount:
 *           type: number
 *           description: Amount of currency
 *           example: 1000.50
 *         currency:
 *           type: string
 *           description: Currency code
 *           example: USD
 *         rate:
 *           type: number
 *           description: Exchange rate
 *           example: 1.0800
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *             enum: [verified, p2p, premium, new]
 *           description: User tags
 *           example: ["verified"]
 *     MarketStats:
 *       type: object
 *       properties:
 *         totalOffers:
 *           type: integer
 *           description: Total number of active offers
 *           example: 25
 *         buyOffers:
 *           type: integer
 *           description: Number of buy offers
 *           example: 15
 *         sellOffers:
 *           type: integer
 *           description: Number of sell offers
 *           example: 10
 *         marketDepth:
 *           type: object
 *           properties:
 *             buyDepth:
 *               type: integer
 *               example: 15
 *             sellDepth:
 *               type: integer
 *               example: 10
 *             ratio:
 *               type: string
 *               example: "1.50"
 *         rateStats:
 *           type: object
 *           properties:
 *             avgRate:
 *               type: string
 *               example: "0.8500"
 *             minRate:
 *               type: string
 *               example: "0.2100"
 *             maxRate:
 *               type: string
 *               example: "1.0800"
 *   tags:
 *     - name: Community Market
 *       description: Currency trading marketplace operations
 */

/**
 * @swagger
 * /api/community-market/offers:
 *   get:
 *     summary: Get all active offers with pagination and filters
 *     tags: [Community Market]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Filter by currency
 *         example: USD
 *       - in: query
 *         name: offerType
 *         schema:
 *           type: string
 *           enum: [buy, sell]
 *         description: Filter by offer type
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Offers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     offers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CommunityOffer'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 50
 *                         pages:
 *                           type: integer
 *                           example: 3
 *       500:
 *         description: Internal server error
 */
router.get('/offers', CommunityMarketController.getOffers);

/**
 * @swagger
 * /api/community-market/buy-offers:
 *   get:
 *     summary: Get buy offers (sorted by highest rates first)
 *     tags: [Community Market]
 *     parameters:
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Filter by currency
 *         example: USD
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Buy offers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     offers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CommunityOffer'
 *                     pagination:
 *                       type: object
 */
router.get('/buy-offers', CommunityMarketController.getBuyOffers);

/**
 * @swagger
 * /api/community-market/sell-offers:
 *   get:
 *     summary: Get sell offers (sorted by lowest rates first)
 *     tags: [Community Market]
 *     parameters:
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Filter by currency
 *         example: USD
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Sell offers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     offers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CommunityOffer'
 */
router.get('/sell-offers', CommunityMarketController.getSellOffers);

/**
 * @swagger
 * /api/community-market/offers:
 *   post:
 *     summary: Create a new offer
 *     tags: [Community Market]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOfferRequest'
 *     responses:
 *       201:
 *         description: Offer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     offer:
 *                       $ref: '#/components/schemas/CommunityOffer'
 *                 message:
 *                   type: string
 *                   example: "Offer created successfully"
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.post('/offers', authenticateToken, CommunityMarketController.createOffer);

/**
 * @swagger
 * /api/community-market/my-offers:
 *   get:
 *     summary: Get current user's offers
 *     tags: [Community Market]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, cancelled, expired]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: User offers retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/my-offers', authenticateToken, CommunityMarketController.getUserOffers);

/**
 * @swagger
 * /api/community-market/offers/{offerId}/cancel:
 *   post:
 *     summary: Cancel an offer
 *     tags: [Community Market]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Offer ID to cancel
 *         example: 123
 *     responses:
 *       200:
 *         description: Offer cancelled successfully
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
 *                   example: "Offer cancelled successfully"
 *       400:
 *         description: Cannot cancel offer
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Offer not found or unauthorized
 */
router.post('/offers/:offerId/cancel', authenticateToken, CommunityMarketController.cancelOffer);

/**
 * @swagger
 * /api/community-market/simulate/{currency}:
 *   post:
 *     summary: Simulate smart contract matching and execution
 *     tags: [Community Market]
 *     parameters:
 *       - in: path
 *         name: currency
 *         required: true
 *         schema:
 *           type: string
 *         description: Currency to simulate matching for
 *         example: USD
 *     responses:
 *       200:
 *         description: Smart contract simulation completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     potentialMatches:
 *                       type: integer
 *                       example: 3
 *                     executedMatch:
 *                       type: object
 *                       properties:
 *                         buyOffer:
 *                           $ref: '#/components/schemas/CommunityOffer'
 *                         sellOffer:
 *                           $ref: '#/components/schemas/CommunityOffer'
 *                         matchRate:
 *                           type: number
 *                           example: 1.0775
 *                         matchAmount:
 *                           type: number
 *                           example: 500
 *                     smartContractSignal:
 *                       type: object
 *                       properties:
 *                         transactionId:
 *                           type: string
 *                           example: "tx_1721040123_abc123def"
 *                         fromUserId:
 *                           type: integer
 *                           example: 1
 *                         toUserId:
 *                           type: integer
 *                           example: 2
 *                         amount:
 *                           type: number
 *                           example: 500
 *                         currency:
 *                           type: string
 *                           example: "USD"
 *                         rate:
 *                           type: number
 *                           example: 1.0775
 *                         status:
 *                           type: string
 *                           example: "approved"
 *                     transactionExecuted:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "Smart contract simulation completed"
 *       400:
 *         description: Currency is required
 *       500:
 *         description: Smart contract simulation failed
 */
router.post('/simulate/:currency', CommunityMarketController.simulateMatching);

/**
 * @swagger
 * /api/community-market/stats:
 *   get:
 *     summary: Get market statistics
 *     tags: [Community Market]
 *     parameters:
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Filter statistics by currency
 *         example: USD
 *     responses:
 *       200:
 *         description: Market statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MarketStats'
 *       500:
 *         description: Internal server error
 */
router.get('/stats', CommunityMarketController.getMarketStats);

export default router;