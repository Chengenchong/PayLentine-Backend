# Community Market API Documentation

## Overview
The Community Market allows users to create buy/sell offers for currency exchange, similar to Bybit's P2P trading. The backend includes smart contract simulation for automated matching and fund splitting.

## API Endpoints

### Base URL: `/api/community-market`

## Public Endpoints

### 1. Get All Offers
```
GET /offers
```
**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `currency` (optional): Filter by currency (e.g., USD, EUR)
- `offerType` (optional): Filter by type ("buy" or "sell")
- `sortBy` (optional): Sort field (default: "createdAt")
- `sortOrder` (optional): Sort order ("ASC" or "DESC", default: "DESC")

**Response:**
```json
{
  "success": true,
  "data": {
    "offers": [
      {
        "id": 1,
        "user": {
          "id": 1,
          "name": "John Doe"
        },
        "amount": "1000 USD",
        "rate": 1.0800,
        "tags": ["verified"],
        "offerType": "buy",
        "createdAt": "2025-07-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

### 2. Get Buy Offers
```
GET /buy-offers
```
Returns offers where users want to buy currency (sorted by highest rates first).

### 3. Get Sell Offers
```
GET /sell-offers
```
Returns offers where users want to sell currency (sorted by lowest rates first).

### 4. Get Market Statistics
```
GET /stats?currency=USD
```
**Response:**
```json
{
  "success": true,
  "data": {
    "totalOffers": 25,
    "buyOffers": 15,
    "sellOffers": 10,
    "marketDepth": {
      "buyDepth": 15,
      "sellDepth": 10,
      "ratio": "1.50"
    },
    "rateStats": {
      "avgRate": 0.8500,
      "minRate": 0.2100,
      "maxRate": 1.0800
    }
  }
}
```

## Authenticated Endpoints (Require Bearer Token)

### 5. Create New Offer
```
POST /offers
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "offerType": "buy",
  "amount": 1000,
  "currency": "USD",
  "rate": 1.0800,
  "tags": ["verified"]
}
```

### 6. Get User's Offers
```
GET /my-offers
Authorization: Bearer <token>
```
**Query Parameters:**
- `status` (optional): Filter by status ("active", "completed", "cancelled", "expired")
- `page`, `limit`: Pagination

### 7. Cancel Offer
```
POST /offers/{offerId}/cancel
Authorization: Bearer <token>
```

## Smart Contract Simulation

### 8. Simulate Matching & Execution
```
POST /simulate/{currency}
```
Simulates the smart contract process:
1. Finds potential matches between buy/sell offers
2. Creates virtual pool and splits funds
3. Generates transaction signals
4. Executes backend transactions

**Response:**
```json
{
  "success": true,
  "data": {
    "potentialMatches": 3,
    "executedMatch": {
      "buyOffer": {...},
      "sellOffer": {...},
      "matchRate": 1.0775,
      "matchAmount": 500
    },
    "smartContractSignal": {
      "transactionId": "tx_1721040123_abc123def",
      "fromUserId": 1,
      "toUserId": 2,
      "amount": 500,
      "currency": "USD",
      "rate": 1.0775,
      "status": "approved"
    },
    "transactionExecuted": true
  }
}
```

## Data Models

### CommunityOffer
```typescript
{
  id: number;
  userId: number;
  offerType: 'buy' | 'sell';
  amount: number;
  currency: string;
  rate: number;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  tags: ('verified' | 'p2p' | 'premium' | 'new')[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Integration with Your Smart Contract

The smart contract simulation demonstrates how your backend would integrate:

1. **Pool Creation**: Smart contract gathers funds from matched users
2. **Fund Splitting**: Algorithm determines optimal distribution
3. **Signal Generation**: Smart contract sends transaction signals to backend
4. **Execution**: Backend processes the signal and updates user balances

Your actual smart contract would replace the simulation functions in `CommunityMarketService.ts`.

## Testing the API

You can test with sample data by running the database seeder:
```bash
npm run seed
```

This creates sample offers matching your UI mockup with different users, rates, and tags.
