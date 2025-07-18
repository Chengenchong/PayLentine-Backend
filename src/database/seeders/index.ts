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
    
    // Check if we should force recreate tables
    const shouldForceRecreate = process.env.NODE_ENV === 'development' || process.env.FORCE_DB_RESET === 'true';
    
    // Sync all models (create tables if they don't exist)
    // Only force recreate in development or if explicitly requested
    await syncAllModels(shouldForceRecreate);
    
    console.log('🗄️ Database tables synchronized successfully');
    
    // Run individual seeders with better error handling
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