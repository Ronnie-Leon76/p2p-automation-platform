#!/usr/bin/env node

/**
 * Development Helper Script
 * Helps transition between mock data and local Supabase testing
 * 
 * Usage:
 * node scripts/dev-helper.js --start-supabase
 * node scripts/dev-helper.js --health-check
 * node scripts/dev-helper.js --seed-data
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DevHelper {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };
    
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async startSupabase() {
    this.log('Starting local Supabase instance...', 'info');
    
    try {
      // Check if Supabase CLI is installed
      execSync('supabase --version', { stdio: 'pipe' });
      this.log('Supabase CLI found', 'success');
    } catch (error) {
      this.log('Supabase CLI not found. Installing...', 'warning');
      execSync('npm install -g supabase@latest', { stdio: 'inherit' });
    }

    try {
      // Start Supabase
      const output = execSync('supabase start', { 
        cwd: this.projectRoot, 
        encoding: 'utf8',
        stdio: 'inherit'
      });
      
      this.log('Supabase started successfully!', 'success');
      this.log('Check output above for connection details', 'info');
      
      // Check if .env.local exists
      const envPath = path.join(this.projectRoot, '.env.local');
      if (!fs.existsSync(envPath)) {
        this.createEnvFile();
      }
      
    } catch (error) {
      this.log('Failed to start Supabase. Make sure Docker is running.', 'error');
      this.log(error.message, 'error');
    }
  }

  createEnvFile() {
    const envPath = path.join(this.projectRoot, '.env.local');
    const envContent = `# Supabase Local Development
# Update these values after running 'supabase start'
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Feature Flags
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_DEBUG_MODE=true

# Development Settings
NODE_ENV=development
`;

    fs.writeFileSync(envPath, envContent);
    this.log('.env.local file created. Please update with your Supabase keys.', 'warning');
  }

  async applySchema() {
    this.log('Applying database schema...', 'info');
    
    try {
      // Reset database with migrations
      execSync('supabase db reset', { 
        cwd: this.projectRoot, 
        stdio: 'inherit' 
      });
      
      this.log('Database schema applied successfully!', 'success');
    } catch (error) {
      this.log('Failed to apply schema', 'error');
      this.log(error.message, 'error');
    }
  }

  async healthCheck() {
    this.log('Performing health check...', 'info');
    
    // Check if Supabase is running
    try {
      const { execSync } = require('child_process');
      execSync('curl -s http://localhost:54321/health', { stdio: 'pipe' });
      this.log('✅ Supabase API is running (http://localhost:54321)', 'success');
    } catch (error) {
      this.log('❌ Supabase API is not responding', 'error');
    }

    // Check if database is accessible
    try {
      execSync('pg_isready -h localhost -p 54322', { stdio: 'pipe' });
      this.log('✅ PostgreSQL is running (localhost:54322)', 'success');
    } catch (error) {
      this.log('❌ PostgreSQL is not accessible', 'error');
    }

    // Check if Studio is accessible
    try {
      execSync('curl -s http://localhost:54323', { stdio: 'pipe' });
      this.log('✅ Supabase Studio is running (http://localhost:54323)', 'success');
    } catch (error) {
      this.log('❌ Supabase Studio is not accessible', 'error');
    }

    // Check environment file
    const envPath = path.join(this.projectRoot, '.env.local');
    if (fs.existsSync(envPath)) {
      this.log('✅ .env.local file exists', 'success');
      
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('your-anon-key-here')) {
        this.log('⚠️  Please update .env.local with actual Supabase keys', 'warning');
      }
    } else {
      this.log('❌ .env.local file missing', 'error');
    }
  }

  async seedData() {
    this.log('Seeding database with test data...', 'info');
    
    // Create a simple seed script
    const seedSQL = `
-- Insert test users
INSERT INTO users (id, email, full_name, created_at) VALUES 
  ('user-1', 'trader1@example.com', 'John Trader', NOW()),
  ('user-2', 'alice@example.com', 'Alice Chen', NOW()),
  ('user-3', 'bob@example.com', 'Bob Wilson', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test teams
INSERT INTO teams (id, name, description, owner_id, created_at) VALUES 
  ('team-1', 'OKX Trading Squad', 'Professional P2P trading team', 'user-1', NOW()),
  ('team-2', 'Binance Pro Team', 'Advanced trading strategies', 'user-2', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert team members
INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES 
  ('team-1', 'user-2', 'admin', NOW()),
  ('team-1', 'user-3', 'member', NOW()),
  ('team-2', 'user-1', 'member', NOW())
ON CONFLICT (team_id, user_id) DO NOTHING;
`;

    const seedPath = path.join(this.projectRoot, 'temp-seed.sql');
    fs.writeFileSync(seedPath, seedSQL);

    try {
      execSync(`psql -h localhost -p 54322 -U postgres -d postgres -f ${seedPath}`, {
        stdio: 'inherit'
      });
      
      this.log('Test data seeded successfully!', 'success');
      
      // Clean up
      fs.unlinkSync(seedPath);
    } catch (error) {
      this.log('Failed to seed data', 'error');
      this.log(error.message, 'error');
      
      // Clean up on error too
      if (fs.existsSync(seedPath)) {
        fs.unlinkSync(seedPath);
      }
    }
  }

  async showUsage() {
    console.log(`
🚀 P2P Automation Platform - Development Helper

Usage: node scripts/dev-helper.js [command]

Commands:
  --start-supabase    Start local Supabase instance
  --apply-schema      Apply database schema/migrations
  --health-check      Check if services are running
  --seed-data         Add test data to database
  --help              Show this help message

Examples:
  node scripts/dev-helper.js --start-supabase
  node scripts/dev-helper.js --health-check
  node scripts/dev-helper.js --seed-data

Quick Start:
  1. node scripts/dev-helper.js --start-supabase
  2. Update .env.local with Supabase keys
  3. node scripts/dev-helper.js --apply-schema
  4. node scripts/dev-helper.js --seed-data
  5. npm run dev

Supabase URLs (when running):
  📊 Studio: http://localhost:54323
  🌐 API: http://localhost:54321
  🗄️  Database: postgresql://postgres:postgres@localhost:54322/postgres
`);
  }
}

// Main execution
async function main() {
  const devHelper = new DevHelper();
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    await devHelper.showUsage();
    return;
  }

  if (args.includes('--start-supabase')) {
    await devHelper.startSupabase();
  }

  if (args.includes('--apply-schema')) {
    await devHelper.applySchema();
  }

  if (args.includes('--health-check')) {
    await devHelper.healthCheck();
  }

  if (args.includes('--seed-data')) {
    await devHelper.seedData();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DevHelper;
