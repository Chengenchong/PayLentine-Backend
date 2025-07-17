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
    // Each user can have 0 or 1 trusted contact maximum
    const userTrustedStatus = new Map(); // Track which user has a trusted contact
    
    for (let i = 0; i < users.length; i++) {
      const currentUser = users[i];
      
      // Decide if this user will have a trusted contact (60% chance)
      const willHaveTrustedContact = Math.random() > 0.4;
      let trustedContactAssigned = false;
      
      // Add 2-3 contacts for each user
      for (let j = 1; j <= Math.min(3, users.length - 1); j++) {
        const contactIndex = (i + j) % users.length;
        if (contactIndex === i) continue; // Skip self
        
        const contactUser = users[contactIndex];
        
        // Determine if this contact should be trusted
        let isTrusted = false;
        if (willHaveTrustedContact && !trustedContactAssigned && j === 1) {
          // Only assign trusted status to the first contact if user will have one
          isTrusted = true;
          trustedContactAssigned = true;
          userTrustedStatus.set(currentUser.id, contactUser.id);
        }
        
        contactsToCreate.push({
          ownerId: currentUser.id,
          contactUserId: contactUser.id,
          nickname: `${contactUser.firstName} ${contactUser.lastName}`,
          isVerified: true, // All contacts are verified since they're existing users
          isTrusted: isTrusted,
          notes: isTrusted 
            ? `Trusted contact for multi-sig operations`
            : `Contact added via seeder for ${contactUser.email}`,
        });
      }
    }
    
    // Log trusted contact assignments
    console.log('🔐 Trusted contact assignments:');
    for (const [ownerId, trustedContactId] of userTrustedStatus.entries()) {
      const owner = users.find(u => u.id === ownerId);
      const trustedContact = users.find(u => u.id === trustedContactId);
      console.log(`   👤 ${owner?.firstName} ${owner?.lastName} trusts ${trustedContact?.firstName} ${trustedContact?.lastName}`);
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
