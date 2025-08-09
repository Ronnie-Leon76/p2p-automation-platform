# P2P Automation Web Platform

A high-performance cryptocurrency P2P trading automation platform with team delegation, multi-exchange integration, and optimized database performance.

## ⚡ Quick Start for Team Members

### 1. **Setup (2 minutes)**

```bash
git clone <repo-url>
cd p2p-automation-platform
npm install
cp .env.example .env.local
# Add your Supabase credentials to .env.local
```

### 2. **Database Optimization (1 minute)**

- Open your **Supabase SQL Editor**
- Copy/paste the SQL from [`QUICK_DB_SETUP.md`](QUICK_DB_SETUP.md)
- Run it once
- ✅ **10-100x faster database performance applied!**

### 3. **Start Development**

```bash
npm run dev
# Open http://localhost:3001
```

**That's it!** No complex configurations, no manual patches needed.

---

## 🚀 Features

### Core Trading Capabilities

- **Multi-Exchange Support** - OKX, Binance, and Bybit integration
- **Automated Ad Management** - Create, update, and cancel advertisements
- **Order Processing** - End-to-end order lifecycle management
- **Real-time Pricing** - Dynamic pricing with market data integration
- **Risk Management** - Built-in safety controls and limits

### Team Collaboration

- **Team Delegation System** - Centralized trading with individual authentication
- **Role-Based Access Control** - Granular permission management
- **Performance Tracking** - Individual and team analytics
- **Audit Trail** - Complete operation logging

### Payment Integration

- **Mobile Money** - M-Pesa support
- **Banking Integration** - I&M Bank, Equity Bank, KCB
- **Automated Verification** - Real-time payment confirmation
- **Receipt Management** - Cloudinary-powered file storage

### Security & Compliance

- **OAuth Authentication** - Exchange-native security
- **Data Encryption** - End-to-end encryption
- **Compliance Tools** - Built-in reporting and audit features
- **Rate Limiting** - API protection and abuse prevention

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Exchange OAuth (OKX, Binance, Bybit)
- **File Storage**: Cloudinary
- **Payment Processing**: M-Pesa, I&M Bank, Airtel Money
- **UI Components**: shadcn/ui
- **State Management**: React Server Components, Suspense

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- Exchange API credentials (OKX, Binance, Bybit)
- Cloudinary account for file storage
- Payment provider accounts (M-Pesa, I&M Bank)

### 1. Clone and Install

```bash
git clone https://github.com/Ronnie-Leon76/p2p-automation-platform.git
cd p2p-automation-platform
npm install
```

### 2. Environment Setup

Create `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Exchange API Keys
OKX_API_KEY=your_okx_api_key
OKX_API_SECRET=your_okx_api_secret
OKX_PASSPHRASE=your_okx_passphrase

BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret

BYBIT_API_KEY=your_bybit_api_key
BYBIT_API_SECRET=your_bybit_api_secret

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=your_upload_preset
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Payment Providers
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey

IM_BANK_API_KEY=your_im_bank_api_key
IM_BANK_SECRET_KEY=your_im_bank_secret_key
IM_BANK_MERCHANT_ID=your_merchant_id

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

```bash
# Run the database migrations
npm run db:migrate

# Or manually execute the SQL files in order:
# 1. scripts/001-initial-schema.sql
# 2. scripts/002-payment-integration.sql
# 3. scripts/003-exchange-oauth.sql
# 4. scripts/004-team-delegation.sql
```

### 4. Start Development

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🧪 API Testing

### OKX Exchange Integration Testing

We provide a comprehensive test suite to verify that all OKX API endpoints are working correctly. This is essential for partners to validate their API credentials and understand the platform capabilities.

#### Prerequisites for Testing

1. **Valid OKX API Credentials**

   - API Key with P2P trading permissions
   - API Secret
   - Passphrase
   - Ensure API key has the following permissions:
     - Read account information
     - P2P trading
     - Order management

2. **Environment Setup**
   ```bash
   # Ensure your .env.local file contains:
   OKX_API_KEY=your_actual_okx_api_key
   OKX_API_SECRET=your_actual_okx_api_secret
   OKX_API_PASSPHRASE=your_actual_okx_passphrase
   ```

#### Running the Comprehensive Test Suite

```bash
# Install dependencies first
npm install

# Run the complete OKX API test suite
npx tsx test/okx-test-runner.ts
```

#### Test Categories

The test suite covers all major API endpoints:

1. **👤 User Information**

   - `getUserInfo()` - Fetch account details
   - Validates: User ID, nickname, completion rate, KYC level

2. **💰 Balance Management**

   - `getBalance(currency)` - Check balances for USDT, BTC, ETH, KES
   - Validates: Available amount, on-hold amount, currency symbol

3. **💳 Payment Methods**

   - `getPaymentMethods()` - Retrieve configured payment methods
   - Validates: Payment method types, currencies, status

4. **💹 Price Information**

   - `getOptimalPrice(crypto, fiat)` - Get best buy/sell prices
   - `getEstimatedPrice(params)` - Calculate estimated prices
   - Validates: Current highest buy price, lowest sell price

5. **📈 Advertisement Management (Read-Only)**

   - `getActiveAds(params)` - Fetch active advertisements
   - `getMarketplaceAds(params)` - Browse marketplace ads
   - Tests multiple currency pairs: USDT/KES, USDT/USD, BTC/USD
   - Validates: Ad details, creator info, payment methods

6. **📋 Order Management (Read-Only)**
   - `getOrders(params)` - Retrieve order history
   - Validates: Order details, status, counterparty information

#### Safe Testing Configuration

By default, the test suite runs in **read-only mode** to prevent accidental:

- Ad creation
- Order placement
- Payment method creation

To enable write operations (⚠️ **Use with caution**):

```typescript
// In test/okx-test-runner.ts, update these flags:
const ENABLE_AD_CREATION_TESTS = true; // Creates real ads!
const ENABLE_PAYMENT_METHOD_TESTS = true; // Creates real payment methods!
const ENABLE_ORDER_TESTS = true; // Creates real orders!
```

#### Understanding Test Results

**✅ Successful Test Output:**

```
✅ Get User Info
   Data: {
     "userId": "user123",
     "nickName": "YourNickname",
     "completionRate": "98.5",
     "kycLevel": "2"
   }

✅ Get Balance - USDT
   Data: {
     "availableAmount": "1000.50",
     "onHoldAmount": "50.00",
     "currencySymbol": "USDT"
   }
```

**❌ Failed Test Output:**

```
❌ Get Active Ads - buy USDT/KES
   Error: HTTP error! status: 401
```

#### Common Issues and Solutions

1. **401 Authentication Error**

   ```
   ❌ Error: HTTP error! status: 401
   ```

   **Solution:**

   - Verify API credentials in `.env.local`
   - Check API key permissions in OKX account
   - Ensure API key is not expired

2. **403 Forbidden Error**

   ```
   ❌ Error: HTTP error! status: 403
   ```

   **Solution:**

   - Enable P2P trading permissions for your API key
   - Check IP restrictions (if any)

3. **Empty Results**
   ```
   ✅ Get Active Ads - buy USDT/KES
      Array Length: 0
   ```
   **Note:** This is normal if no ads exist for the specified pair

#### Partner Testing Checklist

**Before Integration:**

- [ ] Clone the repository
- [ ] Install dependencies (`npm install`)
- [ ] Configure `.env.local` with your OKX credentials
- [ ] Run the test suite: `npx tsx test/okx-test-runner.ts`
- [ ] Verify >80% test success rate
- [ ] Test with your specific trading pairs (USDT/KES, etc.)

**Required Successful Tests:**

- [ ] ✅ User Info - Confirms API authentication
- [ ] ✅ Get Balance (USDT) - Confirms account access
- [ ] ✅ Get Payment Methods - Confirms P2P access
- [ ] ✅ Get Active Ads - Confirms P2P data access
- [ ] ✅ Get Optimal Price - Confirms market data access

**Optional Advanced Tests (Enable only if needed):**

- [ ] Ad Creation/Update/Cancel (creates real ads)
- [ ] Payment Method Management (creates real payment methods)
- [ ] Order Management (creates real orders)

#### Test Results Interpretation

```
📊 COMPREHENSIVE TEST SUMMARY
==================================================
Total Tests: 45
Successful: 42
Failed: 3
Success Rate: 93.3%

📋 Category Breakdown:
  User Info: 1/1 (100.0%)
  Balance: 4/4 (100.0%)
  Payment Methods: 1/1 (100.0%)
  Price Info: 8/8 (100.0%)
  Ad Management: 26/28 (92.9%)
  Order Management: 1/1 (100.0%)
  Ad Creation: 1/2 (50.0%)
```

**Interpretation:**

- **90%+ Success Rate:** Excellent - Ready for production
- **70-89% Success Rate:** Good - Some features may be limited
- **50-69% Success Rate:** Fair - Check permissions and account setup
- **<50% Success Rate:** Poor - Verify credentials and account status

#### Custom Testing for Your Currency Pairs

Add your specific trading pairs to the test:

```typescript
// In test/okx-test-runner.ts, update the test pairs:
const pricePairs = [
  { crypto: "USDT", fiat: "KES" }, // Your primary pair
  { crypto: "USDT", fiat: "USD" },
  { crypto: "BTC", fiat: "USD" },
  { crypto: "ETH", fiat: "USD" },
  // Add your specific pairs here
];
```

#### Continuous Integration Testing

For automated testing in CI/CD pipelines:

```bash
# GitHub Actions example
- name: Test OKX Integration
  run: npx tsx test/okx-test-runner.ts
  env:
    OKX_API_KEY: ${{ secrets.OKX_API_KEY }}
    OKX_API_SECRET: ${{ secrets.OKX_API_SECRET }}
    OKX_API_PASSPHRASE: ${{ secrets.OKX_API_PASSPHRASE }}
```

This comprehensive testing ensures that your integration with OKX is working correctly and gives you confidence in the platform's capabilities before moving to production.

## 📦 Installation

### Development Setup

1. **Clone Repository**

```bash
git clone https://github.com/yourusername/p2p-automation-platform.git
cd p2p-automation-platform
```

2. **Install Dependencies**

```bash
npm install
```

3. **Setup Database**

   - Create a Supabase project
   - Run the SQL migration scripts in order
   - Configure Row Level Security policies

4. **Configure OAuth Applications**

   - Register OAuth apps with each exchange
   - Update the `exchange_oauth_apps` table with your credentials

5. **Setup Payment Providers**
   - Register with M-Pesa, I&M Bank, etc.
   - Configure webhook URLs in provider dashboards

### Production Deployment

#### Deploy to Vercel

```bash
npm run build
vercel --prod
```

#### Environment Variables

Set all required environment variables in your deployment platform:

- Database credentials
- Exchange API keys
- Payment provider credentials
- File storage configuration

#### Database Migrations

```bash
# Production database setup
npm run db:migrate:prod
```

## ⚙️ Configuration

### Exchange Configuration

#### OKX Setup

1. **API Credentials**

```env
OKX_API_KEY=your_api_key
OKX_API_SECRET=your_api_secret
OKX_PASSPHRASE=your_passphrase
```

2. **Required Permissions**

   - Read account information
   - P2P trading
   - Order management

3. **OAuth Application**

```sql
INSERT INTO exchange_oauth_apps (exchange_name, client_id, client_secret_encrypted, redirect_uri, scopes)
VALUES ('okx', 'your_client_id', 'encrypted_secret', 'https://yourapp.com/auth/okx/callback',
        ARRAY['read_user', 'read_p2p', 'trade_p2p']);
```

#### Binance Setup

Similar setup process with Binance-specific credentials and OAuth configuration.

#### Bybit Setup

Configure Bybit API credentials and OAuth application following the same pattern.

### Payment Provider Configuration

#### M-Pesa Configuration

```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_business_shortcode
MPESA_PASSKEY=your_lipa_na_mpesa_passkey
MPESA_ENVIRONMENT=sandbox # or production
```

#### I&M Bank Configuration

```env
IM_BANK_API_KEY=your_api_key
IM_BANK_SECRET_KEY=your_secret_key
IM_BANK_MERCHANT_ID=your_merchant_id
IM_BANK_ENVIRONMENT=sandbox # or production
```

### File Storage Configuration

#### Cloudinary Setup

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

## 🔗 Exchange Integration

### Supported Operations

#### Ad Management

- **Create Ads** - Post buy/sell advertisements
- **Update Ads** - Modify pricing, limits, payment methods
- **Cancel Ads** - Remove advertisements from marketplace
- **Get Active Ads** - Retrieve current active advertisements
- **Get Marketplace Ads** - Browse available ads from other traders

#### Order Management

- **Create Orders** - Initiate trades with other users
- **Get Orders** - Retrieve order history and status
- **Cancel Orders** - Cancel pending orders
- **Mark as Paid** - Confirm payment completion
- **Release Crypto** - Release cryptocurrency to buyer

#### Pricing & Analytics

- **Optimal Pricing** - Get best buy/sell prices
- **Price Estimation** - Calculate estimated prices
- **Market Data** - Real-time market information

### Usage Examples

#### Creating an Ad

```typescript
import { OKXExchange } from "@/lib/exchanges/okx-exchange";

const okx = new OKXExchange(apiKey, apiSecret, passphrase);

const adParams = {
  side: "sell",
  cryptoCurrency: "USDT",
  fiatCurrency: "KES",
  cryptoAmount: "1000",
  minOrderLimit: "100",
  maxOrderLimit: "10000",
  type: "floating_market",
  priceMargin: "0.02", // 2% above market
  paymentMethods: ["MPESA", "BANK_TRANSFER"],
};

const result = await okx.createAd(adParams);
console.log("Ad created:", result.adId);
```

#### Processing an Order

```typescript
import { PaymentService } from "@/lib/payments/payment-service";

const paymentService = new PaymentService();

// Initiate M-Pesa payment
const payment = await paymentService.initiatePayment({
  orderId: "order_123",
  amount: 5000,
  currency: "KES",
  provider: "mpesa",
  payerPhone: "+254700000000",
});

console.log("Payment initiated:", payment.transactionId);
```

## 👥 Team Management

### Team Delegation System

The platform supports a unique team delegation model where:

1. **Individual Authentication** - Each team member logs in with their own exchange account
2. **Shared Operations** - Trading operations use the team owner's credentials
3. **Permission Control** - Granular control over what each member can do
4. **Operation Logging** - Complete audit trail of all team activities

### Setting Up Team Credentials

1. **Create Team**

```typescript
const team = await createTeam({
  name: "GressHut Trading Team",
  description: "High-volume P2P trading operations",
});
```

2. **Connect Exchange Account**

```typescript
await setupTeamCredentials(
  team.id,
  ownerUserId,
  "okx",
  accessToken,
  refreshToken
);
```

3. **Add Team Members**

```typescript
await inviteTeamMember({
  teamId: team.id,
  email: "trader@example.com",
  role: "trader",
  permissions: ["create_ads", "manage_orders"],
});
```

### Permission System

Available permissions:

- `create_ads` - Create new advertisements
- `update_ads` - Modify existing ads
- `cancel_ads` - Cancel advertisements
- `create_orders` - Initiate new orders
- `manage_orders` - Update order status
- `manage_payments` - Handle payment operations
- `view_analytics` - Access performance data
- `manage_team` - Add/remove team members

### Team Performance Tracking

Track team performance with detailed metrics:

- Individual member contributions
- Order completion rates
- Trading volume per member
- Success rates and feedback scores
- Time-based performance analysis

## 💳 Payment Integration

### Supported Payment Methods

#### Mobile Money

- **M-Pesa** (Kenya, Tanzania)
- **Airtel Money** (Kenya)
- **MTN Mobile Money** (Uganda, Ghana)

#### Banking

- **I&M Bank C2B** (Kenya)
- **Equity Bank** (Kenya)
- **KCB Bank** (Kenya)

### Payment Flow

1. **Order Creation** - P2P order initiated
2. **Payment Request** - Buyer receives payment instructions
3. **Payment Initiation** - Payment processed through provider
4. **Confirmation** - Real-time payment status updates
5. **Proof Upload** - Receipt/proof uploaded to Cloudinary
6. **Verification** - Payment verified and crypto released

### Webhook Integration

All payment providers send real-time updates via webhooks:

```typescript
// M-Pesa webhook endpoint
POST / api / webhooks / mpesa;

// I&M Bank webhook endpoint
POST / api / webhooks / im - bank;

// Airtel Money webhook endpoint
POST / api / webhooks / airtel;
```

### Payment Provider Setup

#### M-Pesa Integration

```typescript
import { MPesaProvider } from "@/lib/payments/mpesa";

const mpesa = new MPesaProvider({
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  shortcode: process.env.MPESA_SHORTCODE,
  passkey: process.env.MPESA_PASSKEY,
  environment: "production",
});

// Initiate STK Push
const payment = await mpesa.initiateSTKPush({
  phoneNumber: "254700000000",
  amount: 1000,
  accountReference: "ORDER_123",
  transactionDesc: "P2P Trading Payment",
});
```

## 📚 API Documentation

### Authentication

All API requests require authentication via exchange OAuth tokens or API keys.

```bash
# Get access token
POST /api/auth/token
Content-Type: application/json

{
  "exchange": "okx",
  "code": "authorization_code"
}
```

### Exchange Operations

#### Create Advertisement

```bash
POST /api/exchanges/okx/ads
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "side": "sell",
  "cryptoCurrency": "USDT",
  "fiatCurrency": "KES",
  "cryptoAmount": "1000",
  "minOrderLimit": "100",
  "maxOrderLimit": "10000",
  "type": "floating_market",
  "priceMargin": "0.02"
}
```

#### Get Orders

```bash
GET /api/exchanges/okx/orders?pageIndex=1&pageSize=20
Authorization: Bearer {access_token}
```

### Payment Operations

#### Initiate Payment

```bash
POST /api/payments/initiate
Content-Type: application/json

{
  "orderId": "order_123",
  "amount": 5000,
  "currency": "KES",
  "provider": "mpesa",
  "payerPhone": "+254700000000"
}
```

#### Upload Payment Proof

```bash
POST /api/payments/upload-proof
Content-Type: multipart/form-data

{
  "transactionId": "txn_123",
  "file": [File],
  "description": "M-Pesa receipt"
}
```

### Team Operations

#### Create Team

```bash
POST /api/teams
Content-Type: application/json

{
  "name": "Trading Team Alpha",
  "description": "Professional P2P trading team"
}
```

#### Add Team Member

```bash
POST /api/teams/{teamId}/members
Content-Type: application/json

{
  "email": "trader@example.com",
  "role": "trader",
  "permissions": ["create_ads", "manage_orders"]
}
```

## 🔒 Security

### Authentication & Authorization

- **OAuth 2.0** - Exchange-native authentication
- **JWT Tokens** - Secure session management
- **Row-Level Security** - Database-level access control
- **RBAC** - Role-based access control for teams

### Data Protection

- **Encryption at Rest** - All sensitive data encrypted
- **Encryption in Transit** - TLS 1.3 for all connections
- **Key Management** - Secure key storage and rotation
- **PII Protection** - Personal data anonymization

### API Security

- **Rate Limiting** - Prevent API abuse
- **Input Validation** - Comprehensive request validation
- **CORS Protection** - Cross-origin request protection
- **CSRF Protection** - Cross-site request forgery prevention

### Audit & Compliance

- **Activity Logging** - Complete audit trail
- **Access Monitoring** - Real-time access monitoring
- **Compliance Reports** - Automated compliance reporting
- **Data Retention** - Configurable data retention policies

### Security Best Practices

1. **API Keys** - Never expose API keys in client-side code
2. **Environment Variables** - Use secure environment variable management
3. **Database Security** - Enable Row-Level Security (RLS) policies
4. **Network Security** - Use HTTPS for all communications
5. **Regular Updates** - Keep all dependencies updated

## 🤝 Contributing

We welcome contributions from the community! Here's how to get started:

### Development Setup

1. **Fork the Repository**

```bash
git fork https://github.com/yourusername/p2p-automation-platform.git
```

2. **Create Feature Branch**

```bash
git checkout -b feature/your-feature-name
```

3. **Install Dependencies**

```bash
npm install
```

4. **Setup Development Environment**

```bash
cp .env.example .env.local
# Configure your environment variables
```

### Code Standards

- **TypeScript** - Strict type checking enabled
- **ESLint** - Follow the configured linting rules
- **Prettier** - Code formatting standards
- **Testing** - Write tests for new features

### Commit Guidelines

Follow conventional commit format:

```bash
feat: add Binance exchange integration
fix: resolve M-Pesa webhook timeout issue
docs: update API documentation
test: add unit tests for payment service
```

### Pull Request Process

1. **Create Pull Request** with clear description
2. **Code Review** - Ensure code quality and standards
3. **Testing** - All tests must pass
4. **Documentation** - Update relevant documentation
5. **Approval** - Get approval from maintainers

### Reporting Issues

Use GitHub issues to report bugs or request features:

- **Bug Reports** - Include steps to reproduce
- **Feature Requests** - Describe the use case and benefit
- **Documentation** - Report unclear or missing documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation

- **API Reference** - [docs.yourapp.com/api](https://docs.yourapp.com/api)
- **User Guide** - [docs.yourapp.com/guide](https://docs.yourapp.com/guide)
- **Video Tutorials** - [youtube.com/@yourapp](https://youtube.com/@yourapp)

### Community

- **Discord** - [discord.gg/yourapp](https://discord.gg/yourapp)
- **Telegram** - [t.me/yourapp](https://t.me/yourapp)
- **Twitter** - [@yourapp](https://twitter.com/yourapp)

### Commercial Support

For enterprise support and custom development:

- **Email** - enterprise@yourapp.com
- **Website** - [yourapp.com/enterprise](https://yourapp.com/enterprise)

## 🎯 Roadmap

### Q1 2025

- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Additional exchange integrations
- [ ] Advanced risk management

### Q2 2025

- [ ] AI-powered pricing optimization
- [ ] Multi-language support
- [ ] Advanced team collaboration features
- [ ] Institutional trading features

### Q3 2025

- [ ] DeFi protocol integrations
- [ ] Cross-chain trading support
- [ ] Advanced reporting and analytics
- [ ] Compliance automation

### Q4 2025

- [ ] Machine learning trading bots
- [ ] Advanced risk management
- [ ] Multi-region deployment
- [ ] Enterprise SSO integration

## 🙏 Acknowledgments

- **Supabase** - Database and authentication platform
- **Vercel** - Deployment and hosting platform
- **shadcn/ui** - Beautiful UI components
- **OKX, Binance, Bybit** - Exchange APIs and documentation
- **M-Pesa, I&M Bank** - Payment processing APIs

---

Built with ❤️ by the P2P Automation Platform team.

**Ready to scale your P2P trading operations?** Get started with our comprehensive platform today!
