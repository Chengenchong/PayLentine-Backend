import { CommunityOffer, User } from '../models';
import { Op } from 'sequelize';

export interface MatchedOffer {
  buyOffer: CommunityOffer;
  sellOffer: CommunityOffer;
  matchRate: number;
  matchAmount: number;
}

export interface SmartContractSignal {
  transactionId: string;
  fromUserId: number;
  toUserId: number;
  amount: number;
  currency: string;
  rate: number;
  status: 'pending' | 'approved' | 'rejected';
}

export class CommunityMarketService {
  /**
   * Find potential matches between buy and sell offers
   * This simulates the smart contract logic for matching offers
   */
  public static async findPotentialMatches(
    currency: string,
    maxMatches: number = 10
  ): Promise<MatchedOffer[]> {
    try {
      // Get active buy offers (users wanting to buy)
      const buyOffers = await CommunityOffer.findAll({
        where: {
          status: 'active',
          offerType: 'buy',
          currency: currency.toUpperCase()
        },
        order: [['rate', 'DESC']], // Highest buy rates first
        limit: 50
      });

      // Get active sell offers (users wanting to sell)
      const sellOffers = await CommunityOffer.findAll({
        where: {
          status: 'active',
          offerType: 'sell',
          currency: currency.toUpperCase()
        },
        order: [['rate', 'ASC']], // Lowest sell rates first
        limit: 50
      });

      const matches: MatchedOffer[] = [];

      // Find matches where buy rate >= sell rate
      for (const buyOffer of buyOffers) {
        for (const sellOffer of sellOffers) {
          // Can't match with yourself
          if (buyOffer.userId === sellOffer.userId) continue;

          // Buy rate must be >= sell rate for a match
          if (buyOffer.rate >= sellOffer.rate) {
            const matchAmount = Math.min(buyOffer.amount, sellOffer.amount);
            const matchRate = (buyOffer.rate + sellOffer.rate) / 2; // Average rate

            matches.push({
              buyOffer,
              sellOffer,
              matchRate,
              matchAmount
            });

            if (matches.length >= maxMatches) break;
          }
        }
        if (matches.length >= maxMatches) break;
      }

      return matches;
    } catch (error) {
      console.error('Error finding matches:', error);
      throw error;
    }
  }

  /**
   * Simulate smart contract pool creation and fund splitting
   * This would integrate with your actual smart contract
   */
  public static async simulateSmartContractExecution(
    match: MatchedOffer
  ): Promise<SmartContractSignal> {
    try {
      // Simulate smart contract logic
      console.log(`🔗 Smart Contract: Creating pool for ${match.matchAmount} ${match.buyOffer.currency}`);
      console.log(`💰 Gathering funds from users ${match.buyOffer.userId} and ${match.sellOffer.userId}`);
      
      // Simulate pool creation delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate transaction signal
      const transactionSignal: SmartContractSignal = {
        transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fromUserId: match.buyOffer.userId,
        toUserId: match.sellOffer.userId,
        amount: match.matchAmount,
        currency: match.buyOffer.currency,
        rate: match.matchRate,
        status: 'approved' // Smart contract approved the transaction
      };

      console.log(`✅ Smart Contract Signal:`, transactionSignal);
      
      return transactionSignal;
    } catch (error) {
      console.error('Smart contract simulation error:', error);
      throw error;
    }
  }

  /**
   * Process smart contract signal and execute backend transaction
   */
  public static async processSmartContractSignal(
    signal: SmartContractSignal
  ): Promise<boolean> {
    try {
      if (signal.status !== 'approved') {
        console.log(`❌ Transaction ${signal.transactionId} not approved by smart contract`);
        return false;
      }

      // Here you would:
      // 1. Update user balances
      // 2. Mark offers as completed/partially completed
      // 3. Create transaction records
      // 4. Send notifications to users

      console.log(`💸 Executing transaction: ${signal.fromUserId} → ${signal.toUserId}`);
      console.log(`💰 Amount: ${signal.amount} ${signal.currency} at rate ${signal.rate}`);

      // Mark offers as completed (simplified)
      await CommunityOffer.update(
        { status: 'completed' },
        {
          where: {
            userId: {
              [Op.in]: [signal.fromUserId, signal.toUserId]
            },
            currency: signal.currency,
            status: 'active'
          }
        }
      );

      return true;
    } catch (error) {
      console.error('Error processing smart contract signal:', error);
      throw error;
    }
  }

  /**
   * Get market statistics for a currency
   */
  public static async getMarketStats(currency?: string) {
    try {
      const where: any = { status: 'active' };
      if (currency) where.currency = currency.toUpperCase();

      const [buyOffers, sellOffers, totalOffers] = await Promise.all([
        CommunityOffer.count({
          where: { ...where, offerType: 'buy' }
        }),
        CommunityOffer.count({
          where: { ...where, offerType: 'sell' }
        }),
        CommunityOffer.count({ where })
      ]);

      // Get rate statistics
      const rateStats = await CommunityOffer.findAll({
        where,
        attributes: [
          [CommunityOffer.sequelize!.fn('AVG', CommunityOffer.sequelize!.col('rate')), 'avgRate'],
          [CommunityOffer.sequelize!.fn('MIN', CommunityOffer.sequelize!.col('rate')), 'minRate'],
          [CommunityOffer.sequelize!.fn('MAX', CommunityOffer.sequelize!.col('rate')), 'maxRate'],
        ],
        raw: true
      });

      return {
        totalOffers,
        buyOffers,
        sellOffers,
        marketDepth: {
          buyDepth: buyOffers,
          sellDepth: sellOffers,
          ratio: sellOffers > 0 ? (buyOffers / sellOffers).toFixed(2) : 'N/A'
        },
        rateStats: rateStats[0] || { avgRate: 0, minRate: 0, maxRate: 0 }
      };
    } catch (error) {
      console.error('Error getting market stats:', error);
      throw error;
    }
  }

  /**
   * Validate offer before creation (business logic)
   */
  public static validateOffer(offerData: {
    offerType: string;
    amount: number;
    currency: string;
    rate: number;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate offer type
    if (!['buy', 'sell'].includes(offerData.offerType)) {
      errors.push('Invalid offer type. Must be "buy" or "sell"');
    }

    // Validate amount
    if (offerData.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }
    if (offerData.amount > 1000000) {
      errors.push('Amount cannot exceed 1,000,000');
    }

    // Validate currency
    if (!offerData.currency || offerData.currency.length < 3) {
      errors.push('Invalid currency code');
    }

    // Validate rate
    if (offerData.rate <= 0) {
      errors.push('Rate must be greater than 0');
    }
    if (offerData.rate > 1000) {
      errors.push('Rate seems unreasonably high');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}