import sequelize from '../database';
import User from './User';
import Wallet from './wallet';
import CommunityOffer from './CommunityOffer';

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

// Export all models
export {
  User,
  Wallet,
  CommunityOffer,
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