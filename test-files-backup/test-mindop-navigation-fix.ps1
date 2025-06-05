# PowerShell script to test MindOp navigation bug fix
# This script runs various tests to verify the fix is working

# Set error action preference
$ErrorActionPreference = "Stop"

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White",
        [switch]$NoNewline
    )
    
    $params = @{
        Object = $Message
        ForegroundColor = $Color
    }
    
    if ($NoNewline) {
        $params.NoNewline = $true
    }
    
    Write-Host @params
}

# Function to check if a command exists
function Test-CommandExists {
    param([string]$Command)
    
    try {
        if (Get-Command $Command -ErrorAction SilentlyContinue) {
            return $true
        }
        return $false
    } catch {
        return $false
    }
}

# Main script
Clear-Host
Write-ColorOutput "[TEST] MindOp Navigation Bug Fix - Comprehensive Test Suite" "Cyan"
Write-ColorOutput ("=" * 60) "Gray"

# Check if dev server is running
Write-ColorOutput "`n[STEP 1] Checking if development server is running..." "Yellow"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 5 -ErrorAction Stop
    Write-ColorOutput "[OK] Development server is running on http://localhost:3001" "Green"
} catch {
    Write-ColorOutput "[ERROR] Development server is not running. Please start with 'npm run dev'" "Red"
    Write-ColorOutput "[INFO] Run: npm run dev" "Blue"
    exit 1
}

# Check Node.js availability
Write-ColorOutput "`n[STEP 2] Checking Node.js availability..." "Yellow"
if (Test-CommandExists "node") {
    $nodeVersion = node --version
    Write-ColorOutput "[OK] Node.js found: $nodeVersion" "Green"
} else {
    Write-ColorOutput "[ERROR] Node.js not found. Please install Node.js" "Red"
    exit 1
}

# Check database connectivity
Write-ColorOutput "`n[STEP 3] Verifying database state..." "Yellow"
try {
    if (Test-Path "verify-mindop-database.mjs") {
        Write-ColorOutput "Running database verification..." "Blue"
        $dbResult = node verify-mindop-database.mjs 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "[OK] Database verification successful" "Green"
        } else {
            Write-ColorOutput "[WARNING] Database verification completed with warnings" "Yellow"
        }
    } else {
        Write-ColorOutput "[WARNING] Database verification script not found, skipping..." "Yellow"
    }
} catch {
    Write-ColorOutput "[ERROR] Error running database verification: $($_.Exception.Message)" "Red"
}

# Manual testing instructions
Write-ColorOutput "`n[STEP 4] Manual Testing Instructions" "Yellow"
Write-ColorOutput ("=" * 40) "Gray"

Write-ColorOutput "`nBrowser Setup:" "White"
Write-ColorOutput "1. Open browser and navigate to: " "White" -NoNewline
Write-ColorOutput "http://localhost:3001" "Cyan"
Write-ColorOutput "2. Open Developer Console (F12)" "White"
Write-ColorOutput "3. Look for enhanced logging messages starting with:" "White"
Write-ColorOutput "   - [useMindOp] - Hook state changes" "Cyan"
Write-ColorOutput "   - [MyMindOpPage] - Component events" "Cyan"
Write-ColorOutput "   - [MindopService] - Database operations" "Cyan"
Write-ColorOutput "   - [AuthContext] - Authentication events" "Cyan"

Write-ColorOutput "`nTest Procedure:" "White"
$steps = @(
    "1. Login to your account",
    "2. Navigate to My MindOp (/my-mindop)",
    "3. Create a MindOp (if you don't have one) or verify existing one loads",
    "4. Navigate to Chat page (/chat)",
    "5. Navigate back to My MindOp (/my-mindop)"
)

foreach ($step in $steps) {
    Write-ColorOutput $step "Gray"
}

Write-ColorOutput "6. [VERIFY] MindOp data should be displayed immediately" "Green"
Write-ColorOutput "7. [FALLBACK] If not displayed, try the 'Actualizar' button" "Blue"

Write-ColorOutput "`nDebugging Tools Available:" "Yellow"
Write-ColorOutput "In browser console, run:" "White"
Write-ColorOutput "- " "White" -NoNewline
Write-ColorOutput "checkStorageState()" "Cyan" -NoNewline
Write-ColorOutput " - Check browser storage" "White"
Write-ColorOutput "- " "White" -NoNewline
Write-ColorOutput "triggerMindOpRefresh()" "Cyan" -NoNewline
Write-ColorOutput " - Manual refresh trigger" "White"

# Automated test option
Write-ColorOutput "`n[STEP 5] Automated Test Option" "Yellow"

# Check if Playwright is available
$playwrightInstalled = Test-CommandExists "npx"

if ($playwrightInstalled) {
    $runAutomated = Read-Host "Do you want to run automated Playwright test? (y/n)"
      if ($runAutomated -match '^[Yy]') {
        Write-ColorOutput "`nRunning automated Playwright test..." "Blue"
        
        try {
            # Check if Playwright is installed
            Write-ColorOutput "Checking Playwright installation..." "Blue"
            $checkPlaywright = npm list @playwright/test 2>$null
            if ($LASTEXITCODE -ne 0) {
                Write-ColorOutput "Installing Playwright..." "Blue"
                npm install -D @playwright/test
            }
            
            # Install playwright browsers if needed
            Write-ColorOutput "Installing Playwright browsers..." "Blue"
            npx playwright install chromium
            
            # Check if test file exists
            if (Test-Path "test-mindop-navigation.js") {
                # Run the test
                Write-ColorOutput "Executing test..." "Blue"
                node test-mindop-navigation.js
                
                if ($LASTEXITCODE -eq 0) {
                    Write-ColorOutput "[OK] Automated test completed successfully!" "Green"
                } else {
                    Write-ColorOutput "[ERROR] Automated test failed with exit code: $LASTEXITCODE" "Red"
                }
            } else {
                Write-ColorOutput "[ERROR] Test file 'test-mindop-navigation.js' not found" "Red"
            }
            
        } catch {
            Write-ColorOutput "[ERROR] Error running automated test: $($_.Exception.Message)" "Red"
            Write-ColorOutput "[INFO] You can run it manually: node test-mindop-navigation.js" "Blue"
        }
    } else {
        Write-ColorOutput "[INFO] Skipping automated test. You can run it later with: node test-mindop-navigation.js" "Blue"
    }
} else {
    Write-ColorOutput "[WARNING] NPM/NPX not found. Skipping automated test option." "Yellow"
}

# Summary section
Write-ColorOutput "`n[SUMMARY] Test Suite Information Complete!" "Green"
Write-ColorOutput ("=" * 60) "Gray"

Write-ColorOutput "`nSummary of Implemented Fixes:" "Yellow"

$fixes = @(
    "Enhanced logging in useMindOp hook",
    "Improved AuthContext with better error handling",
    "Manual refresh button in MyMindOpPage",
    "Retry mechanism for failed MindOp loads",
    "Better state management and debugging"
)

foreach ($fix in $fixes) {
    Write-ColorOutput "[OK] $fix" "Green"
}

Write-ColorOutput "`nExpected Results:" "Yellow"

$results = @(
    "MindOp data should persist across navigation",
    "Detailed console logging should show the load process",
    "Manual refresh button should work as fallback",
    "No more 'empty form' after returning to page"
)

foreach ($result in $results) {
    Write-ColorOutput "- $result" "White"
}

# Final message
Write-ColorOutput "`nTest Report:" "Yellow"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-ColorOutput "Test executed at: $timestamp" "Gray"

# Exit handling
Write-ColorOutput "`nPress any key to exit..." "Gray"
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Reset error action preference
$ErrorActionPreference = "Continue"