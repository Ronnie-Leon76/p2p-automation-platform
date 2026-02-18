# P2P Automation Platform - Payment Flow Documentation

## Overview

The P2P Automation Platform implements a dual-direction payment system:

- **Users pay YOU**: Via SASAPAY Paybill service
- **YOU pay users**: Via M-Pesa, Airtel Money, or Bank Transfer

This creates a seamless payment experience where you can collect payments through one method while having flexibility in how you pay out to users.

## Payment Flow Architecture

### 1. Incoming Payments (Users → You)

#### SASAPAY Paybill Integration

- **Service**: SASAPAY Paybill
- **Direction**: Users pay you
- **Payment Method**: Paybill number with unique account numbers
- **Verification**: Real-time payment notifications via webhooks

**Flow:**

1. User initiates a buy order for crypto
2. System generates unique account reference (e.g., `P2PUSER001234`)
3. User pays to your SASAPAY Paybill using the account reference
4. SASAPAY sends instant payment notification to your webhook
5. System automatically confirms payment and releases crypto

### 2. Outgoing Payments (You → Users)

#### Multiple Payout Options

You can configure multiple payment methods to pay users:

##### A. M-Pesa Business to Customer (B2C)

- **Use Case**: Direct payments to user M-Pesa accounts
- **Speed**: Instant
- **Best For**: Small to medium amounts (up to KES 150,000)

##### B. Airtel Money Business Payments

- **Use Case**: Payments to Airtel Money users
- **Speed**: Near-instant
- **Best For**: Airtel Money users, cross-network payments

##### C. Bank Transfer (EFT)

- **Use Case**: Direct bank account transfers
- **Speed**: Same day or next business day
- **Best For**: Large amounts, users who prefer bank transfers

## Database Schema

### Key Tables

#### 1. `user_preferences`

Stores user payment configuration:

```sql
-- SASAPAY Configuration (Users pay you)
sasapay_paybill_enabled: boolean
sasapay_paybill_number: varchar(20)
sasapay_business_name: varchar(100)
sasapay_account_number: varchar(50)

-- Payout Methods (You pay users)
payout_methods: jsonb {
  mpesa_enabled: boolean,
  mpesa_shortcode: varchar(20),
  airtel_money_enabled: boolean,
  airtel_merchant_id: varchar(50),
  bank_transfer_enabled: boolean,
  bank_account_details: {
    account_number: varchar(50),
    bank_name: varchar(100),
    bank_code: varchar(20),
    account_name: varchar(100)
  }
}
```

#### 2. `transactions`

Tracks all payment transactions:

```sql
transaction_type: varchar(20) -- 'payment_in', 'payment_out', 'sasapay_payment', 'payout'
direction: varchar(10) -- 'in', 'out'
payment_provider: varchar(20) -- 'sasapay', 'mpesa', 'airtel', 'bank'
```

#### 3. `sasapay_transactions`

SASAPAY-specific transaction details:

```sql
sasapay_transaction_id: varchar(100)
paybill_number: varchar(20)
account_number: varchar(50)
sender_phone: varchar(20)
callback_data: jsonb
```

## API Endpoints

### Payment Initiation

#### Initiate SASAPAY Payment

```
POST /api/payments/sasapay/initiate
```

**Request:**

```json
{
  "amount": 5000,
  "phone_number": "+254712345678",
  "order_id": "ORD-123456",
  "description": "BTC Purchase Payment"
}
```

**Response:**

```json
{
  "success": true,
  "transaction_id": "uuid",
  "checkout_request_id": "ws_CO_123456",
  "account_reference": "P2PUSER001234",
  "paybill_number": "400200",
  "instructions": "Pay KES 5000 to Paybill 400200 using Account Number P2PUSER001234"
}
```

### Payment Status

#### Check Payment Status

```
GET /api/payments/sasapay/status/{transactionId}
```

**Response:**

```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "status": "completed",
    "amount": 5000,
    "currency": "KES"
  },
  "sasapay_details": {
    "checkout_request_id": "ws_CO_123456",
    "paybill_number": "400200",
    "account_number": "P2PUSER001234",
    "status": "completed"
  }
}
```

### Webhook Handling

#### SASAPAY Callback

```
POST /api/payments/sasapay/callback
```

Handles real-time payment notifications from SASAPAY.

## User Interface Components

### 1. Trader Profile - Payment Configuration

The enhanced trader profile includes a comprehensive payment methods section:

- **SASAPAY Paybill Setup**: Configure your business paybill details
- **Payout Methods Configuration**: Set up M-Pesa, Airtel, and bank details
- **Payment Method Validation**: Verify and test payment methods
- **Auto-payment Thresholds**: Set limits for automatic payouts

### 2. Payments Overview

Updated to show:

- **Incoming Payments**: SASAPAY paybill payments from users
- **Outgoing Payments**: Your payouts to users via different methods
- **Payment Method Status**: Real-time status of all configured methods
- **Transaction History**: Complete history with payment directions

### 3. Order Management

Enhanced with payment integration:

- **Payment Instructions**: Auto-generated payment instructions for users
- **Payment Tracking**: Real-time payment status updates
- **Auto-release**: Automatic crypto release upon payment confirmation

## Payment Flow Examples

### Example 1: User Buys Crypto

1. **Order Creation**: User creates buy order for 0.1 BTC at KES 650,000
2. **Payment Instructions**: System generates:
   - Paybill: 400200
   - Account: P2PUSER123BTC
   - Amount: KES 650,000
3. **User Payment**: User pays via M-Pesa/Bank to the paybill
4. **Confirmation**: SASAPAY webhook confirms payment instantly
5. **Crypto Release**: System automatically releases 0.1 BTC to user

### Example 2: User Sells Crypto

1. **Order Creation**: User creates sell order for 0.05 BTC at KES 325,000
2. **Crypto Escrow**: User sends BTC to escrow address
3. **Payment Processing**: You initiate payout via your preferred method:
   - M-Pesa B2C to user's phone
   - Airtel Money transfer
   - Bank transfer to user's account
4. **Completion**: Transaction marked complete once payment sent

## Security Features

### 1. Payment Verification

- Real-time webhook verification
- Transaction amount matching
- Account reference validation
- Duplicate payment prevention

### 2. Fraud Prevention

- Phone number verification
- Transaction limits per user
- Suspicious pattern detection
- Manual review for large amounts

### 3. Data Protection

- Encrypted payment details storage
- PCI DSS compliance considerations
- Secure webhook endpoints
- Audit trail for all transactions

## Configuration Steps

### 1. SASAPAY Setup

1. Register for SASAPAY business account
2. Get paybill number and API credentials
3. Configure webhook URLs in SASAPAY dashboard
4. Add credentials to environment variables

### 2. M-Pesa Setup

1. Register for Safaricom M-Pesa B2C service
2. Get consumer key and consumer secret
3. Configure business shortcode
4. Test with sandbox environment first

### 3. Airtel Money Setup

1. Register for Airtel Money business account
2. Get API credentials and merchant ID
3. Configure payout settings
4. Test in staging environment

### 4. Bank Integration Setup

1. Contact your bank for API access
2. Get API credentials for transfers
3. Configure transfer limits and security
4. Test with small amounts first

## Testing

### Test Scenarios

1. **SASAPAY Payment Test**:

   - Use test paybill number
   - Make test payment with test phone number
   - Verify webhook receives callback
   - Check transaction status updates

2. **Payout Test**:

   - Configure test M-Pesa shortcode
   - Send test amount to test phone number
   - Verify payment delivery
   - Check transaction logging

3. **End-to-end Test**:
   - Complete full buy/sell cycle
   - Verify all payment flows
   - Test error scenarios
   - Validate user experience

## Monitoring & Analytics

### Payment Metrics

- Success rate by payment method
- Average payment processing time
- Failed payment analysis
- User payment preferences

### Financial Reconciliation

- Daily payment summaries
- Payment method breakdown
- Currency conversion tracking
- Fee calculation and reporting

## Support & Troubleshooting

### Common Issues

1. **SASAPAY Webhook Delays**:

   - Check webhook URL configuration
   - Verify SSL certificate
   - Review SASAPAY dashboard logs

2. **M-Pesa Payout Failures**:

   - Verify customer phone number format
   - Check business shortcode balance
   - Review transaction limits

3. **Bank Transfer Issues**:
   - Verify bank account details
   - Check transfer limits
   - Confirm business account status

### Support Contacts

- SASAPAY Support: support@sasapay.app
- Safaricom M-Pesa: mpesabusiness@safaricom.co.ke
- Airtel Money Business: business@airtel.co.ke

## Future Enhancements

### Planned Features

1. **Multi-currency Support**: USD, EUR payment options
2. **Crypto Payments**: Direct crypto-to-crypto trades
3. **Payment Scheduling**: Scheduled and recurring payments
4. **Advanced Analytics**: Payment flow optimization
5. **Mobile Money APIs**: Direct integration with more providers

### Integration Roadmap

- **Phase 1**: SASAPAY + M-Pesa (Current)
- **Phase 2**: Airtel Money + Bank transfers
- **Phase 3**: Additional payment providers
- **Phase 4**: International payment methods
