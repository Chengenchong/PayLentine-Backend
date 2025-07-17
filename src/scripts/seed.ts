#!/usr/bin/env ts-node

/**
 * Database Seeder Script
 * Usage: npm run seed
 */

import dotenv from 'dotenv';
import { runAllSeeders } from '../database/seeders';
import sequelize from '../database';
import { DataTypes } from 'sequelize';
import { User } from '../models';
import { SeedPhraseGenerator } from '../utils';

// Load environment variables
dotenv.config();

/**
 * Migration function to add seedPhraseHash column if it doesn't exist
 */
const ensureSeedPhraseColumn = async (): Promise<void> => {
  try {
    console.log('🔧 Checking seedPhraseHash column...');

    // Check if the column already exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'seed_phrase_hash'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if (Array.isArray(results) && results.length > 0) {
      console.log('✅ seedPhraseHash column already exists.');
      return;
    }

    // Add the column
    console.log('🔧 Adding seedPhraseHash column to users table...');
    await sequelize.getQueryInterface().addColumn('users', 'seed_phrase_hash', {
      type: DataTypes.STRING(500),
      allowNull: true, // Initially allow null for existing users
      validate: {
        len: [1, 500],
      },
    });

    console.log('✅ Successfully added seedPhraseHash column to users table.');
  } catch (error) {
    console.error('❌ Failed to ensure seedPhraseHash column:', error);
    throw error;
  }
};

/**
 * Generate seed phrases for all users who don't have one
 */
const generateSeedPhrasesForUsers = async (): Promise<void> => {
  try {
    console.log('🔑 Generating seed phrases for users...');

    // Find all users without a seed phrase hash
    const usersWithoutSeedPhrase = await sequelize.query(`
      SELECT * FROM users WHERE seed_phrase_hash IS NULL OR seed_phrase_hash = ''
    `, { 
      model: User,
      mapToModel: true 
    }) as User[];

    if (usersWithoutSeedPhrase.length === 0) {
      console.log('✅ All users already have seed phrases.');
      return;
    }

    console.log(`🔑 Found ${usersWithoutSeedPhrase.length} users without seed phrases. Generating...`);

    const generatedPhrases: Array<{ userId: number; email: string; seedPhrase: string }> = [];

    for (const user of usersWithoutSeedPhrase) {
      try {
        // Generate unique seed phrase
        const seedPhrase = await SeedPhraseGenerator.generateUniqueSeedPhrase(
          async (phrase: string) => {
            const hashedPhrase = SeedPhraseGenerator.hashSeedPhrase(phrase);
            const existingUser = await User.findOne({ where: { seedPhraseHash: hashedPhrase } });
            return !!existingUser;
          }
        );

        // Hash the seed phrase for storage
        const seedPhraseHash = SeedPhraseGenerator.hashSeedPhrase(seedPhrase);

        // Update the user
        await user.update({ seedPhraseHash });

        generatedPhrases.push({
          userId: user.id,
          email: user.email,
          seedPhrase
        });

        console.log(`   ✅ Generated seed phrase for ${user.email}`);
      } catch (error) {
        console.error(`   ❌ Failed to generate seed phrase for ${user.email}:`, error);
      }
    }

    // Display generated seed phrases
    if (generatedPhrases.length > 0) {
      console.log('');
      console.log('🔐 =============== GENERATED SEED PHRASES ===============');
      console.log('⚠️  IMPORTANT: Save these seed phrases securely!');
      console.log('📝 These will NOT be displayed again!');
      console.log('');

      generatedPhrases.forEach(({ userId, email, seedPhrase }) => {
        console.log(`👤 User ID: ${userId}`);
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Seed Phrase: ${seedPhrase}`);
        console.log('---');
      });

      console.log(`✅ Successfully generated seed phrases for ${generatedPhrases.length} users.`);
      console.log('🔐 ====================================================');
    }
  } catch (error) {
    console.error('❌ Failed to generate seed phrases:', error);
    throw error;
  }
};

const runSeeders = async () => {
  try {
    console.log('🌱 Starting database seeding process...');
    console.log('📊 Environment:', process.env.NODE_ENV || 'development');
    console.log('🗄️  Database:', process.env.DB_NAME || 'paylentine_db');
    console.log('🔗 Host:', process.env.DB_HOST || 'localhost');
    console.log('');

    // Run the standard seeders (this will create/sync tables)
    await runAllSeeders();
    
    // Ensure seedPhraseHash column exists (for cases where tables already existed)
    await ensureSeedPhraseColumn();
    
    // Generate seed phrases for all users
    await generateSeedPhrasesForUsers();
    
    console.log('');
    console.log('✅ Database seeding completed successfully!');
    console.log('🎉 You can now start the server with: npm run dev');
    console.log('');
    console.log('📋 Default Admin Credentials:');
    console.log(`   📧 Email: ${process.env.ADMIN_EMAIL || 'admin@paylentine.com'}`);
    console.log(`   🔑 Password: ${process.env.ADMIN_DEFAULT_PASSWORD || 'DefaultPassword123'}`);
    console.log('');
    console.log('⚠️  Important: Change the default admin password after first login!');
    console.log('🔐 Important: Save the generated seed phrases securely!');
    
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