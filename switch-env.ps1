#!/usr/bin/env pwsh
# PowerShell script to switch between local and ngrok environments

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("local", "ngrok")]
    [string]$Environment
)

$envLocal = ".env.local"
$envNgrok = ".env.ngrok"
$envBackup = ".env.backup"

switch ($Environment) {
    "local" {
        Write-Host "🏠 Switching to LOCAL environment..." -ForegroundColor Green
        
        # Backup current .env.local
        if (Test-Path $envLocal) {
            Copy-Item $envLocal $envBackup -Force
            Write-Host "📋 Backed up current .env.local to .env.backup" -ForegroundColor Yellow
        }
        
        # Create local environment file
        @"
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=local

# Supabase Local Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOEoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# OKX API Configuration
OKX_API_KEY=your_okx_api_key
OKX_SECRET_KEY=your_okx_secret_key
OKX_PASSPHRASE=your_okx_passphrase
OKX_API_URL=https://www.okx.com

# NextAuth Secret
NEXTAUTH_SECRET=your_nextauth_secret_key
"@ | Out-File -FilePath $envLocal -Encoding UTF8
        
        Write-Host "✅ Switched to LOCAL environment" -ForegroundColor Green
        Write-Host "🔗 App will run on: http://localhost:3000" -ForegroundColor Cyan
    }
    
    "ngrok" {
        Write-Host "🌐 Switching to NGROK environment..." -ForegroundColor Green
        
        # Check if ngrok env file exists
        if (!(Test-Path $envNgrok)) {
            Write-Host "❌ .env.ngrok file not found! Creating template..." -ForegroundColor Red
            
            @"
NEXTAUTH_URL=https://working-ghoul-holy.ngrok-free.app
NEXT_PUBLIC_APP_URL=https://working-ghoul-holy.ngrok-free.app
NEXT_PUBLIC_ENVIRONMENT=ngrok

# IMPORTANT: Update these URLs based on your ngrok setup
# Option 1: Use cloud Supabase (recommended)
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Option 2: Use ngrok tunnel for local Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-db-tunnel.ngrok-free.app
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOEoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# OKX API Configuration
OKX_API_KEY=your_okx_api_key
OKX_SECRET_KEY=your_okx_secret_key
OKX_PASSPHRASE=your_okx_passphrase
OKX_API_URL=https://www.okx.com

# NextAuth Secret
NEXTAUTH_SECRET=your_nextauth_secret_key
"@ | Out-File -FilePath $envNgrok -Encoding UTF8
            
            Write-Host "📝 Created .env.ngrok template. Please update with your actual values!" -ForegroundColor Yellow
        }
        
        # Backup current .env.local
        if (Test-Path $envLocal) {
            Copy-Item $envLocal $envBackup -Force
            Write-Host "📋 Backed up current .env.local to .env.backup" -ForegroundColor Yellow
        }
        
        # Copy ngrok environment to .env.local
        Copy-Item $envNgrok $envLocal -Force
        
        Write-Host "✅ Switched to NGROK environment" -ForegroundColor Green
        Write-Host "🔗 App will be accessible via: https://working-ghoul-holy.ngrok-free.app" -ForegroundColor Cyan
        Write-Host "⚠️ Make sure to update database URLs in .env.ngrok!" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Current environment configuration:" -ForegroundColor White
Get-Content $envLocal | Select-String "NEXTAUTH_URL|NEXT_PUBLIC_APP_URL|NEXT_PUBLIC_ENVIRONMENT|NEXT_PUBLIC_SUPABASE_URL" | ForEach-Object { 
    Write-Host "  $_" -ForegroundColor Gray 
}
