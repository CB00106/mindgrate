# Test Complete Authentication Fixes
# Validates that all pages are protected against auth race conditions

Write-Host "🧪 Testing Complete Authentication Fixes" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a file contains auth loading protection
function Test-AuthProtection {
    param(
        [string]$FilePath,
        [string]$PageName
    )
    
    Write-Host "🔍 Testing $PageName..." -ForegroundColor Yellow
    
    if (!(Test-Path $FilePath)) {
        Write-Host "  ❌ File not found: $FilePath" -ForegroundColor Red
        return $false
    }
    
    $content = Get-Content $FilePath -Raw
    $hasLoading = $false
    $hasProtection = $false
    
    # Check if page uses loading state from useAuth
    if ($content -match "loading:\s*authLoading.*useAuth\(\)") {
        $hasLoading = $true
        Write-Host "  ✅ Uses loading state from useAuth" -ForegroundColor Green
    } elseif ($content -match "loading.*useAuth\(\)") {
        $hasLoading = $true
        Write-Host "  ✅ Uses loading state from useAuth" -ForegroundColor Green
    }
    
    # Check for auth stabilization protection
    if ($content -match "if.*authLoading.*\{.*auth.*stabiliz" -or 
        $content -match "CRITICAL.*Wait.*auth.*stabiliz") {
        $hasProtection = $true
        Write-Host "  ✅ Has auth stabilization protection" -ForegroundColor Green
    }
    
    if (!$hasLoading) {
        Write-Host "  ⚠️  Missing loading state from useAuth" -ForegroundColor Yellow
    }
    
    if (!$hasProtection) {
        Write-Host "  ⚠️  Missing auth stabilization protection" -ForegroundColor Yellow
    }
    
    $success = $hasLoading -and $hasProtection
    if ($success) {
        Write-Host "  ✅ $PageName is properly protected" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $PageName needs protection improvements" -ForegroundColor Red
    }
    
    Write-Host ""
    return $success
}

# Test all critical pages
$results = @{}

Write-Host "Testing pages for auth race condition protection..." -ForegroundColor Blue
Write-Host ""

# Core pages that need protection
$pages = @{
    "ChatPage" = "src\pages\ChatPage.tsx"
    "MyMindOpPage" = "src\pages\MyMindOpPage.tsx"
    "SearchPage" = "src\pages\SearchPage.tsx"
    "NotificationsPage" = "src\pages\NotificationsPage.tsx"
}

foreach ($page in $pages.GetEnumerator()) {
    $results[$page.Key] = Test-AuthProtection -FilePath $page.Value -PageName $page.Key
}

Write-Host "Testing Auth Context improvements..." -ForegroundColor Blue
Write-Host ""

# Test AuthContext
Write-Host "🔍 Testing AuthContext..." -ForegroundColor Yellow
$authContextPath = "src\contexts\AuthContext.tsx"
if (Test-Path $authContextPath) {
    $authContent = Get-Content $authContextPath -Raw
    
    if ($authContent -match "autoRefreshToken:\s*true") {
        Write-Host "  ✅ autoRefreshToken is enabled" -ForegroundColor Green
    } else {
        Write-Host "  ❌ autoRefreshToken should be true" -ForegroundColor Red
    }
    
    if ($authContent -match "initialized.*useState.*false") {
        Write-Host "  ✅ Has initialized state management" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Missing initialized state" -ForegroundColor Yellow
    }
    
    if ($authContent -match "INITIAL_SESSION.*SIGNED_IN.*SIGNED_OUT.*TOKEN_REFRESHED") {
        Write-Host "  ✅ Handles comprehensive auth events" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Missing comprehensive auth event handling" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ❌ AuthContext not found" -ForegroundColor Red
}

Write-Host ""

# Test supabaseClient
Write-Host "🔍 Testing supabaseClient..." -ForegroundColor Yellow
$supabaseClientPath = "src\services\supabaseClient.ts"
if (Test-Path $supabaseClientPath) {
    $supabaseContent = Get-Content $supabaseClientPath -Raw
    
    if ($supabaseContent -match "autoRefreshToken:\s*true") {
        Write-Host "  ✅ autoRefreshToken is enabled in supabaseClient" -ForegroundColor Green
    } else {
        Write-Host "  ❌ autoRefreshToken should be true in supabaseClient" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ supabaseClient not found" -ForegroundColor Red
}

Write-Host ""

# Test useMindOp hook
Write-Host "🔍 Testing useMindOp hook..." -ForegroundColor Yellow
$useMindOpPath = "src\hooks\useMindOp.ts"
if (Test-Path $useMindOpPath) {
    $mindOpContent = Get-Content $useMindOpPath -Raw
    
    if ($mindOpContent -match "loading.*authLoading.*AuthContext") {
        Write-Host "  ✅ Uses AuthContext loading state instead of authLoading" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Should use AuthContext loading state" -ForegroundColor Yellow
    }
    
    if ($mindOpContent -match "auth.*stabiliz") {
        Write-Host "  ✅ Has auth stabilization logic" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Missing auth stabilization logic" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ❌ useMindOp hook not found" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "📊 SUMMARY" -ForegroundColor Magenta
Write-Host "==========" -ForegroundColor Magenta

$totalPages = $results.Count
$protectedPages = ($results.Values | Where-Object { $_ -eq $true }).Count

Write-Host "Pages tested: $totalPages" -ForegroundColor Blue
Write-Host "Properly protected: $protectedPages" -ForegroundColor Green
Write-Host "Need improvements: $($totalPages - $protectedPages)" -ForegroundColor Yellow

if ($protectedPages -eq $totalPages) {
    Write-Host ""
    Write-Host "🎉 ALL PAGES ARE PROPERLY PROTECTED!" -ForegroundColor Green
    Write-Host "✅ Authentication race conditions should be resolved" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Blue
    Write-Host "1. Test page refreshes on all pages" -ForegroundColor White
    Write-Host "2. Test navigation between pages" -ForegroundColor White
    Write-Host "3. Test with slow network conditions" -ForegroundColor White
    Write-Host "4. Verify no premature API calls during auth loading" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⚠️  SOME PAGES NEED PROTECTION IMPROVEMENTS" -ForegroundColor Yellow
    Write-Host "❗ Review the pages marked with ❌ above" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔗 Application running at: http://localhost:3002" -ForegroundColor Cyan
Write-Host ""
