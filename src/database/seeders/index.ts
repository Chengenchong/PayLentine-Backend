import { seedAdminUser } from './adminSeeder';
import { seedTestUsers } from './testUsersSeeder';
import { seedUserKYC } from './userKYCSeeder';
import { seedCommunityOffers } from './communityMarketSeeder';
import { testConnection, syncDatabase } from '../index';

export const runAllSeeders = async (): Promise<void> => {
  try {
    console.log('🌱 Starting database seeding...');
      // Test database connection
    await testConnection();
    
    // Sync database (create tables if they don't exist) - force recreate for clean state
    await syncDatabase(true);
    
    // Run individual seeders
    await seedAdminUser();
    await seedTestUsers();
    await seedUserKYC();
    await seedCommunityOffers();
    
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