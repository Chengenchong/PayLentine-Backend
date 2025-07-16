import { User, UserKYC } from '../../models';
import { KYCLevel, KYCStatus, DocumentType } from '../../models/UserKYC';

interface UserKYCSeedData {
  userId: number;
  kycLevel: KYCLevel;
  status: KYCStatus;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  nationality: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  documentsSubmitted: DocumentType[];
  documentUrls: string[];
  verificationNotes?: string;
  rejectionReason?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  expiresAt?: Date;
  riskScore?: number;
  ipAddress?: string;
}

const userKYCSeeds: UserKYCSeedData[] = [
  {
    userId: 1, // Admin user
    kycLevel: 'advanced' as KYCLevel,
    status: 'approved' as KYCStatus,
    firstName: 'John',
    lastName: 'AdminUser',
    dateOfBirth: new Date('1990-01-15'),
    nationality: 'United States',
    address: '123 Admin Street, Suite 100',
    city: 'New York',
    postalCode: '10001',
    country: 'United States',
    phoneNumber: '+1-555-0001',
    documentsSubmitted: ['passport', 'utility_bill', 'bank_statement'] as DocumentType[],
    documentUrls: [
      'https://storage.example.com/docs/admin-passport.pdf',
      'https://storage.example.com/docs/admin-utility.pdf',
      'https://storage.example.com/docs/admin-bank.pdf'
    ],
    verificationNotes: 'Admin user - pre-approved with all documents verified',
    submittedAt: new Date('2024-01-15T10:00:00Z'),
    reviewedAt: new Date('2024-01-15T14:00:00Z'),
    approvedAt: new Date('2024-01-15T14:00:00Z'),
    riskScore: 15,
    ipAddress: '192.168.1.100'
  },
  {
    userId: 2, // Alice
    kycLevel: 'intermediate' as KYCLevel,
    status: 'approved' as KYCStatus,
    firstName: 'Alice',
    lastName: 'Johnson',
    dateOfBirth: new Date('1995-03-22'),
    nationality: 'Canada',
    address: '456 Maple Avenue, Apt 2B',
    city: 'Toronto',
    postalCode: 'M5V 3A1',
    country: 'Canada',
    phoneNumber: '+1-416-555-0102',
    documentsSubmitted: ['drivers_license', 'utility_bill'] as DocumentType[],
    documentUrls: [
      'https://storage.example.com/docs/alice-license.pdf',
      'https://storage.example.com/docs/alice-utility.pdf'
    ],
    verificationNotes: 'Standard verification completed successfully',
    submittedAt: new Date('2024-02-10T09:30:00Z'),
    reviewedAt: new Date('2024-02-12T11:15:00Z'),
    approvedAt: new Date('2024-02-12T11:15:00Z'),
    riskScore: 25,
    ipAddress: '10.0.0.102'
  },
  {
    userId: 3, // Bob
    kycLevel: 'basic' as KYCLevel,
    status: 'approved' as KYCStatus,
    firstName: 'Robert',
    lastName: 'Smith',
    dateOfBirth: new Date('1988-07-10'),
    nationality: 'United Kingdom',
    address: '789 Queen Street',
    city: 'London',
    postalCode: 'SW1A 1AA',
    country: 'United Kingdom',
    phoneNumber: '+44-20-7946-0103',
    documentsSubmitted: ['national_id'] as DocumentType[],
    documentUrls: [
      'https://storage.example.com/docs/bob-nationalid.pdf'
    ],
    verificationNotes: 'Basic verification with national ID',
    submittedAt: new Date('2024-03-05T14:20:00Z'),
    reviewedAt: new Date('2024-03-06T10:45:00Z'),
    approvedAt: new Date('2024-03-06T10:45:00Z'),
    riskScore: 35,
    ipAddress: '203.0.113.103'
  },
  {
    userId: 4, // Charlie
    kycLevel: 'intermediate' as KYCLevel,
    status: 'under_review' as KYCStatus,
    firstName: 'Charles',
    lastName: 'Brown',
    dateOfBirth: new Date('1992-11-30'),
    nationality: 'Australia',
    address: '321 Collins Street, Level 5',
    city: 'Melbourne',
    postalCode: '3000',
    country: 'Australia',
    phoneNumber: '+61-3-9555-0104',
    documentsSubmitted: ['passport', 'utility_bill'] as DocumentType[],
    documentUrls: [
      'https://storage.example.com/docs/charlie-passport.pdf',
      'https://storage.example.com/docs/charlie-utility.pdf'
    ],
    verificationNotes: 'Documents under review - passport verification pending',
    submittedAt: new Date('2024-06-20T16:30:00Z'),
    riskScore: 40,
    ipAddress: '198.51.100.104'
  },
  {
    userId: 5, // Diana
    kycLevel: 'basic' as KYCLevel,
    status: 'rejected' as KYCStatus,
    firstName: 'Diana',
    lastName: 'Wilson',
    dateOfBirth: new Date('1985-09-18'),
    nationality: 'Germany',
    address: 'Alexanderplatz 1',
    city: 'Berlin',
    postalCode: '10178',
    country: 'Germany',
    phoneNumber: '+49-30-555-0105',
    documentsSubmitted: ['national_id'] as DocumentType[],
    documentUrls: [
      'https://storage.example.com/docs/diana-nationalid.pdf'
    ],
    verificationNotes: 'Document quality insufficient for verification',
    rejectionReason: 'Submitted document image is blurry and unreadable. Please resubmit a clear, high-quality scan of your national ID.',
    submittedAt: new Date('2024-05-15T12:00:00Z'),
    reviewedAt: new Date('2024-05-17T09:30:00Z'),
    riskScore: 75,
    ipAddress: '192.0.2.105'
  },
  {
    userId: 6, // Eva
    kycLevel: 'advanced' as KYCLevel,
    status: 'requires_update' as KYCStatus,
    firstName: 'Eva',
    lastName: 'Martinez',
    dateOfBirth: new Date('1993-12-05'),
    nationality: 'Spain',
    address: 'Calle Gran Via 123, 4°A',
    city: 'Madrid',
    postalCode: '28013',
    country: 'Spain',
    phoneNumber: '+34-91-555-0106',
    documentsSubmitted: ['passport', 'utility_bill', 'bank_statement'] as DocumentType[],
    documentUrls: [
      'https://storage.example.com/docs/eva-passport.pdf',
      'https://storage.example.com/docs/eva-utility.pdf',
      'https://storage.example.com/docs/eva-bank.pdf'
    ],
    verificationNotes: 'KYC was approved but has now expired',
    rejectionReason: 'KYC verification has expired and requires renewal with updated documents.',
    submittedAt: new Date('2021-01-10T10:00:00Z'),
    reviewedAt: new Date('2021-01-12T15:30:00Z'),
    approvedAt: new Date('2021-01-12T15:30:00Z'),
    riskScore: 20,
    ipAddress: '203.0.113.106'
  }
];

export const seedUserKYC = async (): Promise<void> => {
  try {
    console.log('🌱 Starting UserKYC seeding...');

    // Check if UserKYC records already exist
    const existingCount = await UserKYC.count();
    if (existingCount > 0) {
      console.log(`⚠️  UserKYC table already has ${existingCount} records. Skipping seeding.`);
      return;
    }

    // Verify that all referenced users exist
    const userIds = userKYCSeeds.map(seed => seed.userId);
    const existingUsers = await User.findAll({
      where: { id: userIds },
      attributes: ['id']
    });

    const existingUserIds = existingUsers.map(user => user.id);
    const missingUserIds = userIds.filter(id => !existingUserIds.includes(id));

    if (missingUserIds.length > 0) {
      console.log(`❌ Missing users with IDs: ${missingUserIds.join(', ')}. Please run user seeder first.`);
      return;
    }

    // Create UserKYC records with proper expiration dates
    const kycRecords: any[] = [];
    for (const seed of userKYCSeeds) {
      const kycData: any = { ...seed };
      
      // Set expiration date for approved KYCs
      if (kycData.status === 'approved' && kycData.approvedAt) {
        const expiration = new Date(kycData.approvedAt);
        const expirationMonths = kycData.kycLevel === 'basic' ? 12 : 
                                kycData.kycLevel === 'intermediate' ? 24 : 36;
        expiration.setMonth(expiration.getMonth() + expirationMonths);
        kycData.expiresAt = expiration;
      }

      kycRecords.push(kycData);
    }

    await UserKYC.bulkCreate(kycRecords);

    console.log(`✅ Successfully seeded ${kycRecords.length} UserKYC records`);
    
    // Log summary
    const statusCounts = await UserKYC.findAll({
      attributes: [
        'status',
        [UserKYC.sequelize!.fn('COUNT', UserKYC.sequelize!.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    console.log('📊 UserKYC Status Summary:');
    statusCounts.forEach((item: any) => {
      console.log(`   ${item.status}: ${item.count}`);
    });

  } catch (error) {
    console.error('❌ Error seeding UserKYC:', error);
    throw error;
  }
};

export default seedUserKYC;
