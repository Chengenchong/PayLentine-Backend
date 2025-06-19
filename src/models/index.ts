import sequelize from '../database';
import User from './User';

// Define associations here if needed
// Example: User.hasMany(Post); Post.belongsTo(User);

// Export all models
export {
  User,
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