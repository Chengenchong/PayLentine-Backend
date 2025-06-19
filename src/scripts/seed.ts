#!/usr/bin/env ts-node

/**
 * Database Seeder Script
 * Usage: npm run seed
 */

import dotenv from 'dotenv';
import { runAllSeeders } from '../database/seeders';

// Load environment variables
dotenv.config();

const runSeeders = async () => {
  try {
    console.log('🌱 Starting database seeding process...');
    console.log('📊 Environment:', process.env.NODE_ENV || 'development');
    console.log('🗄️  Database:', process.env.DB_NAME || 'paylentine_db');
    console.log('🔗 Host:', process.env.DB_HOST || 'localhost');
    console.log('');

    await runAllSeeders();
    
    console.log('');
    console.log('✅ Database seeding completed successfully!');
    console.log('🎉 You can now start the server with: npm run dev');
    console.log('');
    console.log('📋 Default Admin Credentials:');
    console.log(`   📧 Email: ${process.env.ADMIN_EMAIL || 'admin@paylentine.com'}`);
    console.log(`   🔑 Password: ${process.env.ADMIN_DEFAULT_PASSWORD || 'DefaultPassword123'}`);
    console.log('');
    console.log('⚠️  Important: Change the default admin password after first login!');
    
    process.exit(0);
  } catch (error: any) {
    console.error('');
    console.error('❌ Database seeding failed:');
    console.error('   Error:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   1. Make sure MySQL server is running');
    console.error('   2. Check your database credentials in .env file');
    console.error('   3. Ensure the database exists or set DB_RESET_ON_STARTUP=true');
    console.error('   4. Verify network connectivity to the database');
    console.error('');
    
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Seeding process interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Seeding process terminated');
  process.exit(1);
});

// Run the seeder
runSeeders(); 