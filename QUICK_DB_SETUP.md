# Quick Start Guide: Mock to Supabase Migration

This guide shows you how to quickly start testing with your local Supabase instance while keeping the ability to fall back to mock data.

## 🚀 Quick Start

### 1. Start Local Supabase (5 minutes)

```bash
# Start Supabase services
cd d:\p2p-automation-platform
supabase start

# Note the output - you'll need the anon key and URL
```

### 2. Configure Environment

Create `.env.local`:

```env
# Supabase Local Development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-supabase-start

# Feature Flags
NEXT_PUBLIC_USE_MOCK_DATA=false  # Set to true to use mock data
NEXT_PUBLIC_ENVIRONMENT=development
```

### 3. Apply Database Schema

```bash
# Reset and apply schema
supabase db reset

# Or run individual migration files
psql -h localhost -p 54322 -U postgres -d postgres -f scripts/001-initial-schema.sql
```

### 4. Test Both Modes

```typescript
// In any component or page
import { serviceFactory } from "@/lib/services/service-factory";

// Check current mode
const healthCheck = await serviceFactory.healthCheck();
console.log("Current mode:", healthCheck.mode); // 'mock' or 'live'

// Switch modes (development only)
await serviceFactory.switchToMockData(); // Use mock data
await serviceFactory.switchToLiveData(); // Use Supabase

// Get services (automatically uses correct mode)
const { adService, teamService, userService } = serviceFactory.getServices();

// Use services (same interface for both mock and live)
const ads = await adService.getAllAds();
const teams = await teamService.getAllTeams();
const user = await userService.getCurrentUser();
```

## 🔄 Service Layer Benefits

### Same Interface, Different Implementation

```typescript
// This code works the same whether using mock or Supabase
const adService = serviceFactory.getAdService();

// Create an ad
const newAd = await adService.createAd(
  {
    exchange: "okx",
    side: "buy",
    cryptocurrency: "USDT",
    // ... other properties
  },
  userId,
  teamId
);

// Get filtered ads
const filteredAds = await adService.getFilteredAds({
  teamId: "team-123",
  status: "active",
  exchange: "okx",
});

// Get statistics
const stats = await adService.getTeamAdStats("team-123");
```

### Development Workflow

1. **Start with Mock Data**: Fast development, no database setup needed
2. **Test with Supabase**: Verify real database behavior
3. **Compare Results**: Ensure both implementations work correctly
4. **Production Ready**: Easy to switch to production Supabase

## 🧪 Testing Scenarios

### Test User Registration and Teams

```typescript
const userService = serviceFactory.getUserService();
const teamService = serviceFactory.getTeamService();

// Get current user
const user = await userService.getCurrentUser();

// Create a team
const team = await teamService.createTeam({
  name: "My Test Team",
  description: "Testing with Supabase",
  owner_id: user.id,
});

// Invite a member
const invitation = await teamService.inviteUserByEmail(
  team.id,
  "test@example.com",
  "member",
  user.id
);
```

### Test Ad Management

```typescript
const adService = serviceFactory.getAdService();

// Create an ad
const ad = await adService.createAd(
  {
    exchange: "okx",
    side: "buy",
    cryptocurrency: "USDT",
    fiatCurrency: "USD",
    unitPrice: "1.00",
    availableAmount: "1000",
    minOrderSize: "100",
    maxOrderSize: "500",
    paymentMethods: ["Bank Transfer", "PayPal"],
  },
  user.id,
  team.id
);

// Update ad
const updatedAd = await adService.updateAd(ad.id, {
  unitPrice: "1.01",
  status: "active",
});

// Get team statistics
const stats = await adService.getTeamAdStats(team.id);
console.log("Team stats:", stats);
```

## 🔧 Development Tools

### Supabase Studio

- URL: http://localhost:54323
- Browse tables, run queries, manage data
- Real-time data monitoring

### Database Direct Access

```bash
# Connect with psql
psql -h localhost -p 54322 -U postgres -d postgres

# Or use any PostgreSQL client
# Host: localhost
# Port: 54322
# User: postgres
# Password: postgres
# Database: postgres
```

### Service Health Check

```typescript
// Check service status
const health = await serviceFactory.healthCheck();
console.log("Services status:", health);

// Returns:
// {
//   mode: 'mock' | 'live',
//   services: {
//     ad: boolean,
//     team: boolean,
//     user: boolean
//   },
//   timestamp: string
// }
```

## 🐛 Troubleshooting

### Common Issues

1. **Supabase not starting**:

   - Run `supabase stop` then `supabase start`
   - Check Docker is running

2. **Database schema issues**:

   - Run `supabase db reset` to restart fresh
   - Check migration files in `scripts/` folder

3. **Environment variables not loading**:

   - Restart Next.js development server
   - Check `.env.local` file exists

4. **Service factory errors**:
   - Check `NEXT_PUBLIC_USE_MOCK_DATA` environment variable
   - Verify all service files exist

### Debug Mode

```typescript
// Enable detailed logging (development only)
if (process.env.NODE_ENV === "development") {
  // Add debug logging to service calls
  const originalGetAds = adService.getAllAds;
  adService.getAllAds = async function () {
    console.log(
      "🔍 Getting all ads via",
      serviceFactory.isUsingMockData() ? "Mock" : "Supabase"
    );
    const result = await originalGetAds.call(this);
    console.log("📊 Retrieved", result.length, "ads");
    return result;
  };
}
```

## 📈 Next Steps

1. **Immediate**: Start local Supabase and test basic operations
2. **Short-term**: Implement Supabase service classes (next phase)
3. **Medium-term**: Add real-time subscriptions and advanced features
4. **Long-term**: Deploy to production Supabase instance

This setup gives you the flexibility to develop rapidly with mocks while testing realistic scenarios with a real database!
