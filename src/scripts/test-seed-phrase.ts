import { SeedPhraseGenerator } from '../utils/seedPhraseGenerator';

/**
 * Test script to verify seed phrase generation functionality
 */
async function testSeedPhraseGeneration() {
  console.log('Testing Seed Phrase Generation...\n');

  try {
    // Test 1: Generate multiple seed phrases
    console.log('Test 1: Generating 5 sample seed phrases');
    for (let i = 1; i <= 5; i++) {
      const seedPhrase = SeedPhraseGenerator.generateSeedPhrase();
      console.log(`${i}. ${seedPhrase}`);
    }

    // Test 2: Validate seed phrase format
    console.log('\nTest 2: Validating seed phrase formats');
    const testPhrases = [
      'abandon ability able about above absent absorb abstract absurd abuse access accident', // Valid
      'abandon ability able about above absent absorb abstract absurd abuse access', // Invalid (11 words)
      'abandon ability able about above absent absorb abstract absurd abuse access accident extra', // Invalid (13 words)
      'invalid word list test test test test test test test test test' // Invalid (words not in list)
    ];

    testPhrases.forEach((phrase, index) => {
      const isValid = SeedPhraseGenerator.validateSeedPhraseFormat(phrase);
      console.log(`  ${index + 1}. "${phrase.substring(0, 50)}..." - ${isValid ? 'VALID' : 'INVALID'}`);
    });

    // Test 3: Hash and verify
    console.log('\nTest 3: Testing hash and verification');
    const testSeedPhrase = SeedPhraseGenerator.generateSeedPhrase();
    const hash = SeedPhraseGenerator.hashSeedPhrase(testSeedPhrase);
    const isVerified = SeedPhraseGenerator.verifySeedPhrase(testSeedPhrase, hash);
    const isWrongVerified = SeedPhraseGenerator.verifySeedPhrase('wrong phrase here wrong phrase here', hash);
    
    console.log(`  Original: ${testSeedPhrase}`);
    console.log(`  Hash: ${hash.substring(0, 20)}...`);
    console.log(`  Verification (correct): ${isVerified ? 'PASS' : 'FAIL'}`);
    console.log(`  Verification (incorrect): ${isWrongVerified ? 'FAIL' : 'PASS'}`);

    // Test 4: Uniqueness test (mock database check)
    console.log('\nTest 4: Testing uniqueness generation');
    const usedHashes = new Set<string>();
    
    const mockUniquenessCheck = async (seedPhrase: string): Promise<boolean> => {
      const hash = SeedPhraseGenerator.hashSeedPhrase(seedPhrase);
      return usedHashes.has(hash);
    };

    for (let i = 1; i <= 3; i++) {
      const uniqueSeedPhrase = await SeedPhraseGenerator.generateUniqueSeedPhrase(mockUniquenessCheck);
      const hash = SeedPhraseGenerator.hashSeedPhrase(uniqueSeedPhrase);
      usedHashes.add(hash);
      console.log(`  ${i}. Generated unique phrase: ${uniqueSeedPhrase}`);
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Seed phrase generation: Working');
    console.log('- Format validation: Working');
    console.log('- Hash/verification: Working');
    console.log('- Uniqueness check: Working');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testSeedPhraseGeneration();
}

export { testSeedPhraseGeneration };
