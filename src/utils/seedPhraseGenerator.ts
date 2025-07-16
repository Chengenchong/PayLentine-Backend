import { readFileSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

/**
 * Seed Phrase Generator for user account creation
 * Generates a unique 12-word mnemonic seed phrase for each user
 */
export class SeedPhraseGenerator {
  private static wordList: string[] | null = null;

  /**
   * Load the English word list from the constants file
   */
  private static loadWordList(): string[] {
    if (this.wordList === null) {
      try {
        const wordListPath = join(__dirname, '../constants/seedphraseList/english.txt');
        const wordListContent = readFileSync(wordListPath, 'utf-8');
        this.wordList = wordListContent
          .split('\n')
          .map(word => word.trim())
          .filter(word => word.length > 0);
      } catch (error) {
        throw new Error('Failed to load word list for seed phrase generation');
      }
    }
    return this.wordList;
  }

  /**
   * Generate a cryptographically secure random 12-word seed phrase
   * @returns {string} A 12-word seed phrase separated by spaces
   */
  public static generateSeedPhrase(): string {
    const wordList = this.loadWordList();
    const seedWords: string[] = [];
    
    // Generate 12 random words using crypto.randomBytes for security
    for (let i = 0; i < 12; i++) {
      // Generate a random index using crypto.randomBytes for better entropy
      const randomBytes = crypto.randomBytes(4);
      const randomIndex = randomBytes.readUInt32BE(0) % wordList.length;
      seedWords.push(wordList[randomIndex]);
    }
    
    return seedWords.join(' ');
  }

  /**
   * Validate if a seed phrase is properly formatted
   * @param {string} seedPhrase - The seed phrase to validate
   * @returns {boolean} True if valid, false otherwise
   */
  public static validateSeedPhraseFormat(seedPhrase: string): boolean {
    if (!seedPhrase || typeof seedPhrase !== 'string') {
      return false;
    }

    const words = seedPhrase.trim().split(/\s+/);
    
    // Must be exactly 12 words
    if (words.length !== 12) {
      return false;
    }

    const wordList = this.loadWordList();
    
    // All words must be from the valid word list
    return words.every(word => wordList.includes(word.toLowerCase()));
  }

  /**
   * Generate a unique seed phrase that doesn't exist in the database
   * @param {Function} checkUniqueness - Function to check if seed phrase already exists
   * @returns {Promise<string>} A unique seed phrase
   */
  public static async generateUniqueSeedPhrase(
    checkUniqueness: (seedPhrase: string) => Promise<boolean>
  ): Promise<string> {
    let seedPhrase: string;
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loops

    do {
      seedPhrase = this.generateSeedPhrase();
      attempts++;
      
      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique seed phrase after maximum attempts');
      }
    } while (await checkUniqueness(seedPhrase));

    return seedPhrase;
  }

  /**
   * Hash a seed phrase for secure storage
   * @param {string} seedPhrase - The seed phrase to hash
   * @returns {string} The hashed seed phrase
   */
  public static hashSeedPhrase(seedPhrase: string): string {
    return crypto
      .createHash('sha256')
      .update(seedPhrase.toLowerCase().trim())
      .digest('hex');
  }

  /**
   * Verify a provided seed phrase against a stored hash
   * @param {string} providedSeedPhrase - The seed phrase provided by user
   * @param {string} storedHash - The stored hash to compare against
   * @returns {boolean} True if the seed phrase matches
   */
  public static verifySeedPhrase(providedSeedPhrase: string, storedHash: string): boolean {
    const providedHash = this.hashSeedPhrase(providedSeedPhrase);
    return providedHash === storedHash;
  }
}
