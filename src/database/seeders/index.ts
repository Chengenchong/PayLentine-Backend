import { seedAdminUser } from './adminSeeder';
import { seedTestUsers } from './testUsersSeeder';
import { seedUserKYC } from './userKYCSeeder';
import { seedCommunityOffers } from './communityMarketSeeder';
import { seedMultiSigSettings } from './multiSigSeeder';
import { seedPendingTransactions } from './pendingTransactionSeeder';
import { seedContacts } from './contactSeeder';
import { testConnection, syncDatabase } from '../index';
import { syncAllModels } from '../../models';

export const runAllSeeders = async (): Promise<void> => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Test database connection
    await testConnection();
    
    // Sync all models (create tables if they don't exist) - force recreate for clean state
    // This ensures proper table creation order with foreign key constraints
    await syncAllModels(true);
    
    // Run individual seeders
    await seedAdminUser();
    await seedTestUsers();
    await seedUserKYC();
    await seedCommunityOffers();
    await seedMultiSigSettings();
    await seedPendingTransactions();
    await seedContacts(); // Add contacts after users are created
    
    console.log('✅ Database seeding completed successfully!');
  } catch (error: any) {
    console.error('❌ Database seeding failed:', error.message);
    throw error;
  }
};

// Export individual seeders
export { seedAdminUser } from './adminSeeder';
export { seedTestUsers } from './testUsersSeeder';
export { seedUserKYC } from './userKYCSeeder';
export { seedCommunityOffers } from './communityMarketSeeder';
export { seedMultiSigSettings } from './multiSigSeeder';
export { seedPendingTransactions } from './pendingTransactionSeeder';
export { seedContacts } from './contactSeeder';