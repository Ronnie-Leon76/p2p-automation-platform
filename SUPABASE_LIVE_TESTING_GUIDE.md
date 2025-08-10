# 🚀 Live Testing with Local Supabase - Complete Guide

## 📋 Current Status

✅ **What's Ready:**

- Local Supabase configuration (`supabase/config.toml`)
- Database schema files (`scripts/*.sql`)
- Service layer architecture with interfaces
- Mock services implementation
- Service factory for switching between mock/live data
- Development helper script

⏳ **What's Next:**

- Implement Supabase service classes
- Test real database operations
- Add real-time subscriptions

## 🎯 Quick Start (15 minutes)

### Step 1: Start Supabase

```bash
# Use the helper script
node scripts/dev-helper.js --start-supabase

# Or manually
supabase start
```

### Step 2: Configure Environment

```bash
# Update .env.local with keys from supabase start output
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
NEXT_PUBLIC_USE_MOCK_DATA=false  # Switch to live data
```

### Step 3: Apply Schema & Seed Data

```bash
node scripts/dev-helper.js --apply-schema
node scripts/dev-helper.js --seed-data
```

### Step 4: Test in Your App

```typescript
import { serviceFactory } from "@/lib/services/service-factory";

// Check current mode
const health = await serviceFactory.healthCheck();
console.log("Mode:", health.mode); // Should show 'live'

// Use services (will use Supabase when implemented)
const adService = serviceFactory.getAdService();
const ads = await adService.getAllAds();
```

## 🔧 Setup Steps

### 1. Start Local Supabase Instance

```bash
# Install Supabase CLI globally (if not already installed)
npm install -g supabase@latest

# Start local Supabase services
cd d:\p2p-automation-platform
supabase start

# This will output connection details including:
# - API URL: http://localhost:54321
# - GraphQL URL: http://localhost:54321/graphql/v1
# - DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# - Studio URL: http://localhost:54323
# - Inbucket URL: http://localhost:54324
# - JWT secret: <your-jwt-secret>
# - anon key: <your-anon-key>
# - service_role key: <your-service-role-key>
```

### 2. Environment Configuration

Create/update your `.env.local` file:

```env
# Supabase Local Development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-local-service-role-key>

# Feature Flags
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_ENVIRONMENT=development

# Development Settings
NEXT_PUBLIC_DEBUG_MODE=true
```

### 3. Database Schema Migration

```bash
# Apply your database schema
supabase db reset

# Or manually run migrations
supabase migration list
supabase migration up
```

### 4. Seed Data (Optional)

```bash
# Create seed data script
supabase seed create initial_data

# Run seed data
supabase seed run
```

## 🏗️ Implementation Strategy

### Phase 1: Dual Mode Setup

- Keep existing mock services as fallback
- Create Supabase service layer
- Use environment variable to switch between modes

### Phase 2: Service Abstraction

- Create interface that both mock and Supabase services implement
- Gradual migration of components

### Phase 3: Live Testing

- Test all CRUD operations with real database
- Verify data persistence and relationships
- Test authentication and authorization

## 🔄 Service Layer Architecture

```
components/
├── ad-management.tsx          # UI Layer
├── team-management.tsx        # UI Layer
└── exchange-settings.tsx      # UI Layer

lib/
├── services/
│   ├── interfaces/            # Service contracts
│   │   ├── ad-service.ts
│   │   ├── team-service.ts
│   │   └── user-service.ts
│   ├── mock/                  # Mock implementations
│   │   ├── mock-ad-service.ts
│   │   ├── mock-team-service.ts
│   │   └── mock-user-service.ts
│   ├── supabase/              # Supabase implementations
│   │   ├── supabase-ad-service.ts
│   │   ├── supabase-team-service.ts
│   │   └── supabase-user-service.ts
│   └── service-factory.ts     # Service provider
└── supabase/
    ├── client.ts
    ├── types.ts
    └── utils.ts
```

## 🧪 Testing Scenarios

### 1. User Authentication

- Register new users
- Login/logout flows
- Session management

### 2. Team Management

- Create teams
- Invite members
- Manage permissions
- Join/leave teams

### 3. Ad Management

- Create P2P ads
- Update ad status
- Filter and search ads
- Team-specific ad visibility

### 4. Exchange Configuration

- Save API credentials
- Test connections
- Manage multiple exchanges

## 📊 Data Migration

### Mock to Supabase Data Structure Mapping

```typescript
// Mock Ad -> Supabase ads table
interface MockAd {
  id: string;
  teamId: string;
  // ... other fields
}

// Maps to Supabase ads table with relationships
interface SupabaseAd {
  id: uuid;
  team_id: uuid; // FK to teams table
  created_by: uuid; // FK to users table
  // ... other fields
}
```

## 🔐 Security Considerations

### 1. RLS (Row Level Security)

- Enable RLS on all tables
- Create policies for team-based access
- User can only access their teams' data

### 2. API Credentials

- Encrypt exchange API keys
- Use Supabase vault for sensitive data
- Implement credential rotation

### 3. Authentication

- Use Supabase Auth
- Implement proper session management
- Add proper RBAC

## 🛠️ Development Tools

### 1. Supabase Studio

- Database management: http://localhost:54323
- Real-time data monitoring
- Query builder and SQL editor

### 2. Database Inspection

```bash
# Connect to local database
psql -h localhost -p 54322 -U postgres -d postgres

# Or use your preferred database client
```

### 3. API Testing

```bash
# Test API endpoints
curl -X GET http://localhost:54321/rest/v1/teams \
  -H "apikey: <your-anon-key>" \
  -H "Authorization: Bearer <user-jwt>"
```

## 🎛️ Feature Flags

Use environment variables to control behavior:

```typescript
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_MODE === "true";

// Service selection
const adService = USE_MOCK_DATA ? new MockAdService() : new SupabaseAdService();
```

## 📈 Migration Checklist

- [ ] Start local Supabase instance
- [ ] Configure environment variables
- [ ] Apply database schema
- [ ] Create service interfaces
- [ ] Implement Supabase services
- [ ] Create service factory
- [ ] Update components to use service factory
- [ ] Test authentication flow
- [ ] Test team management
- [ ] Test ad management
- [ ] Test exchange settings
- [ ] Verify data persistence
- [ ] Test concurrent users
- [ ] Performance testing

## 🚀 Benefits of Local Supabase Testing

1. **Real Database Behavior**: Test actual PostgreSQL constraints and relationships
2. **Authentication Testing**: Test real auth flows and session management
3. **Performance Testing**: Identify bottlenecks with real queries
4. **Data Persistence**: Verify data survives app restarts
5. **Concurrent Testing**: Test multiple users simultaneously
6. **Production Parity**: Local setup matches production environment
7. **Advanced Features**: Test real-time subscriptions, triggers, and functions

## 📝 Next Steps

1. **Immediate**: Start local Supabase and configure environment
2. **Short-term**: Create service interfaces and implement Supabase services
3. **Medium-term**: Migrate all components to use service factory
4. **Long-term**: Add advanced features like real-time updates and triggers

This approach gives you the best of both worlds - fast development with mocks and realistic testing with Supabase!
