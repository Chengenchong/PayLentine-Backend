import { MultiSigSettings } from '../../models';

export const seedMultiSigSettings = async (): Promise<void> => {
  try {
    console.log('🌱 Seeding MultiSigSettings...');

    // Check if records already exist
    const existingCount = await MultiSigSettings.count();
    if (existingCount > 0) {
      console.log(`✅ MultiSigSettings already has ${existingCount} records, skipping...`);
      return;
    }

    // Create sample multi-signature settings for test users
    const multiSigSettingsData = [
      {
        userId: 2, // user2@test.com
        isEnabled: true,
        thresholdAmount: 100.00,
        signerUserId: 3, // user3@test.com as signer
        requiresSeedPhrase: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 3, // user3@test.com
        isEnabled: true,
        thresholdAmount: 500.00,
        signerUserId: 4, // user4@test.com as signer
        requiresSeedPhrase: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 4, // user4@test.com
        isEnabled: false,
        thresholdAmount: 1000.00,
        signerUserId: undefined, // No signer assigned
        requiresSeedPhrase: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 5, // user5@test.com
        isEnabled: true,
        thresholdAmount: 250.00,
        signerUserId: 2, // user2@test.com as signer
        requiresSeedPhrase: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await MultiSigSettings.bulkCreate(multiSigSettingsData);
    
    console.log(`✅ Successfully seeded ${multiSigSettingsData.length} MultiSigSettings records`);
    
    // Log seeded settings for reference
    console.log('📋 Seeded MultiSig Settings:');
    console.log('- User 2: Enabled, $100 threshold, User 3 as signer, requires seed phrase');
    console.log('- User 3: Enabled, $500 threshold, User 4 as signer, no seed phrase required');
    console.log('- User 4: Disabled, $1000 threshold, no signer assigned');
    console.log('- User 5: Enabled, $250 threshold, User 2 as signer, requires seed phrase');

  } catch (error) {
    console.error('❌ Error seeding MultiSigSettings:', error);
    throw error;
  }
};
