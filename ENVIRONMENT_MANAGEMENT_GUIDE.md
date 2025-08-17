# Environment Management Guide

## Overview

This guide explains the comprehensive environment management system that handles three distinct modes:

- **Mock Mode**: Uses mock data and bypasses authentication for rapid development
- **Local Mode**: Uses local Supabase instance for development with real database
- **Production Mode**: Uses live Supabase instance for production deployment

## Environment Detection

The system automatically detects the environment based on these factors:

### 1. Mock Mode Detection

```
- NEXT_PUBLIC_USE_MOCK_DATA=true, OR
- NEXT_PUBLIC_ENVIRONMENT=mock, OR
- No Supabase configuration found
```

### 2. Local Mode Detection

```
- NEXT_PUBLIC_ENVIRONMENT=local, OR
- NEXT_PUBLIC_SUPABASE_URL contains 'localhost' or '127.0.0.1', OR
- NODE_ENV=development with Supabase config present
```

### 3. Production Mode Detection

```
- NEXT_PUBLIC_ENVIRONMENT=production, OR
- NODE_ENV=production, OR
- NEXT_PUBLIC_SUPABASE_URL is external (not localhost)
```

## Environment Files Setup

### For Mock Development (.env.local)

```env
# Mock Mode Configuration
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_ENVIRONMENT=mock

# Optional: Still include Supabase URLs for easy switching
NEXT_PUBLIC_SUPABASE_URL=http://localhost:55321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
```

### For Local Supabase Development (.env.local)

```env
# Local Development Configuration
NEXT_PUBLIC_ENVIRONMENT=local
NEXT_PUBLIC_USE_MOCK_DATA=false

# Local Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:55321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional debugging
NEXT_PUBLIC_SHOW_ENV_DEBUG=true
```

### For Production (.env.production)

```env
# Production Configuration
NEXT_PUBLIC_ENVIRONMENT=production
NODE_ENV=production

# Production Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

## Using the Environment Manager

### Basic Usage

```typescript
import {
  environmentManager,
  getEnvironmentMode,
  isMockMode,
} from "@/lib/config/environment";

// Check current mode
const mode = getEnvironmentMode(); // 'mock' | 'local' | 'production'
const isUsingMock = isMockMode(); // boolean

// Get configuration for current environment
const config = environmentManager.getConfig();
console.log("Database URL:", config.database.url);
console.log("Auth required:", config.auth.required);
```

### Service Factory Integration

The ServiceFactory automatically uses the environment manager:

```typescript
import { serviceFactory } from "@/lib/services/service-factory";

// Automatically returns correct service based on environment
const adService = serviceFactory.getAdService();
const teamService = serviceFactory.getTeamService();
const userService = serviceFactory.getUserService();

// Check what mode we're in
console.log("Environment:", serviceFactory.getEnvironmentMode());
console.log("Using mock data:", serviceFactory.isUsingMockData());
```

### Manual Environment Switching (Development Only)

```typescript
// Switch to mock mode
await serviceFactory.switchToMockData();

// Switch to local Supabase
await serviceFactory.switchToLocalMode();

// Switch to production (only in development)
await serviceFactory.switchToProductionMode();
```

## Authentication Behavior

### Mock Mode

- **Middleware**: Bypasses all authentication checks
- **Auth Components**: Uses mock authentication (see `useMockAuth` hook)
- **User State**: Simulated user sessions
- **Access**: All routes accessible without login

### Local/Production Mode

- **Middleware**: Full Supabase authentication enforcement
- **Auth Components**: Real Supabase auth flows
- **User State**: Actual Supabase user sessions
- **Access**: Routes protected based on authentication status

## Service Layer Behavior

### Mock Mode Services

- Uses in-memory data structures
- Simulates API delays and responses
- Perfect for UI development and testing
- No external dependencies

### Supabase Services (Local/Production)

- Connects to actual Supabase instance
- Real database operations
- Actual authentication and authorization
- Full feature testing

## Development Workflows

### 1. Starting with Mock Data

```bash
# Set environment to mock
echo "NEXT_PUBLIC_USE_MOCK_DATA=true" > .env.local
npm run dev
```

### 2. Switching to Local Supabase

```bash
# Start local Supabase
npx supabase start

# Update environment
echo "NEXT_PUBLIC_ENVIRONMENT=local" > .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=http://localhost:55321" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key" >> .env.local

# Restart development server
npm run dev
```

### 3. Preparing for Production

```bash
# Build with production environment
npm run build

# Or deploy with proper environment variables
vercel deploy --env NEXT_PUBLIC_ENVIRONMENT=production
```

## Debugging and Monitoring

### Environment Debug Information

```typescript
import { environmentManager } from "@/lib/config/environment";

// Get comprehensive debug info
const debugInfo = environmentManager.getDebugInfo();
console.log("Environment Debug:", debugInfo);

// Check service health across all modes
const healthCheck = await serviceFactory.healthCheck();
console.log("Service Health:", healthCheck);
```

### Debug Console Output

When `NEXT_PUBLIC_SHOW_ENV_DEBUG=true`:

- Environment detection logging
- Service instantiation notifications
- Authentication flow information
- Mode switching confirmations

## Migration Steps from Previous System

### 1. Update Service Usage

**Before:**

```typescript
const factory = ServiceFactory.getInstance();
factory.setUseMockData(true);
const service = factory.getAdService();
```

**After:**

```typescript
import { serviceFactory } from "@/lib/services/service-factory";
// Automatically detects environment - no manual setup needed
const service = serviceFactory.getAdService();
```

### 2. Update Environment Variables

Replace simple boolean flags with comprehensive environment configuration:

**Before:**

```env
NEXT_PUBLIC_USE_MOCK_DATA=true
```

**After:**

```env
NEXT_PUBLIC_ENVIRONMENT=mock
NEXT_PUBLIC_SUPABASE_URL=http://localhost:55321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 3. Update Authentication Logic

The middleware now automatically handles all three modes - no changes needed in components.

## Best Practices

### 1. Environment-Specific Configuration

- Use appropriate `.env` files for each environment
- Never commit production secrets
- Use different Supabase projects for local/production

### 2. Service Testing

- Test UI components in mock mode first
- Validate business logic with local Supabase
- Final testing in production environment

### 3. Deployment Strategy

- Mock mode: Development and prototyping
- Local mode: Feature development and integration testing
- Production mode: Staging and live environments

### 4. Debugging

- Enable debug mode in development: `NEXT_PUBLIC_SHOW_ENV_DEBUG=true`
- Use health check endpoint to validate service connectivity
- Monitor console logs for environment detection issues

## Troubleshooting

### Environment Not Detected Correctly

1. Check environment variable values
2. Verify Supabase URL format
3. Clear Next.js cache: `rm -rf .next`
4. Restart development server

### Services Not Working

1. Run health check: `serviceFactory.healthCheck()`
2. Verify Supabase connection (local mode)
3. Check authentication state
4. Validate environment configuration

### Authentication Issues

1. Verify middleware is running correctly
2. Check Supabase client configuration
3. Validate session state in browser dev tools
4. Ensure proper redirect URLs in Supabase dashboard

## Summary

This environment management system provides:

- ✅ Automatic environment detection
- ✅ Seamless service switching
- ✅ Environment-aware authentication
- ✅ Comprehensive debugging tools
- ✅ Production-ready configuration
- ✅ Backward compatibility with existing code

The system ensures your application works correctly across all development stages, from initial prototyping with mock data to production deployment with live services.
