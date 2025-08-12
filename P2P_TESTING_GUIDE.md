# P2P Payment System Testing Guide

This guide provides multiple ways to test the P2P payment functionality with mock data and simulate both sell and buy order workflows.

## Overview

The P2P platform supports two main trading scenarios:

1. **Sell Orders (C2B Flow)**: Sellers list crypto, buyers pay via mobile money
2. **Buy Orders (B2C Flow)**: Buyers request crypto, platform pays sellers via mobile money

## Testing Methods

### 1. Web Dashboard Testing (Recommended)

Access the interactive testing dashboard at `/test-p2p`:

```
http://localhost:3000/test-p2p
```

**Features:**

- Visual test runner with real-time results
- Mock order management
- Custom test builder
- Detailed result logging
- Interactive webhook testing

**Steps:**

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000/test-p2p`
3. Use the "Test Runner" tab to run predefined scenarios
4. View results in the "Results" tab

### 2. Command Line Testing

Run tests from the terminal using the CLI script:

```bash
# Run all tests
npm run test:p2p

# Run specific test scenarios
npm run test:p2p:sell      # Test sell order flow
npm run test:p2p:buy       # Test buy order flow
npm run test:p2p:webhooks  # Test webhook processing
npm run test:p2p:phone     # Test phone normalization
```

**Example Output:**

```
🚀 P2P Payment System Test Suite
==================================================

🧪 Testing Sell Order Flow...
1. Matching sell order...
✅ Order matched: test-sell-1723462800000

2. Requesting C2B payment...
✅ Payment requested: TX_1723462801000

3. Finding matching transactions...
✅ Matching transactions found

4. Confirming payment received...
✅ Payment confirmed by seller

✅ Sell order flow completed successfully!
```

### 3. Direct API Testing

Test individual API endpoints directly:

#### Sell Order Flow APIs

```bash
# 1. Match Order
curl -X POST "http://localhost:3000/api/orders/p2p?action=match_order" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "test-sell-001",
    "buyer_id": "test-buyer-001",
    "seller_id": "test-seller-001",
    "buyer_phone": "254701234567"
  }'

# 2. Request Payment
curl -X POST "http://localhost:3000/api/orders/p2p?action=request_payment" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "test-sell-001",
    "buyer_phone": "254701234567",
    "amount": 3500,
    "description": "Test ETH purchase"
  }'

# 3. Find Matching Transactions
curl -X POST "http://localhost:3000/api/orders/p2p?action=find_matching_transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "test-sell-001",
    "expected_amount": 3500,
    "buyer_phone": "254701234567"
  }'

# 4. Confirm Payment
curl -X POST "http://localhost:3000/api/orders/p2p?action=confirm_payment_received" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "test-sell-001",
    "seller_id": "test-seller-001"
  }'
```

#### Buy Order Flow APIs

```bash
# 1. Initiate Buy Order
curl -X POST "http://localhost:3000/api/orders/p2p?action=initiate_buy_order" \
  -H "Content-Type: application/json" \
  -d '{
    "buy_order_id": "test-buy-001",
    "buyer_id": "test-buyer-002",
    "seller_phone_number": "254723456789",
    "amount": 5000
  }'

# 2. Check Payment Status
curl -X POST "http://localhost:3000/api/orders/p2p?action=check_payment_status" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "test-buy-001"
  }'
```

#### Webhook Testing

```bash
# Test C2B Webhook
curl -X POST "http://localhost:3000/api/webhooks/sasapay" \
  -H "Content-Type: application/json" \
  -d '{
    "MerchantRequestID": "29115-34620561-1",
    "CheckoutRequestID": "ws_CO_test",
    "ResultCode": 0,
    "ResultDesc": "The service request is processed successfully.",
    "CustomerMobile": "254708374149",
    "BillRefNumber": "test-order-001",
    "TransAmount": "3500.00",
    "TransactionDate": "20250812102115"
  }'

# Test B2C Webhook
curl -X POST "http://localhost:3000/api/webhooks/sasapay" \
  -H "Content-Type: application/json" \
  -d '{
    "MerchantCode": "MERCHANT123",
    "DestinationChannel": "MPESA",
    "RecipientName": "John Doe",
    "RecipientAccountNumber": "254712345678",
    "ResultCode": "0",
    "ResultDesc": "The service request is processed successfully.",
    "SasaPayTransactionID": "TX987654321",
    "TransactionAmount": "5000",
    "MerchantTransactionReference": "P2P_BUY_test_123",
    "TransactionDate": "20250812120000"
  }'
```

## Test Scenarios

### Scenario 1: Complete Sell Order Flow

**Description:** Customer wants to buy 0.1 ETH from a seller

**Steps:**

1. Seller creates sell order for 0.1 ETH at 35,000 KES/ETH
2. Buyer matches the order
3. System requests C2B payment from buyer (3,500 KES)
4. Buyer pays via mobile money
5. Seller confirms payment received
6. System releases crypto to buyer

**Expected Results:**

- Order status: `active` → `matched` → `payment_pending` → `payment_confirmed` → `completed`
- C2B payment request successful
- Transaction matching with high confidence
- Crypto transfer to buyer wallet

### Scenario 2: Complete Buy Order Flow

**Description:** Customer wants to sell 0.01 BTC to the platform

**Steps:**

1. Buyer creates buy order for 0.01 BTC at 500,000 KES/BTC
2. System matches with available seller
3. System initiates B2C payment to seller (5,000 KES)
4. SasaPay processes payment
5. System confirms payment completion
6. Seller transfers crypto to buyer

**Expected Results:**

- Order status: `pending` → `matched` → `processing` → `completed`
- B2C payment sent successfully
- Payment confirmation received
- Crypto transfer completed

### Scenario 3: Phone Number Normalization

**Test Cases:**

- `0712345678` → `254712345678` ✅
- `254712345678` → `254712345678` ✅
- `+254712345678` → `254712345678` ✅
- `12345` → `Invalid` ❌

### Scenario 4: Error Handling

**Test Cases:**

- Invalid order ID
- Insufficient funds
- Network timeouts
- Webhook failures
- Phone number validation errors

## Mock Data

### Test Orders

```javascript
// Sell Order
{
  id: "sell-test-001",
  type: "sell",
  seller_id: "seller-alice",
  crypto_currency: "ETH",
  fiat_currency: "KES",
  amount_crypto: 0.1,
  amount_fiat: 3500,
  rate: 35000,
  status: "active",
  seller_phone: "254712345678"
}

// Buy Order
{
  id: "buy-test-001",
  type: "buy",
  buyer_id: "buyer-bob",
  crypto_currency: "BTC",
  fiat_currency: "KES",
  amount_crypto: 0.01,
  amount_fiat: 5000,
  rate: 500000,
  status: "pending"
}
```

### Test Users

```javascript
// Sellers
{
  id: "seller-alice",
  name: "Alice Seller",
  phone: "254712345678",
  verified: true
}

// Buyers
{
  id: "buyer-bob",
  name: "Bob Buyer",
  phone: "254723456789",
  verified: true
}
```

## Environment Setup

### Required Environment Variables

```env
# SasaPay Configuration
SASAPAY_CLIENT_ID=your_client_id
SASAPAY_CLIENT_SECRET=your_client_secret
SASAPAY_MERCHANT_CODE=your_merchant_code
SASAPAY_WEBHOOK_URL=https://your-domain.ngrok.io/api/webhooks/sasapay

# Database
DATABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

### Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local

# 3. Start development server
npm run dev

# 4. Run tests
npm run test:p2p
```

## Testing Checklist

### ✅ API Endpoints

- [ ] Order matching API
- [ ] Payment request API
- [ ] Transaction finding API
- [ ] Payment confirmation API
- [ ] Buy order initiation API
- [ ] Payment status check API

### ✅ Webhook Processing

- [ ] C2B callback handling
- [ ] B2C callback handling
- [ ] IPN processing
- [ ] Error callback handling

### ✅ Phone Number Handling

- [ ] Kenya format validation
- [ ] Automatic normalization
- [ ] Error handling for invalid formats

### ✅ Order Management

- [ ] Order creation
- [ ] Status updates
- [ ] Payment tracking
- [ ] Completion handling

### ✅ Error Scenarios

- [ ] Network failures
- [ ] Invalid parameters
- [ ] Timeout handling
- [ ] Database errors

## Performance Testing

### Load Testing

```bash
# Test concurrent orders
for i in {1..10}; do
  curl -X POST "http://localhost:3000/api/orders/p2p?action=match_order" \
    -H "Content-Type: application/json" \
    -d "{\"order_id\": \"load-test-$i\", \"buyer_id\": \"buyer-$i\"}" &
done
wait
```

### Stress Testing

```bash
# Test webhook processing under load
for i in {1..50}; do
  curl -X POST "http://localhost:3000/api/webhooks/sasapay" \
    -H "Content-Type: application/json" \
    -d "{\"MerchantRequestID\": \"stress-$i\", \"ResultCode\": 0}" &
done
wait
```

## Monitoring and Debugging

### Log Monitoring

```bash
# Watch application logs
tail -f logs/app.log

# Watch payment logs
tail -f logs/payments.log

# Watch webhook logs
tail -f logs/webhooks.log
```

### Database Monitoring

```sql
-- Check order status distribution
SELECT status, COUNT(*) FROM orders GROUP BY status;

-- Check payment transaction status
SELECT status, COUNT(*) FROM payment_transactions GROUP BY status;

-- Check recent activity
SELECT * FROM order_logs ORDER BY created_at DESC LIMIT 10;
```

## Troubleshooting

### Common Issues

1. **Webhook not received**

   - Check ngrok is running
   - Verify webhook URL in SasaPay dashboard
   - Check firewall settings

2. **Phone number validation errors**

   - Ensure phone numbers are in Kenya format
   - Check normalization logic
   - Verify regex patterns

3. **Order matching fails**

   - Check order status
   - Verify user permissions
   - Check database constraints

4. **Payment timeouts**
   - Increase timeout values
   - Check SasaPay API status
   - Verify network connectivity

### Debug Commands

```bash
# Check API health
curl http://localhost:3000/api/health

# Test database connection
npm run db:test

# Validate environment
npm run env:check

# Clear test data
npm run test:cleanup
```

## Next Steps

1. **Production Testing**

   - Deploy to staging environment
   - Test with real SasaPay sandbox
   - Validate webhook delivery

2. **Integration Testing**

   - Test with real mobile money
   - Validate crypto transfers
   - Test edge cases

3. **Security Testing**

   - Validate input sanitization
   - Test authentication
   - Check authorization flows

4. **Performance Optimization**
   - Database query optimization
   - API response caching
   - Webhook processing optimization

## Support

For testing support:

- Check the `/test-p2p` dashboard for visual testing
- Use `npm run test:p2p --help` for CLI options
- Review logs in `logs/` directory
- Check API documentation in `/docs`
