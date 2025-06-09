# Debug MindOp Loading Issues
# Verifies database state and helps identify MindOp loading problems

Write-Host "🔍 Debugging MindOp Loading Issues" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is available
try {
    $supabaseVersion = supabase --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Supabase CLI not found" -ForegroundColor Red
        Write-Host "Please install Supabase CLI to run database checks" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error checking Supabase CLI: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Function to run SQL query
function Invoke-SupabaseQuery {
    param(
        [string]$Query,
        [string]$Description
    )
    
    Write-Host "🔍 $Description..." -ForegroundColor Yellow
    try {
        $result = supabase db query $Query 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Query successful" -ForegroundColor Green
            Write-Host $result -ForegroundColor White
        } else {
            Write-Host "❌ Query failed" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error executing query: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Check mindops table structure
$checkTableQuery = @"
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'mindops' 
ORDER BY ordinal_position;
"@

Invoke-SupabaseQuery -Query $checkTableQuery -Description "Checking mindops table structure"

# Check if there are any mindops records
$countQuery = "SELECT COUNT(*) as total_mindops FROM mindops;"
Invoke-SupabaseQuery -Query $countQuery -Description "Counting total mindops"

# Check mindops with user associations
$userMindopsQuery = @"
SELECT 
    m.id,
    m.user_id,
    m.mindop_name,
    m.created_at,
    a.email
FROM mindops m
LEFT JOIN auth.users a ON m.user_id = a.id
LIMIT 10;
"@

Invoke-SupabaseQuery -Query $userMindopsQuery -Description "Checking mindops with user associations"

# Check for specific user from logs
$specificUserQuery = @"
SELECT 
    id,
    user_id,
    mindop_name,
    mindop_description,
    created_at
FROM mindops 
WHERE user_id = 'aef04a07-f003-4cf9-ad25-383eb9fb5cb4';
"@

Invoke-SupabaseQuery -Query $specificUserQuery -Description "Checking specific user's mindop (from logs)"

# Check RLS policies on mindops table
$rlsPoliciesQuery = @"
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'mindops';
"@

Invoke-SupabaseQuery -Query $rlsPoliciesQuery -Description "Checking RLS policies on mindops table"

# Check if RLS is enabled
$rlsEnabledQuery = @"
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'mindops';
"@

Invoke-SupabaseQuery -Query $rlsEnabledQuery -Description "Checking if RLS is enabled on mindops table"

Write-Host "🔧 DEBUGGING RECOMMENDATIONS" -ForegroundColor Magenta
Write-Host "=============================" -ForegroundColor Magenta
Write-Host ""
Write-Host "If the specific user's mindop query returns empty:" -ForegroundColor Yellow
Write-Host "1. Check if the user exists in auth.users" -ForegroundColor White
Write-Host "2. Verify RLS policies allow the user to read their own mindop" -ForegroundColor White
Write-Host "3. Check if mindop was created correctly during signup" -ForegroundColor White
Write-Host ""
Write-Host "If RLS policies are blocking access:" -ForegroundColor Yellow
Write-Host "1. Verify policies allow authenticated users to read their own mindops" -ForegroundColor White
Write-Host "2. Check if JWT token is being passed correctly" -ForegroundColor White
Write-Host "3. Ensure service role is not being used for user queries" -ForegroundColor White
Write-Host ""
Write-Host "Common fixes:" -ForegroundColor Yellow
Write-Host "1. supabase migration repair" -ForegroundColor White
Write-Host "2. supabase db reset" -ForegroundColor White
Write-Host "3. Check browser console for detailed error messages" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Application URL: http://localhost:3001" -ForegroundColor Cyan

# Check mindops table structure
$checkTableQuery = @"
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'mindops' 
ORDER BY ordinal_position;
"@

Invoke-SupabaseQuery -Query $checkTableQuery -Description "Checking mindops table structure"

# Check if there are any mindops records
$countQuery = "SELECT COUNT(*) as total_mindops FROM mindops;"
Invoke-SupabaseQuery -Query $countQuery -Description "Counting total mindops"

# Check mindops with user associations
$userMindopsQuery = @"
SELECT 
    m.id,
    m.user_id,
    m.mindop_name,
    m.created_at,
    a.email
FROM mindops m
LEFT JOIN auth.users a ON m.user_id = a.id
LIMIT 10;
"@

Invoke-SupabaseQuery -Query $userMindopsQuery -Description "Checking mindops with user associations"

# Check for specific user from logs
$specificUserQuery = @"
SELECT 
    id,
    user_id,
    mindop_name,
    mindop_description,
    created_at
FROM mindops 
WHERE user_id = 'aef04a07-f003-4cf9-ad25-383eb9fb5cb4';
"@

Invoke-SupabaseQuery -Query $specificUserQuery -Description "Checking specific user's mindop (from logs)"

# Check RLS policies on mindops table
$rlsPoliciesQuery = @"
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'mindops';
"@

Invoke-SupabaseQuery -Query $rlsPoliciesQuery -Description "Checking RLS policies on mindops table"

# Check if RLS is enabled
$rlsEnabledQuery = @"
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'mindops';
"@

Invoke-SupabaseQuery -Query $rlsEnabledQuery -Description "Checking if RLS is enabled on mindops table"

# Additional debugging queries

# Check if the specific user exists in auth.users
$checkUserQuery = @"
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE id = 'aef04a07-f003-4cf9-ad25-383eb9fb5cb4';
"@

Invoke-SupabaseQuery -Query $checkUserQuery -Description "Checking if specific user exists in auth.users"

# Check all mindops created in the last 24 hours
$recentMindopsQuery = @"
SELECT 
    id,
    user_id,
    mindop_name,
    created_at
FROM mindops 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
"@

Invoke-SupabaseQuery -Query $recentMindopsQuery -Description "Checking mindops created in last 24 hours"

# Check for orphaned mindops (no matching user)
$orphanedMindopsQuery = @"
SELECT 
    m.id,
    m.user_id,
    m.mindop_name,
    m.created_at
FROM mindops m
LEFT JOIN auth.users u ON m.user_id = u.id
WHERE u.id IS NULL;
"@

Invoke-SupabaseQuery -Query $orphanedMindopsQuery -Description "Checking for orphaned mindops"

# Check indexes on mindops table
$indexesQuery = @"
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'mindops';
"@

Invoke-SupabaseQuery -Query $indexesQuery -Description "Checking indexes on mindops table"

# Check foreign key constraints
$constraintsQuery = @"
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.is_deferrable,
    tc.initially_deferred
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'mindops';
"@

Invoke-SupabaseQuery -Query $constraintsQuery -Description "Checking foreign key constraints on mindops table"

# Check if there are any duplicate user_id entries
$duplicateUsersQuery = @"
SELECT 
    user_id,
    COUNT(*) as count
FROM mindops
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY count DESC;
"@

Invoke-SupabaseQuery -Query $duplicateUsersQuery -Description "Checking for duplicate user_id entries"

# Test RLS policy by simulating authenticated user
$testRLSQuery = @"
-- This shows what the RLS policy would return for the specific user
SELECT 
    id,
    mindop_name,
    user_id
FROM mindops
WHERE user_id = 'aef04a07-f003-4cf9-ad25-383eb9fb5cb4'
    AND (
        -- Simulating the RLS policy check
        auth.uid() = user_id 
        OR 
        user_id = 'aef04a07-f003-4cf9-ad25-383eb9fb5cb4'
    );
"@

Invoke-SupabaseQuery -Query $testRLSQuery -Description "Testing RLS policy simulation"

Write-Host "🔧 DEBUGGING RECOMMENDATIONS" -ForegroundColor Magenta
Write-Host "=============================" -ForegroundColor Magenta
Write-Host ""
Write-Host "If the specific user's mindop query returns empty:" -ForegroundColor Yellow
Write-Host "1. Check if the user exists in auth.users" -ForegroundColor White
Write-Host "2. Verify RLS policies allow the user to read their own mindop" -ForegroundColor White
Write-Host "3. Check if mindop was created correctly during signup" -ForegroundColor White
Write-Host ""
Write-Host "If RLS policies are blocking access:" -ForegroundColor Yellow
Write-Host "1. Verify policies allow authenticated users to read their own mindops" -ForegroundColor White
Write-Host "2. Check if JWT token is being passed correctly" -ForegroundColor White
Write-Host "3. Ensure service role is not being used for user queries" -ForegroundColor White
Write-Host ""
Write-Host "Common fixes:" -ForegroundColor Yellow
Write-Host "1. supabase migration repair" -ForegroundColor White
Write-Host "2. supabase db reset" -ForegroundColor White
Write-Host "3. Check browser console for detailed error messages" -ForegroundColor White
Write-Host ""

# Generate summary report
Write-Host "📊 SUMMARY REPORT" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run the following commands for additional debugging:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Check Supabase status:" -ForegroundColor White
Write-Host "   supabase status" -ForegroundColor Gray
Write-Host ""
Write-Host "2. View recent logs:" -ForegroundColor White
Write-Host "   supabase db logs --tail 50" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Reset database (if needed):" -ForegroundColor White
Write-Host "   supabase db reset" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Check migrations status:" -ForegroundColor White
Write-Host "   supabase migration list" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Repair migrations:" -ForegroundColor White
Write-Host "   supabase migration repair" -ForegroundColor Gray
Write-Host ""

Write-Host "🌐 Application URL: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""

# Export results to file (optional)
$exportResults = Read-Host "Would you like to export the results to a file? (y/n)"
if ($exportResults -eq 'y') {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $filename = "mindop_debug_$timestamp.log"
    
    Write-Host "Exporting results to $filename..." -ForegroundColor Yellow
    
    # Re-run all queries and save to file
    $queries = @(
        @{Query=$checkTableQuery; Description="Table Structure"},
        @{Query=$countQuery; Description="Total Count"},
        @{Query=$userMindopsQuery; Description="User Associations"},
        @{Query=$specificUserQuery; Description="Specific User"},
        @{Query=$rlsPoliciesQuery; Description="RLS Policies"},
        @{Query=$rlsEnabledQuery; Description="RLS Status"},
        @{Query=$checkUserQuery; Description="User Exists"},
        @{Query=$recentMindopsQuery; Description="Recent MindOps"},
        @{Query=$orphanedMindopsQuery; Description="Orphaned MindOps"},
        @{Query=$indexesQuery; Description="Indexes"},
        @{Query=$constraintsQuery; Description="Constraints"},
        @{Query=$duplicateUsersQuery; Description="Duplicates"}
    )
    
    $output = @()
    $output += "MindOp Debug Report - $(Get-Date)"
    $output += "================================="
    $output += ""
    
    foreach ($q in $queries) {
        $output += "## $($q.Description)"
        $output += "-" * 50
        $result = supabase db query $q.Query 2>&1
        $output += $result
        $output += ""
    }
    
    $output | Out-File -FilePath $filename
    Write-Host "✅ Results exported to $filename" -ForegroundColor Green
}

Write-Host ""
Write-Host "Debug script completed!" -ForegroundColor Green