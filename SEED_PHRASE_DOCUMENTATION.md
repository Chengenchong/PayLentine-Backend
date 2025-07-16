# Seed Phrase Authentication System

This document explains the 12-word seed phrase authentication system implemented for user accounts.

## Overview

The seed phrase system provides an additional layer of security and backup authentication for user accounts. Each user receives a unique 12-word seed phrase during registration that can be used to authenticate their account.

## Features

- **Unique 12-word seed phrases**: Generated from a list of 2048 English words
- **Cryptographically secure**: Uses Node.js crypto module for random generation
- **Secure storage**: Seed phrases are hashed using SHA-256 before storage
- **Backup authentication**: Users can log in using either password or seed phrase
- **Collision detection**: Ensures no duplicate seed phrases exist

## API Endpoints

### 1. User Registration
- **Endpoint**: `POST /api/auth/register`
- **Response**: Returns user data, JWT token, and the **plain text seed phrase**
- **Important**: The seed phrase is only returned during registration and never again

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true
    },
    "token": "jwt_token_here",
    "seedPhrase": "abandon ability able about above absent absorb abstract absurd abuse access accident"
  }
}
```

### 2. Seed Phrase Authentication
- **Endpoint**: `POST /api/auth/seed-phrase-login`
- **Request Body**:
```json
{
  "email": "user@example.com",
  "seedPhrase": "abandon ability able about above absent absorb abstract absurd abuse access accident"
}
```

- **Response**:
```json
{
  "success": true,
  "message": "Seed phrase authentication successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true
    },
    "token": "jwt_token_here"
  }
}
```

## Security Features

### 1. Secure Generation
- Uses `crypto.randomBytes()` for cryptographically secure random number generation
- Selects 12 words from a 2048-word English dictionary
- Validates word list integrity on startup

### 2. Secure Storage
- Seed phrases are never stored in plain text
- Uses SHA-256 hashing for storage
- Hash comparison for authentication
- Seed phrase hashes are excluded from all API responses

### 3. Format Validation
- Ensures exactly 12 words
- Validates all words exist in the official word list
- Case-insensitive validation

### 4. Uniqueness Guarantee
- Checks for hash collisions during generation
- Regenerates if duplicate found (with retry limit)
- Mathematical collision probability is extremely low

## Database Schema

The `users` table includes a new column:

```sql
ALTER TABLE users ADD COLUMN seed_phrase_hash VARCHAR(500) NOT NULL;
```

- **Column**: `seed_phrase_hash`
- **Type**: VARCHAR(500)
- **Purpose**: Stores SHA-256 hash of the seed phrase
- **Security**: Never returned in API responses

## Migration and Setup

### For New Installations
No additional setup required. The seed phrase functionality is included in the User model.

### For Existing Installations

1. **Run the migration**:
```bash
npm run migrate:seed-phrase
```

2. **Generate seed phrases for existing users**:
```bash
npm run generate:seed-phrases
```

3. **Rollback migration (if needed)**:
```bash
npm run migrate:seed-phrase:rollback
```

## Implementation Details

### Core Components

1. **SeedPhraseGenerator** (`src/utils/seedPhraseGenerator.ts`)
   - Generates 12-word seed phrases
   - Validates seed phrase format
   - Handles hashing and verification
   - Ensures uniqueness

2. **User Model Updates** (`src/models/User.ts`)
   - Added `seedPhraseHash` field
   - Excludes hash from JSON serialization
   - Updated TypeScript interfaces

3. **AuthService Updates** (`src/services/AuthService.ts`)
   - Modified registration to generate seed phrases
   - Added seed phrase authentication method
   - Enhanced security validations

4. **AuthController Updates** (`src/controller/AuthController.ts`)
   - Added seed phrase login endpoint
   - Comprehensive error handling
   - Swagger documentation

### Word List
- Uses BIP-39 compatible English word list
- 2048 unique words
- Stored in `src/constants/seedphraseList/english.txt`
- Loaded once and cached for performance

## Security Considerations

### Do's
✅ **Store seed phrases securely**: Users should write down and store their seed phrases in a secure location  
✅ **Use HTTPS**: Always transmit seed phrases over encrypted connections  
✅ **Validate input**: Check seed phrase format before processing  
✅ **Rate limiting**: Implement rate limiting on authentication endpoints  

### Don'ts
❌ **Never log seed phrases**: Avoid logging plain text seed phrases  
❌ **Never cache seed phrases**: Don't store seed phrases in memory longer than necessary  
❌ **Never transmit unnecessarily**: Only return seed phrases during registration  
❌ **Never store plain text**: Always hash seed phrases before database storage  

## Error Handling

The system includes comprehensive error handling for:
- Invalid seed phrase format (not 12 words)
- Words not in the official word list
- Database connection issues
- Hash generation failures
- Uniqueness validation failures

## Testing

### Manual Testing

1. **Registration Test**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

2. **Seed Phrase Login Test**:
```bash
curl -X POST http://localhost:3000/api/auth/seed-phrase-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "seedPhrase": "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
  }'
```

## Troubleshooting

### Common Issues

1. **"Failed to load word list"**
   - Ensure `english.txt` exists in `src/constants/seedphraseList/`
   - Check file permissions and path

2. **"Invalid seed phrase format"**
   - Verify exactly 12 words separated by single spaces
   - Check all words exist in the word list

3. **"Failed to generate unique seed phrase"**
   - Rare collision issue
   - Check database connectivity
   - Verify migration ran successfully

### Database Issues

1. **Column doesn't exist error**:
   - Run migration: `npm run migrate:seed-phrase`

2. **Existing users without seed phrases**:
   - Run: `npm run generate:seed-phrases`
   - Securely distribute generated seed phrases to users

## Future Enhancements

Potential improvements for the seed phrase system:

- **Multi-language support**: Support for other BIP-39 language word lists
- **Seed phrase recovery**: Allow users to update their seed phrase
- **Enhanced entropy**: Additional randomness sources
- **Hardware wallet integration**: Support for hardware wallet seed phrases
- **Backup mechanisms**: Encrypted seed phrase backup options

## Support

For issues or questions regarding the seed phrase system, refer to:
- Check this documentation
- Review error logs
- Verify database migrations
- Test with sample seed phrases
