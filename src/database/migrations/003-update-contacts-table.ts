import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Drop the publicKey column (if it exists)
  try {
    await queryInterface.removeColumn('Contacts', 'publicKey');
  } catch (error) {
    console.log('publicKey column may not exist, skipping removal');
  }

  // Drop the isTrusted column and related indexes (if they exist)
  try {
    await queryInterface.removeIndex('Contacts', 'idx_contact_trusted');
  } catch (error) {
    console.log('idx_contact_trusted index may not exist, skipping removal');
  }

  try {
    await queryInterface.removeIndex('Contacts', 'idx_owner_trusted');
  } catch (error) {
    console.log('idx_owner_trusted index may not exist, skipping removal');
  }

  try {
    await queryInterface.removeColumn('Contacts', 'isTrusted');
  } catch (error) {
    console.log('isTrusted column may not exist, skipping removal');
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Add back the isTrusted column
  await queryInterface.addColumn('Contacts', 'isTrusted', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  // Add back the indexes
  await queryInterface.addIndex('Contacts', ['isTrusted'], {
    name: 'idx_contact_trusted',
  });

  await queryInterface.addIndex('Contacts', ['ownerId', 'isTrusted'], {
    name: 'idx_owner_trusted',
  });
  
  // Add back the publicKey column
  await queryInterface.addColumn('Contacts', 'publicKey', {
    type: DataTypes.STRING(500),
    allowNull: true,
  });
}
