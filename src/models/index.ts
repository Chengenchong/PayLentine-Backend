import sequelize from '../database';
import User from './User';
import Wallet from './wallet';
import CommunityOffer from './CommunityOffer';
import UserKYC from './UserKYC';

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

// Export all models
export {
  User,
  Wallet,
  CommunityOffer,
  UserKYC,
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