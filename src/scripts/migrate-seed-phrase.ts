import sequelize from '../database';
import { DataTypes } from 'sequelize';

/**
 * Migration script to add seedPhraseHash column to users table
 * Run this script after updating the User model to add seed phrase functionality
 */
async function addSeedPhraseHashColumn() {
  try {
    console.log('Starting migration: Adding seedPhraseHash column to users table...');

    // Check if the column already exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'seed_phrase_hash'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if (Array.isArray(results) && results.length > 0) {
      console.log('Column seedPhraseHash already exists. Skipping migration.');
      return;
    }

    // Add the column
    await sequelize.getQueryInterface().addColumn('users', 'seed_phrase_hash', {
      type: DataTypes.STRING(500),
      allowNull: true, // Initially allow null for existing users
      validate: {
        len: [1, 500],
      },
    });

    console.log('Successfully added seedPhraseHash column to users table.');
    console.log('Note: Existing users will need to have their seed phrases generated separately.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Rollback migration - remove seedPhraseHash column
 */
async function removeSeedPhraseHashColumn() {
  try {
    console.log('Rolling back migration: Removing seedPhraseHash column from users table...');
    
    await sequelize.getQueryInterface().removeColumn('users', 'seed_phrase_hash');
    
    console.log('Successfully removed seedPhraseHash column from users table.');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    if (command === 'rollback') {
      await removeSeedPhraseHashColumn();
    } else {
      await addSeedPhraseHashColumn();
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration script failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  main();
}

export { addSeedPhraseHashColumn, removeSeedPhraseHashColumn };
