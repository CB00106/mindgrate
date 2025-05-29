# PowerShell script para gestionar Supabase Edge Functions
# Usage: .\manage-functions.ps1 [command]

param(
    [Parameter(Position=0)]
    [ValidateSet("serve", "deploy", "logs", "test", "help")]
    [string]$Command = "help"
)

$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host "🚀 Supabase Edge Functions Manager" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Available commands:" -ForegroundColor Yellow
    Write-Host "  serve   - Serve functions locally"
    Write-Host "  deploy  - Deploy mindop-service function"
    Write-Host "  logs    - Show function logs"
    Write-Host "  test    - Run test script"
    Write-Host "  help    - Show this help"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\manage-functions.ps1 serve"
    Write-Host "  .\manage-functions.ps1 deploy"
    Write-Host "  .\manage-functions.ps1 logs"
}

function Test-SupabaseCLI {
    try {
        $version = supabase --version
        Write-Host "✅ Supabase CLI found: $version" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
        Write-Host "   npm install -g supabase" -ForegroundColor Yellow
        return $false
    }
}

function Test-Environment {
    if (!(Test-Path ".env")) {
        Write-Host "⚠️  .env file not found. Creating from template..." -ForegroundColor Yellow
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host "✅ Created .env file. Please configure your environment variables." -ForegroundColor Green
        }
        else {
            Write-Host "❌ .env.example not found. Please create .env manually." -ForegroundColor Red
            return $false
        }
    }
    
    if (!(Test-Path "supabase/functions/mindop-service/index.ts")) {
        Write-Host "❌ Edge function not found at supabase/functions/mindop-service/index.ts" -ForegroundColor Red
        return $false
    }
    
    Write-Host "✅ Environment check passed" -ForegroundColor Green
    return $true
}

function Serve-Functions {
    Write-Host "🔄 Starting Supabase Edge Functions locally..." -ForegroundColor Cyan
    
    if (!(Test-SupabaseCLI) -or !(Test-Environment)) {
        exit 1
    }
    
    try {
        Write-Host "📍 Functions will be available at: http://localhost:54321/functions/v1/" -ForegroundColor Green
        Write-Host "🔧 Press Ctrl+C to stop the server" -ForegroundColor Yellow
        Write-Host ""
        
        supabase functions serve --env-file .env
    }
    catch {
        Write-Host "❌ Failed to start functions server: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

function Deploy-Function {
    Write-Host "🚀 Deploying mindop-service function..." -ForegroundColor Cyan
    
    if (!(Test-SupabaseCLI)) {
        exit 1
    }
    
    try {
        Write-Host "📤 Uploading function to Supabase..." -ForegroundColor Yellow
        
        supabase functions deploy mindop-service
        
        Write-Host "✅ Function deployed successfully!" -ForegroundColor Green
        Write-Host "📍 Function URL: https://khzbklcvmlkhrraibksx.supabase.co/functions/v1/mindop-service" -ForegroundColor Cyan
    }
    catch {
        Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

function Show-Logs {
    Write-Host "📋 Fetching function logs..." -ForegroundColor Cyan
    
    if (!(Test-SupabaseCLI)) {
        exit 1
    }
    
    try {
        supabase functions logs mindop-service
    }
    catch {
        Write-Host "❌ Failed to fetch logs: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

function Run-Test {
    Write-Host "🧪 Running Edge Function tests..." -ForegroundColor Cyan
    
    if (!(Test-Path "supabase/functions/test-edge-function.mjs")) {
        Write-Host "❌ Test script not found" -ForegroundColor Red
        exit 1
    }
    
    $token = Read-Host "Enter your JWT token (or press Enter to skip)"
    
    if ($token) {
        try {
            Write-Host "🔄 Running test with provided token..." -ForegroundColor Yellow
            node "supabase/functions/test-edge-function.mjs" $token
        }
        catch {
            Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "ℹ️  To get a JWT token:" -ForegroundColor Blue
        Write-Host "   1. Login to your app at http://localhost:3004" -ForegroundColor Gray
        Write-Host "   2. Open browser dev tools (F12)" -ForegroundColor Gray
        Write-Host "   3. Go to Application > Local Storage" -ForegroundColor Gray
        Write-Host "   4. Copy the 'sb-*-auth-token' value" -ForegroundColor Gray
    }
}

# Main execution
switch ($Command.ToLower()) {
    "serve" { Serve-Functions }
    "deploy" { Deploy-Function }
    "logs" { Show-Logs }
    "test" { Run-Test }
    "help" { Show-Help }
    default { 
        Write-Host "❌ Unknown command: $Command" -ForegroundColor Red
        Show-Help
        exit 1
    }
}
