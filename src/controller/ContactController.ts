import { Response } from 'express';
import { ContactService } from '../services/ContactService';
import { ContactCreationAttributes } from '../models/Contact';
import { CustomRequest } from '../types/express';

export class ContactController {
  /**
   * Add a new contact
   */
  static async addContact(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.user?.id || '0');
      if (!userId || !req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { contactUserId, nickname, publicKey, notes, isTrusted = false } = req.body;

      if (!contactUserId || !nickname) {
        res.status(400).json({
          success: false,
          message: 'Contact user ID and nickname are required',
        });
        return;
      }

      const contactData: ContactCreationAttributes = {
        ownerId: userId,
        contactUserId: parseInt(contactUserId),
        nickname: nickname.trim(),
        publicKey,
        notes,
        isVerified: false,
        isTrusted,
      };

      const contact = await ContactService.addContact(contactData);

      res.status(201).json({
        success: true,
        message: 'Contact added successfully',
        data: contact,
      });
    } catch (error: any) {
      console.error('Error in addContact:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to add contact',
      });
    }
  }

  /**
   * Get all contacts for the authenticated user
   */
  static async getUserContacts(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.user?.id || '0');
      if (!userId || !req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const contacts = await ContactService.getUserContacts(userId);

      res.status(200).json({
        success: true,
        message: 'Contacts retrieved successfully',
        data: contacts,
      });
    } catch (error: any) {
      console.error('Error in getUserContacts:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve contacts',
      });
    }
  }

  /**
   * Get a specific contact
   */
  static async getContact(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.user?.id || '0');
      if (!userId || !req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const contactId = parseInt(req.params.contactId);

      if (isNaN(contactId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid contact ID',
        });
        return;
      }

      const contact = await ContactService.getContact(userId, contactId);

      if (!contact) {
        res.status(404).json({
          success: false,
          message: 'Contact not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Contact retrieved successfully',
        data: contact,
      });
    } catch (error: any) {
      console.error('Error in getContact:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve contact',
      });
    }
  }

  /**
   * Update a contact
   */
  static async updateContact(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.user?.id || '0');
      if (!userId || !req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const contactId = parseInt(req.params.contactId);
      const { nickname, publicKey, notes, isTrusted } = req.body;

      if (isNaN(contactId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid contact ID',
        });
        return;
      }

      const updateData: Partial<ContactCreationAttributes> = {};
      if (nickname !== undefined) updateData.nickname = nickname.trim();
      if (publicKey !== undefined) updateData.publicKey = publicKey;
      if (notes !== undefined) updateData.notes = notes;
      if (isTrusted !== undefined) updateData.isTrusted = isTrusted;

      const contact = await ContactService.updateContact(userId, contactId, updateData);

      if (!contact) {
        res.status(404).json({
          success: false,
          message: 'Contact not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Contact updated successfully',
        data: contact,
      });
    } catch (error: any) {
      console.error('Error in updateContact:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update contact',
      });
    }
  }

  /**
   * Delete a contact
   */
  static async deleteContact(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.user?.id || '0');
      if (!userId || !req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const contactId = parseInt(req.params.contactId);

      if (isNaN(contactId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid contact ID',
        });
        return;
      }

      const deleted = await ContactService.deleteContact(userId, contactId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Contact not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Contact deleted successfully',
      });
    } catch (error: any) {
      console.error('Error in deleteContact:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete contact',
      });
    }
  }

  /**
   * Search contacts
   */
  static async searchContacts(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.user?.id || '0');
      if (!userId || !req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { q: searchTerm } = req.query;

      if (!searchTerm || typeof searchTerm !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Search term is required',
        });
        return;
      }

      const contacts = await ContactService.searchContacts(userId, searchTerm);

      res.status(200).json({
        success: true,
        message: 'Contacts searched successfully',
        data: contacts,
      });
    } catch (error: any) {
      console.error('Error in searchContacts:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search contacts',
      });
    }
  }

  /**
   * Get trusted contacts for multi-sig operations
   */
  static async getTrustedContacts(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.user?.id || '0');
      if (!userId || !req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const trustedContacts = await ContactService.getTrustedContacts(userId);

      res.status(200).json({
        success: true,
        message: 'Trusted contacts retrieved successfully',
        data: trustedContacts,
      });
    } catch (error: any) {
      console.error('Error in getTrustedContacts:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve trusted contacts',
      });
    }
  }

  /**
   * Get the current trusted contact (maximum 1 per user)
   */
  static async getCurrentTrustedContact(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.user?.id || '0');
      if (!userId || !req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const trustedContact = await ContactService.getCurrentTrustedContact(userId);

      res.status(200).json({
        success: true,
        message: trustedContact 
          ? 'Current trusted contact retrieved successfully'
          : 'No trusted contact found',
        data: trustedContact,
      });
    } catch (error: any) {
      console.error('Error in getCurrentTrustedContact:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve current trusted contact',
      });
    }
  }

  /**
   * Verify a contact
   */
  static async verifyContact(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.user?.id || '0');
      if (!userId || !req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const contactId = parseInt(req.params.contactId);

      if (isNaN(contactId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid contact ID',
        });
        return;
      }

      const contact = await ContactService.verifyContact(userId, contactId);

      if (!contact) {
        res.status(404).json({
          success: false,
          message: 'Contact not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Contact verified successfully',
        data: contact,
      });
    } catch (error: any) {
      console.error('Error in verifyContact:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to verify contact',
      });
    }
  }

  /**
   * Set trust level for a contact
   */
  static async setTrustLevel(req: CustomRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.user?.id || '0');
      if (!userId || !req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const contactId = parseInt(req.params.contactId);
      const { isTrusted } = req.body;

      if (isNaN(contactId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid contact ID',
        });
        return;
      }

      if (typeof isTrusted !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'isTrusted must be a boolean value',
        });
        return;
      }

      const contact = await ContactService.setTrustLevel(userId, contactId, isTrusted);

      if (!contact) {
        res.status(404).json({
          success: false,
          message: 'Contact not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Contact ${isTrusted ? 'trusted' : 'untrusted'} successfully`,
        data: contact,
      });
    } catch (error: any) {
      console.error('Error in setTrustLevel:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to set trust level',
      });
    }
  }
}
