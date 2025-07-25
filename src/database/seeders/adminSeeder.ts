import { AuthService } from '../../services/AuthService';
import { User } from '../../models';
import { SeedPhraseGenerator } from '../../utils';

export const seedAdminUser = async (): Promise<void> => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@paylentine.com';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'DefaultPassword123';

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    
    if (existingAdmin) {
      console.log('👤 Admin user already exists, skipping creation...');
      return;
    }

    // Create admin user
    const hashedPassword = await AuthService.hashPassword(adminPassword);
    
    // Generate seed phrase for admin user
    const seedPhrase = SeedPhraseGenerator.generateSeedPhrase();
    const seedPhraseHash = SeedPhraseGenerator.hashSeedPhrase(seedPhrase);
    
    const adminUser = await User.create({
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      seedPhraseHash,
    });

    console.log('✅ Admin user created successfully:');
    console.log(`   📧 Email: ${adminUser.email}`);
    console.log(`   🔑 Password: ${adminPassword}`);
    console.log(`   🔐 Seed Phrase: ${seedPhrase}`);
    console.log(`   ⚠️  Please change the default password after first login!`);
    console.log(`   ⚠️  Please save the seed phrase securely!`);
    
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  }
};

export const removeAdminUser = async (): Promise<void> => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@paylentine.com';
    
    const deletedCount = await User.destroy({
      where: { email: adminEmail }
    });

    if (deletedCount > 0) {
      console.log('🗑️  Admin user removed successfully');
    } else {
      console.log('👤 Admin user not found, nothing to remove');
    }
  } catch (error: any) {
    console.error('❌ Error removing admin user:', error.message);
    throw error;
  }
}; 