import { Router } from 'express';
import { ContactController } from '../controller/ContactController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/contacts:
 *   post:
 *     summary: Add a new contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contactUserId
 *               - nickname
 *             properties:
 *               contactUserId:
 *                 type: integer
 *                 description: ID of the user to add as contact
 *               nickname:
 *                 type: string
 *                 description: Nickname for the contact
 *               publicKey:
 *                 type: string
 *                 description: Public key of the contact (optional)
 *               notes:
 *                 type: string
 *                 description: Additional notes about the contact
 *     responses:
 *       201:
 *         description: Contact added successfully
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, ContactController.addContact);

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: Get all contacts for the authenticated user
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contacts retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, ContactController.getUserContacts);

/**
 * @swagger
 * /api/contacts/search:
 *   get:
 *     summary: Search contacts by nickname or user information
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Contacts found successfully
 *       400:
 *         description: Bad request - search term required
 *       401:
 *         description: Unauthorized
 */
router.get('/search', authenticateToken, ContactController.searchContacts);

/**
 * @swagger
 * /api/contacts/{contactId}:
 *   get:
 *     summary: Get a specific contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact retrieved successfully
 *       404:
 *         description: Contact not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:contactId', authenticateToken, ContactController.getContact);

/**
 * @swagger
 * /api/contacts/{contactId}:
 *   put:
 *     summary: Update a contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contact ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *                 description: Updated nickname for the contact
 *               publicKey:
 *                 type: string
 *                 description: Updated public key of the contact
 *               notes:
 *                 type: string
 *                 description: Updated notes about the contact
 *     responses:
 *       200:
 *         description: Contact updated successfully
 *       404:
 *         description: Contact not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:contactId', authenticateToken, ContactController.updateContact);

/**
 * @swagger
 * /api/contacts/{contactId}:
 *   delete:
 *     summary: Delete a contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact deleted successfully
 *       404:
 *         description: Contact not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:contactId', authenticateToken, ContactController.deleteContact);

/**
 * @swagger
 * /api/contacts/{contactId}/verify:
 *   patch:
 *     summary: Verify a contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact verified successfully
 *       404:
 *         description: Contact not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:contactId/verify', authenticateToken, ContactController.verifyContact);

export default router;
