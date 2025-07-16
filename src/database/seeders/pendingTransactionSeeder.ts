import { PendingTransaction } from '../../models';

export const seedPendingTransactions = async (): Promise<void> => {
  try {
    console.log('🌱 Seeding PendingTransactions...');

    // Check if records already exist
    const existingCount = await PendingTransaction.count();
    if (existingCount > 0) {
      console.log(`✅ PendingTransactions already has ${existingCount} records, skipping...`);
      return;
    }

    // Create sample pending transactions
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in12Hours = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const in6Hours = new Date(now.getTime() + 6 * 60 * 60 * 1000);

    const pendingTransactionData = [
      {
        initiatorUserId: 2, // user2@test.com
        signerUserId: 3, // user3@test.com
        transactionType: 'wallet_transfer' as const,
        amount: 150.00,
        currency: 'USD',
        recipientUserId: 4, // user4@test.com
        description: 'Transfer to user4 for services',
        transactionData: {
          type: 'wallet_transfer',
          fromWallet: 'main',
          toWallet: 'main',
          notes: 'Payment for consulting services'
        },
        status: 'pending' as const,
        expiresAt: in24Hours,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        initiatorUserId: 3, // user3@test.com
        signerUserId: 4, // user4@test.com
        transactionType: 'community_market' as const,
        amount: 750.00,
        currency: 'USD',
        description: 'Community market purchase - Premium package',
        transactionData: {
          type: 'community_market',
          offerId: 1,
          quantity: 1,
          packageType: 'premium'
        },
        status: 'pending' as const,
        expiresAt: in12Hours,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        initiatorUserId: 5, // user5@test.com
        signerUserId: 2, // user2@test.com
        transactionType: 'withdrawal' as const,
        amount: 300.00,
        currency: 'USD',
        recipientAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        description: 'Bitcoin withdrawal to external wallet',
        transactionData: {
          type: 'withdrawal',
          cryptoCurrency: 'BTC',
          network: 'bitcoin',
          feeAmount: 0.0005
        },
        status: 'pending' as const,
        expiresAt: in6Hours,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        initiatorUserId: 2, // user2@test.com
        signerUserId: 3, // user3@test.com
        transactionType: 'payment' as const,
        amount: 200.00,
        currency: 'USD',
        recipientUserId: 5, // user5@test.com
        description: 'Payment for freelance work',
        transactionData: {
          type: 'payment',
          category: 'freelance',
          invoiceNumber: 'INV-2024-001',
          taxAmount: 20.00
        },
        status: 'approved' as const,
        expiresAt: in24Hours,
        approvedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        approvalMessage: 'Approved for freelance payment',
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        initiatorUserId: 4, // user4@test.com
        signerUserId: 3, // user3@test.com
        transactionType: 'wallet_transfer' as const,
        amount: 50.00,
        currency: 'USD',
        recipientUserId: 2, // user2@test.com
        description: 'Small transfer for testing',
        transactionData: {
          type: 'wallet_transfer',
          fromWallet: 'savings',
          toWallet: 'main',
          notes: 'Test transaction'
        },
        status: 'rejected' as const,
        expiresAt: in24Hours,
        rejectedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        rejectionReason: 'Insufficient verification for this amount',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      },
    ];

    await PendingTransaction.bulkCreate(pendingTransactionData);
    
    console.log(`✅ Successfully seeded ${pendingTransactionData.length} PendingTransaction records`);
    
    // Log seeded transactions for reference
    console.log('📋 Seeded Pending Transactions:');
    console.log('- User 2 → User 4: $150 wallet transfer (pending, expires in 24h)');
    console.log('- User 3 → Community: $750 market purchase (pending, expires in 12h)');
    console.log('- User 5 → External: $300 BTC withdrawal (pending, expires in 6h)');
    console.log('- User 2 → User 5: $200 payment (approved 2h ago)');
    console.log('- User 4 → User 2: $50 transfer (rejected 1h ago)');

  } catch (error) {
    console.error('❌ Error seeding PendingTransactions:', error);
    throw error;
  }
};
