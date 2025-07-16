import { Response } from 'express';
import { CommunityOffer, User } from '../models';
import { Op } from 'sequelize';
import { CustomRequest } from '../types/express';
import { CommunityMarketService } from '../services/CommunityMarketService';

export class CommunityMarketController {
  // Get all active offers with pagination and filters
  public static async getOffers(req: CustomRequest, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        currency,
        offerType, // 'buy' or 'sell'
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const where: any = { status: 'active' };

      // Apply filters
      if (currency) where.currency = currency;
      if (offerType) where.offerType = offerType;

      const offers = await CommunityOffer.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName']
          }
        ],
        order: [[sortBy as string, sortOrder as string]],
        limit: Number(limit),
        offset
      });

      // Format data to match your UI structure
      const formattedOffers = offers.rows.map(offer => ({
        id: offer.id,
        user: {
          id: offer.user?.id,
          name: offer.user ? `${offer.user.firstName} ${offer.user.lastName}` : 'Unknown',
        },
        amount: `${offer.amount} ${offer.currency}`,
        rate: offer.rate,
        tags: offer.tags,
        offerType: offer.offerType,
        createdAt: offer.createdAt
      }));

      res.status(200).json({
        success: true,
        data: {
          offers: formattedOffers,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: offers.count,
            pages: Math.ceil(offers.count / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching offers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create a new offer
  public static async createOffer(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const {
        offerType, // 'buy' or 'sell'
        amount,
        currency,
        rate,
        tags = []
      } = req.body;

      // Validation
      if (!offerType || !amount || !currency || !rate) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: offerType, amount, currency, rate'
        });
        return;
      }

      if (!['buy', 'sell'].includes(offerType)) {
        res.status(400).json({
          success: false,
          message: 'offerType must be either "buy" or "sell"'
        });
        return;
      }

      const offer = await CommunityOffer.create({
        userId: Number(userId),
        offerType,
        amount: Number(amount),
        currency: currency.toUpperCase(),
        rate: Number(rate),
        tags
      });

      res.status(201).json({
        success: true,
        data: {
          offer: offer.getDisplayInfo()
        },
        message: 'Offer created successfully'
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get buy offers (what users want to buy)
  public static async getBuyOffers(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { currency, page = 1, limit = 20 } = req.query;
      
      const where: any = { 
        status: 'active',
        offerType: 'buy'
      };
      
      if (currency) where.currency = currency;

      const offers = await CommunityOffer.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName']
          }
        ],
        order: [['rate', 'DESC']], // Highest rates first for buy offers
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit)
      });

      const formattedOffers = offers.rows.map(offer => ({
        id: offer.id,
        user: {
          id: offer.user?.id,
          name: offer.user ? `${offer.user.firstName} ${offer.user.lastName}` : 'Unknown',
        },
        amount: `${offer.amount} ${offer.currency}`,
        rate: offer.rate,
        tags: offer.tags
      }));

      res.status(200).json({
        success: true,
        data: {
          offers: formattedOffers,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: offers.count,
            pages: Math.ceil(offers.count / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching buy offers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get sell offers (what users want to sell)
  public static async getSellOffers(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { currency, page = 1, limit = 20 } = req.query;
      
      const where: any = { 
        status: 'active',
        offerType: 'sell'
      };
      
      if (currency) where.currency = currency;

      const offers = await CommunityOffer.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName']
          }
        ],
        order: [['rate', 'ASC']], // Lowest rates first for sell offers
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit)
      });

      const formattedOffers = offers.rows.map(offer => ({
        id: offer.id,
        user: {
          id: offer.user?.id,
          name: offer.user ? `${offer.user.firstName} ${offer.user.lastName}` : 'Unknown',
        },
        amount: `${offer.amount} ${offer.currency}`,
        rate: offer.rate,
        tags: offer.tags
      }));

      res.status(200).json({
        success: true,
        data: {
          offers: formattedOffers,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: offers.count,
            pages: Math.ceil(offers.count / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching sell offers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user's own offers
  public static async getUserOffers(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { status, page = 1, limit = 20 } = req.query;
      const where: any = { userId: Number(userId) };
      
      if (status) where.status = status;

      const offers = await CommunityOffer.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit)
      });

      res.status(200).json({
        success: true,
        data: {
          offers: offers.rows.map(offer => offer.getDisplayInfo()),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: offers.count,
            pages: Math.ceil(offers.count / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching user offers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Cancel an offer
  public static async cancelOffer(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { offerId } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const offer = await CommunityOffer.findOne({
        where: { id: offerId, userId: Number(userId) }
      });

      if (!offer) {
        res.status(404).json({ success: false, message: 'Offer not found or unauthorized' });
        return;
      }

      if (offer.status !== 'active') {
        res.status(400).json({ success: false, message: 'Can only cancel active offers' });
        return;
      }

      await offer.cancelOffer();

      res.status(200).json({
        success: true,
        message: 'Offer cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling offer:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Smart contract simulation endpoint
  public static async simulateMatching(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { currency } = req.params;
      
      if (!currency) {
        res.status(400).json({ success: false, message: 'Currency is required' });
        return;
      }

      // Find potential matches
      const matches = await CommunityMarketService.findPotentialMatches(currency, 5);
      
      if (matches.length === 0) {
        res.status(200).json({
          success: true,
          message: 'No matches found',
          data: { matches: [] }
        });
        return;
      }

      // Simulate smart contract execution for the first match
      const firstMatch = matches[0];
      const smartContractSignal = await CommunityMarketService.simulateSmartContractExecution(firstMatch);
      
      // Process the signal (this would be called by your smart contract)
      const executed = await CommunityMarketService.processSmartContractSignal(smartContractSignal);

      res.status(200).json({
        success: true,
        data: {
          potentialMatches: matches.length,
          executedMatch: firstMatch,
          smartContractSignal,
          transactionExecuted: executed
        },
        message: 'Smart contract simulation completed'
      });
    } catch (error) {
      console.error('Error in smart contract simulation:', error);
      res.status(500).json({
        success: false,
        message: 'Smart contract simulation failed'
      });
    }
  }

  // Get market statistics
  public static async getMarketStats(req: CustomRequest, res: Response): Promise<void> {
    try {
      const { currency } = req.query;
      
      const stats = await CommunityMarketService.getMarketStats(currency as string);
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching market stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
