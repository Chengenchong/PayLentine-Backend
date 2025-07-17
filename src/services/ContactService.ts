import Contact from '../models/Contact';
import User from '../models/User';
import { ContactCreationAttributes } from '../models/Contact';
import { Op } from 'sequelize';

export class ContactService {
  /**
   * Add a new contact for a user
   */
  static async addContact(data: ContactCreationAttributes): Promise<Contact> {
    try {
      // Check if the contact user exists
      const contactUser = await User.findByPk(data.contactUserId);
      if (!contactUser) {
        throw new Error('Contact user not found');
      }

      // Check if the contact already exists
      const existingContact = await Contact.findOne({
        where: {
          ownerId: data.ownerId,
          contactUserId: data.contactUserId,
        },
      });

      if (existingContact) {
        throw new Error('Contact already exists');
      }

      // Prevent self-contact
      if (data.ownerId === data.contactUserId) {
        throw new Error('Cannot add yourself as a contact');
      }

      // If setting as trusted, check if user already has a trusted contact
      if (data.isTrusted) {
        const existingTrustedContact = await Contact.findOne({
          where: {
            ownerId: data.ownerId,
            isTrusted: true,
          },
        });

        if (existingTrustedContact) {
          throw new Error('You can only have one trusted contact. Please remove trust from existing contact first.');
        }
      }

      const contact = await Contact.create(data);
      return contact;
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    }
  }

  /**
   * Get all contacts for a user
   */
  static async getUserContacts(ownerId: number): Promise<Contact[]> {
    try {
      const contacts = await Contact.findAll({
        where: { ownerId },
        include: [
          {
            model: User,
            as: 'contactUser',
            attributes: ['id', 'firstName', 'lastName', 'email', 'username'],
          },
        ],
        order: [['nickname', 'ASC']],
      });

      return contacts;
    } catch (error) {
      console.error('Error fetching user contacts:', error);
      throw error;
    }
  }

  /**
   * Get a specific contact
   */
  static async getContact(ownerId: number, contactId: number): Promise<Contact | null> {
    try {
      const contact = await Contact.findOne({
        where: {
          id: contactId,
          ownerId,
        },
        include: [
          {
            model: User,
            as: 'contactUser',
            attributes: ['id', 'firstName', 'lastName', 'email', 'username'],
          },
        ],
      });

      return contact;
    } catch (error) {
      console.error('Error fetching contact:', error);
      throw error;
    }
  }

  /**
   * Update a contact
   */
  static async updateContact(
    ownerId: number,
    contactId: number,
    updateData: Partial<ContactCreationAttributes>
  ): Promise<Contact | null> {
    try {
      const contact = await Contact.findOne({
        where: {
          id: contactId,
          ownerId,
        },
      });

      if (!contact) {
        throw new Error('Contact not found');
      }

      // Prevent changing the contact user
      if (updateData.contactUserId && updateData.contactUserId !== contact.contactUserId) {
        throw new Error('Cannot change contact user');
      }

      await contact.update(updateData);
      return contact;
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  /**
   * Delete a contact
   */
  static async deleteContact(ownerId: number, contactId: number): Promise<boolean> {
    try {
      const result = await Contact.destroy({
        where: {
          id: contactId,
          ownerId,
        },
      });

      return result > 0;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  /**
   * Search contacts by nickname or user information
   */
  static async searchContacts(ownerId: number, searchTerm: string): Promise<Contact[]> {
    try {
      const contacts = await Contact.findAll({
        where: {
          [Op.and]: [
            { ownerId },
            {
              [Op.or]: [
                { nickname: { [Op.iLike]: `%${searchTerm}%` } },
                // Search by user information
                { '$contactUser.firstName$': { [Op.iLike]: `%${searchTerm}%` } },
                { '$contactUser.lastName$': { [Op.iLike]: `%${searchTerm}%` } },
                { '$contactUser.email$': { [Op.iLike]: `%${searchTerm}%` } },
                { '$contactUser.username$': { [Op.iLike]: `%${searchTerm}%` } },
              ],
            },
          ],
        },
        include: [
          {
            model: User,
            as: 'contactUser',
            attributes: ['id', 'firstName', 'lastName', 'email', 'username'],
          },
        ],
        order: [['nickname', 'ASC']],
      });

      return contacts;
    } catch (error) {
      console.error('Error searching contacts:', error);
      throw error;
    }
  }

  /**
   * Get trusted contacts for multi-sig operations
   */
  static async getTrustedContacts(ownerId: number): Promise<Contact[]> {
    try {
      const trustedContacts = await Contact.findAll({
        where: {
          ownerId,
          isTrusted: true,
          isVerified: true,
        },
        include: [
          {
            model: User,
            as: 'contactUser',
            attributes: ['id', 'firstName', 'lastName', 'email', 'username'],
          },
        ],
        order: [['nickname', 'ASC']],
      });

      return trustedContacts;
    } catch (error) {
      console.error('Error fetching trusted contacts:', error);
      throw error;
    }
  }

  /**
   * Get the current trusted contact for a user (maximum 1)
   */
  static async getCurrentTrustedContact(ownerId: number): Promise<Contact | null> {
    try {
      const trustedContact = await Contact.findOne({
        where: {
          ownerId,
          isTrusted: true,
          isVerified: true,
        },
        include: [
          {
            model: User,
            as: 'contactUser',
            attributes: ['id', 'firstName', 'lastName', 'email', 'username'],
          },
        ],
      });

      return trustedContact;
    } catch (error) {
      console.error('Error fetching current trusted contact:', error);
      throw error;
    }
  }

  /**
   * Verify a contact (typically after successful interaction or verification process)
   */
  static async verifyContact(ownerId: number, contactId: number): Promise<Contact | null> {
    try {
      const contact = await Contact.findOne({
        where: {
          id: contactId,
          ownerId,
        },
      });

      if (!contact) {
        throw new Error('Contact not found');
      }

      await contact.update({ isVerified: true });
      return contact;
    } catch (error) {
      console.error('Error verifying contact:', error);
      throw error;
    }
  }

  /**
   * Set trust level for a contact (enforces one trusted contact per user)
   */
  static async setTrustLevel(ownerId: number, contactId: number, isTrusted: boolean): Promise<Contact | null> {
    try {
      const contact = await Contact.findOne({
        where: {
          id: contactId,
          ownerId,
        },
      });

      if (!contact) {
        throw new Error('Contact not found');
      }

      if (isTrusted) {
        // Check if user already has a trusted contact
        const existingTrustedContact = await Contact.findOne({
          where: {
            ownerId,
            isTrusted: true,
            id: { [require('sequelize').Op.ne]: contactId }, // Exclude current contact
          },
        });

        if (existingTrustedContact) {
          // Remove trust from existing trusted contact before setting new one
          await existingTrustedContact.update({ isTrusted: false });
          console.log(`Removed trust from contact ${existingTrustedContact.id} to set new trusted contact ${contactId}`);
        }
      }

      await contact.update({ isTrusted });
      return contact;
    } catch (error) {
      console.error('Error setting trust level:', error);
      throw error;
    }
  }
}
