import { CommunityOffer, User } from '../../models';
import type { UserTag, OfferType, OfferStatus } from '../../models/CommunityOffer';
import { AuthService } from '../../services/AuthService';
import { SeedPhraseGenerator } from '../../utils';

export const seedCommunityOffers = async (): Promise<void> => {
  try {
    console.log('🌱 Seeding community market offers...');

    // First, create test users if they don't exist
    const testUsers = [
      { email: 'revolut@test.com', firstName: 'Revolut', lastName: 'User' },
      { email: 'community@test.com', firstName: 'Community', lastName: 'User3' },
      { email: 'maybank@test.com', firstName: 'Maybank', lastName: 'User' },
      { email: 'ocbc@test.com', firstName: 'OCBC', lastName: 'User' },
      { email: 'seller1@test.com', firstName: 'Seller', lastName: 'One' },
      { email: 'seller2@test.com', firstName: 'Seller', lastName: 'Two' },
    ];

    // Create users if they don't exist using findOrCreate to avoid conflicts
    const createdUsers: any[] = [];
    for (const userData of testUsers) {
      const hashedPassword = await AuthService.hashPassword('testpassword123');
      
      // Generate seed phrase for each community market user
      const seedPhrase = SeedPhraseGenerator.generateSeedPhrase();
      const seedPhraseHash = SeedPhraseGenerator.hashSeedPhrase(seedPhrase);
      
      const [user, created] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: 'user',
          isActive: true,
          seedPhraseHash,
        }
      });
      
      createdUsers.push(user);
      
      if (created) {
        console.log(`   ✅ Created user ${userData.email} with seed phrase: ${seedPhrase}`);
      } else {
        console.log(`   ℹ️  User ${userData.email} already exists, skipping creation`);
      }
    }
    
    console.log('✅ Test users created/verified');

    // Get the user IDs
    const users = await User.findAll({
      where: {
        email: ['revolut@test.com', 'community@test.com', 'maybank@test.com', 'ocbc@test.com', 'seller1@test.com', 'seller2@test.com']
      },
      order: [['email', 'ASC']]
    });

    const userIds = users.reduce((acc, user) => {
      const emailMap: { [key: string]: string } = {
        'revolut@test.com': 'revolut',
        'community@test.com': 'community',
        'maybank@test.com': 'maybank',
        'ocbc@test.com': 'ocbc',
        'seller1@test.com': 'seller1',
        'seller2@test.com': 'seller2'
      };
      const key = emailMap[user.email];
      if (key) acc[key] = user.id;
      return acc;
    }, {} as { [key: string]: number });

    // Sample offers data (matching your UI image)
    const sampleOffers = [
      // Buy offers (users wanting to buy USD)
      {
        userId: userIds.revolut, // Revolut user
        offerType: 'buy' as OfferType,
        amount: 1000,
        currency: 'USD',
        rate: 1.0800,
        tags: ['verified'] as UserTag[],
        status: 'active' as OfferStatus
      },
      {
        userId: userIds.community, // CommunityUser3
        offerType: 'buy' as OfferType,
        amount: 1000,
        currency: 'USD',
        rate: 0.2100,
        tags: ['p2p'] as UserTag[],
        status: 'active' as OfferStatus
      },
      {
        userId: userIds.maybank, // Maybank
        offerType: 'buy' as OfferType,
        amount: 1000,
        currency: 'USD',
        rate: 0.2200,
        tags: ['verified'] as UserTag[],
        status: 'active' as OfferStatus
      },
      {
        userId: userIds.ocbc, // OCBC
        offerType: 'buy' as OfferType,
        amount: 1000,
        currency: 'USD',
        rate: 0.7400,
        tags: ['verified'] as UserTag[],
        status: 'active' as OfferStatus
      },
      // Sell offers (users wanting to sell USD)
      {
        userId: userIds.seller1,
        offerType: 'sell' as OfferType,
        amount: 500,
        currency: 'USD',
        rate: 1.0750,
        tags: ['verified'] as UserTag[],
        status: 'active' as OfferStatus
      },
      {
        userId: userIds.seller2,
        offerType: 'sell' as OfferType,
        amount: 800,
        currency: 'USD',
        rate: 0.2050,
        tags: ['p2p'] as UserTag[],
        status: 'active' as OfferStatus
      },
      // EUR offers
      {
        userId: userIds.revolut,
        offerType: 'buy' as OfferType,
        amount: 2000,
        currency: 'EUR',
        rate: 0.9200,
        tags: ['verified'] as UserTag[],
        status: 'active' as OfferStatus
      },
      {
        userId: userIds.community,
        offerType: 'sell' as OfferType,
        amount: 1500,
        currency: 'EUR',
        rate: 0.9180,
        tags: ['premium'] as UserTag[],
        status: 'active' as OfferStatus
      }
    ];

    // Clear existing offers
    await CommunityOffer.destroy({ where: {} });

    // Create new offers
    await CommunityOffer.bulkCreate(sampleOffers as any);

    console.log(`✅ Successfully seeded ${sampleOffers.length} community market offers`);
  } catch (error) {
    console.error('❌ Error seeding community offers:', error);
    throw error;
  }
};
