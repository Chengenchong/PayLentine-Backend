import sequelize from '../database';
import { User } from '../models';
import { SeedPhraseGenerator } from '../utils';
import { Op } from 'sequelize';

/**
 * Script to generate seed phrases for existing users who don't have one
 * This should be run after the migration adds the seedPhraseHash column
 */
async function generateSeedPhrasesForExistingUsers() {
  try {
    console.log('Starting seed phrase generation for existing users...');

    // Find all users without a seed phrase hash (using raw query to handle null properly)
    const usersWithoutSeedPhrase = await sequelize.query(`
      SELECT * FROM users WHERE seed_phrase_hash IS NULL OR seed_phrase_hash = ''
    `, { 
      model: User,
      mapToModel: true 
    }) as User[];

    if (usersWithoutSeedPhrase.length === 0) {
      console.log('All users already have seed phrases. Nothing to do.');
      return;
    }

    console.log(`Found ${usersWithoutSeedPhrase.length} users without seed phrases.`);

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

        console.log(`Generated seed phrase for user ${user.email} (ID: ${user.id})`);
      } catch (error) {
        console.error(`Failed to generate seed phrase for user ${user.email}:`, error);
      }
    }

    // Output all generated seed phrases
    console.log('\n=== GENERATED SEED PHRASES ===');
    console.log('IMPORTANT: Save these seed phrases securely and provide them to the respective users.');
    console.log('These will NOT be displayed again!\n');

    generatedPhrases.forEach(({ userId, email, seedPhrase }) => {
      console.log(`User ID: ${userId}`);
      console.log(`Email: ${email}`);
      console.log(`Seed Phrase: ${seedPhrase}`);
      console.log('---');
    });

    console.log(`\nSuccessfully generated seed phrases for ${generatedPhrases.length} users.`);
  } catch (error) {
    console.error('Failed to generate seed phrases for existing users:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    await generateSeedPhrasesForExistingUsers();

    console.log('Seed phrase generation completed successfully.');
  } catch (error) {
    console.error('Seed phrase generation script failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  main();
}

export { generateSeedPhrasesForExistingUsers };
