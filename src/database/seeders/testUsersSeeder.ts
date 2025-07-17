import { User } from '../../models';
import { AuthService } from '../../services/AuthService';
import { SeedPhraseGenerator } from '../../utils';

const testUsers = [
  {
    id: 2,
    email: 'alice@test.com',
    password: 'password123',
    firstName: 'Alice',
    lastName: 'Johnson',
    role: 'user',
    isActive: true
  },
  {
    id: 3,
    email: 'bob@test.com',
    password: 'password123',
    firstName: 'Robert',
    lastName: 'Smith',
    role: 'user',
    isActive: true
  },
  {
    id: 4,
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

    // Check if test users already exist
    const existingUsers = await User.findAll({
      where: {
        id: testUsers.map(user => user.id)
      }
    });

    const existingUserIds = existingUsers.map(user => user.id);
    const usersToCreate = testUsers.filter(user => !existingUserIds.includes(user.id));

    if (usersToCreate.length === 0) {
      console.log('⚠️  All test users already exist. Skipping seeding.');
      return;
    }

    // Hash passwords and create users
    const createdUsers = [];
    const userSeedPhrases: Array<{ email: string; seedPhrase: string }> = [];
    
    for (const userData of usersToCreate) {
      const hashedPassword = await AuthService.hashPassword(userData.password);
      
      // Generate seed phrase for each user
      const seedPhrase = SeedPhraseGenerator.generateSeedPhrase();
      const seedPhraseHash = SeedPhraseGenerator.hashSeedPhrase(seedPhrase);
      
      const user = await User.create({
        id: userData.id,
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role as 'user' | 'admin',
        isActive: userData.isActive,
        seedPhraseHash
      });

      createdUsers.push(user);
      userSeedPhrases.push({ email: user.email, seedPhrase });
    }

    console.log(`✅ Successfully seeded ${createdUsers.length} test users`);
    
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
