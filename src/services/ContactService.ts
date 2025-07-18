import Contact from '../models/Contact';
import User from '../models/User';
import { ContactCreationAttributes } from '../models/Contact';
import { Op } from 'sequelize';

export class ContactService {
  /**
   * Find user by email to get contact details
   */
  static async findUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await User.findOne({
        where: { email },
        attributes: ['id', 'firstName', 'lastName', 'email'],
      });
      return user;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Add a new contact using email and nickname
   */
  static async addContactByEmail(
    ownerId: number,
    email: string,
    nickname: string
  ): Promise<Contact> {
    try {
      // Find the user by email
      const contactUser = await this.findUserByEmail(email);
      if (!contactUser) {
        throw new Error('User with this email not found');
      }

      // Prevent self-contact
      if (ownerId === contactUser.id) {
        throw new Error('Cannot add yourself as a contact');
      }

      // Check if the contact already exists
      const existingContact = await Contact.findOne({
        where: {
          ownerId,
          contactUserId: contactUser.id,
        },
      });

      if (existingContact) {
        throw new Error('Contact already exists');
      }

      // Create the contact
      const contact = await Contact.create({
        ownerId,
        contactUserId: contactUser.id,
        nickname,
        isVerified: false,
      });

      return contact;
    } catch (error) {
      console.error('Error adding contact by email:', error);
      throw error;
    }
  }

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
            attributes: ['id', 'firstName', 'lastName', 'email'],
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
            attributes: ['id', 'firstName', 'lastName', 'email'],
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
              ],
            },
          ],
        },
        include: [
          {
            model: User,
            as: 'contactUser',
            attributes: ['id', 'firstName', 'lastName', 'email'],
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
}
