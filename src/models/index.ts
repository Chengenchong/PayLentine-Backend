import sequelize from '../database';
import User from './User';
import Wallet from './wallet';
import CommunityOffer from './CommunityOffer';
import UserKYC from './UserKYC';
import MultiSigSettings from './MultiSigSettings';
import PendingTransaction from './PendingTransaction';
import Contact from './Contact';

// Define associations here
User.hasMany(Wallet, { 
  foreignKey: 'userId', 
  as: 'wallets' 
});

Wallet.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

// Community Market associations
User.hasMany(CommunityOffer, {
  foreignKey: 'userId',
  as: 'offers'
});

CommunityOffer.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// UserKYC associations
User.hasOne(UserKYC, {
  foreignKey: 'userId',
  as: 'kyc'
});

UserKYC.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// MultiSig Settings associations
User.hasOne(MultiSigSettings, {
  foreignKey: 'userId',
  as: 'multiSigSettings'
});

MultiSigSettings.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

MultiSigSettings.belongsTo(User, {
  foreignKey: 'signerUserId',
  as: 'signer'
});

// Pending Transaction associations
User.hasMany(PendingTransaction, {
  foreignKey: 'initiatorUserId',
  as: 'initiatedTransactions'
});

User.hasMany(PendingTransaction, {
  foreignKey: 'signerUserId',
  as: 'pendingApprovals'
});

PendingTransaction.belongsTo(User, {
  foreignKey: 'initiatorUserId',
  as: 'initiator'
});

PendingTransaction.belongsTo(User, {
  foreignKey: 'signerUserId',
  as: 'signer'
});

PendingTransaction.belongsTo(User, {
  foreignKey: 'recipientUserId',
  as: 'recipient'
});

// Contact associations
User.hasMany(Contact, {
  foreignKey: 'ownerId',
  as: 'contacts'
});

User.hasMany(Contact, {
  foreignKey: 'contactUserId',
  as: 'contactedBy'
});

Contact.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner'
});

Contact.belongsTo(User, {
  foreignKey: 'contactUserId',
  as: 'contactUser'
});

// Export all models
export {
  User,
  Wallet,
  CommunityOffer,
  UserKYC,
  MultiSigSettings,
  PendingTransaction,
  Contact,
};

// Export sequelize instance
export { sequelize };

// Export a function to sync all models
export const syncAllModels = async (force: boolean = false): Promise<void> => {
  try {
    await sequelize.sync({ force });
    console.log('✅ All models synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing models:', error);
    throw error;
  }
}; 