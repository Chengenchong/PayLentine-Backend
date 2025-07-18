import Contact from '../../models/Contact';
import User from '../../models/User';

export const seedContacts = async (): Promise<void> => {
  try {
    console.log('🔄 Seeding contacts...');
    
    // Check if contacts already exist
    const existingContacts = await Contact.findAll();
    if (existingContacts.length > 0) {
      console.log('✅ Contacts already exist, skipping seeding.');
      return;
    }

    // Get some existing users to create contacts between them
    const users = await User.findAll({
      limit: 10,
      order: [['id', 'ASC']],
    });

    if (users.length < 2) {
      console.log('⚠️ Not enough users to create contacts, skipping contact seeding.');
      return;
    }

    const contactsToCreate = [];

    // Create contacts between users (each user adds a few others as contacts)
    for (let i = 0; i < users.length; i++) {
      const currentUser = users[i];
      
      // Add 2-3 contacts for each user
      for (let j = 1; j <= Math.min(3, users.length - 1); j++) {
        const contactIndex = (i + j) % users.length;
        if (contactIndex === i) continue; // Skip self
        
        const contactUser = users[contactIndex];
        
        contactsToCreate.push({
          ownerId: currentUser.id,
          contactUserId: contactUser.id,
          nickname: `${contactUser.firstName} ${contactUser.lastName}`,
          isVerified: true, // All contacts are verified since they're existing users
          notes: `Contact added via seeder for ${contactUser.email}`,
        });
      }
    }
    
    // Create the contacts
    await Contact.bulkCreate(contactsToCreate, {
      ignoreDuplicates: true, // In case there are any duplicates
    });

    console.log(`✅ Successfully seeded ${contactsToCreate.length} contacts.`);
  } catch (error) {
    console.error('❌ Error seeding contacts:', error);
    throw error;
  }
};
