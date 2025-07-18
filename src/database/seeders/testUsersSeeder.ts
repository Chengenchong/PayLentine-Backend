import { User } from '../../models';
import { AuthService } from '../../services/AuthService';
import { SeedPhraseGenerator } from '../../utils';

const testUsers = [
  {
    email: 'alice@test.com',
    password: 'password123',
    firstName: 'Alice',
    lastName: 'Johnson',
    role: 'user',
    isActive: true
  },
  {
    email: 'bob@test.com',
    password: 'password123',
    firstName: 'Robert',
    lastName: 'Smith',
    role: 'user',
    isActive: true
  },
  {
    email: 'charlie@test.com',
    password: 'password123',
    firstName: 'Charles',
    lastName: 'Brown',
    role: 'user',
    isActive: true
  },
  {
    id: 5,
    email: 'diana@test.com',
    password: 'password123',
    firstName: 'Diana',
    lastName: 'Wilson',
    role: 'user',
    isActive: true
  },
  {
    id: 6,
    email: 'eva@test.com',
    password: 'password123',
    firstName: 'Eva',
    lastName: 'Martinez',
    role: 'user',
    isActive: true
  }
];

export const seedTestUsers = async (): Promise<void> => {
  try {
    console.log('🌱 Starting test users seeding...');

    // Check if test users already exist by email
    const existingUsers = await User.findAll({
      where: {
        email: testUsers.map(user => user.email)
      }
    });

    const existingEmails = existingUsers.map(user => user.email);
    const usersToCreate = testUsers.filter(user => !existingEmails.includes(user.email));

    if (usersToCreate.length === 0) {
      console.log('⚠️  All test users already exist. Skipping seeding.');
      return;
    }

    // Create users using findOrCreate to avoid conflicts
    const createdUsers = [];
    const userSeedPhrases: Array<{ email: string; seedPhrase: string }> = [];
    
    for (const userData of usersToCreate) {
      const hashedPassword = await AuthService.hashPassword(userData.password);
      
      // Generate seed phrase for each user
      const seedPhrase = SeedPhraseGenerator.generateSeedPhrase();
      const seedPhraseHash = SeedPhraseGenerator.hashSeedPhrase(seedPhrase);
      
      const [user, created] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role as 'user' | 'admin',
          isActive: userData.isActive,
          seedPhraseHash
        }
      });

      if (created) {
        createdUsers.push(user);
        userSeedPhrases.push({ email: user.email, seedPhrase });
        console.log(`   ✅ Created user ${user.email}`);
      } else {
        console.log(`   ℹ️  User ${user.email} already exists, skipping creation`);
      }
    }

    console.log(`✅ Successfully seeded ${createdUsers.length} new test users`);
    
    // Log created users
    createdUsers.forEach(user => {
      console.log(`   👤 ${user.firstName} ${user.lastName} (${user.email})`);
    });
    
    // Display seed phrases for test users
    if (userSeedPhrases.length > 0) {
      console.log('');
      console.log('🔐 ========= TEST USER SEED PHRASES =========');
      userSeedPhrases.forEach(({ email, seedPhrase }) => {
        console.log(`📧 ${email}`);
        console.log(`🔑 ${seedPhrase}`);
        console.log('---');
      });
      console.log('🔐 ========================================');
    }

  } catch (error: any) {
    console.error('❌ Error seeding test users:', error.message);
    throw error;
  }
};

export default seedTestUsers;
