# Emergency PowerShell script to clear authentication data
# Run this if you encounter persistent authentication issues

Write-Host "🧹 Clearing authentication data..." -ForegroundColor Yellow

# Create a simple HTML file to run in browser for clearing localStorage
$htmlContent = @'
<!DOCTYPE html>
<html>
<head>
    <title>Clear Authentication Data</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        button { padding: 12px 24px; font-size: 16px; margin: 10px 5px; border: none; border-radius: 5px; cursor: pointer; }
        .clear-btn { background: #e74c3c; color: white; }
        .check-btn { background: #3498db; color: white; }
        .refresh-btn { background: #2ecc71; color: white; }
        .success { color: #27ae60; padding: 10px; background: #d5f4e6; border-radius: 5px; margin: 10px 0; }
        .info { color: #2980b9; padding: 10px; background: #ebf3fd; border-radius: 5px; margin: 10px 0; }
        .warning { color: #f39c12; padding: 10px; background: #fef9e7; border-radius: 5px; margin: 10px 0; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Authentication Recovery Tool</h1>
        <p class="info">This tool helps clear corrupted authentication data from your browser. Use this if you're experiencing "Invalid Refresh Token" errors.</p>
        
        <div style="margin: 20px 0;">
            <button class="check-btn" onclick="checkAuthData()">📋 Check Current Auth Data</button>
            <button class="clear-btn" onclick="clearAuthData()">🧹 Clear Authentication Data</button>
            <button class="refresh-btn" onclick="refreshPage()">🔄 Refresh Page</button>
        </div>
        
        <div id="output"></div>
        
        <div class="warning">
            <h3>📋 Manual Console Commands:</h3>
            <p>You can also run these commands directly in your browser's console (F12):</p>
            <pre>
// Clear localStorage
localStorage.removeItem('mindops-auth');
localStorage.removeItem('sb-mindops-auth-token');
localStorage.removeItem('supabase.auth.token');

// Clear sessionStorage
sessionStorage.clear();

// Reload page
location.reload();
            </pre>
        </div>
        
        <script>
            function clearAuthData() {
                const authKeys = [
                    'mindops-auth',
                    'sb-mindops-auth-token',
                    'supabase.auth.token',
                    'sb-localhost-auth-token'
                ];
                
                let cleared = [];
                
                // Clear localStorage
                authKeys.forEach(key => {
                    if (localStorage.getItem(key)) {
                        localStorage.removeItem(key);
                        cleared.push(key + ' (localStorage)');
                    }
                });
                
                // Clear sessionStorage
                authKeys.forEach(key => {
                    if (sessionStorage.getItem(key)) {
                        sessionStorage.removeItem(key);
                        cleared.push(key + ' (sessionStorage)');
                    }
                });
                
                // Clear all auth-related keys
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key && (key.includes('auth') || key.includes('supabase') || key.includes('mindops'))) {
                        localStorage.removeItem(key);
                        cleared.push(key + ' (pattern match)');
                    }
                }
                
                const output = document.getElementById('output');
                if (cleared.length > 0) {
                    output.innerHTML = '<div class="success">✅ Cleared ' + cleared.length + ' items:<br>' + cleared.join('<br>') + '<br><br>🔄 <strong>Please refresh your application now!</strong></div>';
                } else {
                    output.innerHTML = '<div class="info">ℹ️ No authentication data found to clear.</div>';
                }
            }
            
            function checkAuthData() {
                const authKeys = [
                    'mindops-auth',
                    'sb-mindops-auth-token',
                    'supabase.auth.token',
                    'sb-localhost-auth-token'
                ];
                
                let found = [];
                
                // Check localStorage
                authKeys.forEach(key => {
                    if (localStorage.getItem(key)) {
                        found.push(key + ' (localStorage)');
                    }
                });
                
                // Check sessionStorage
                authKeys.forEach(key => {
                    if (sessionStorage.getItem(key)) {
                        found.push(key + ' (sessionStorage)');
                    }
                });
                
                // Check for pattern matches
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.includes('auth') || key.includes('supabase') || key.includes('mindops'))) {
                        if (!authKeys.includes(key)) {
                            found.push(key + ' (pattern match)');
                        }
                    }
                }
                
                const output = document.getElementById('output');
                if (found.length > 0) {
                    output.innerHTML = '<div class="warning">⚠️ Found ' + found.length + ' auth-related items:<br>' + found.join('<br>') + '</div>';
                } else {
                    output.innerHTML = '<div class="success">✅ No authentication data found in storage.</div>';
                }
            }
            
            function refreshPage() {
                location.reload();
            }
            
            // Auto-check on load
            window.onload = function() {
                checkAuthData();
            };
        </script>
    </div>
</body>
</html>
'@

$htmlPath = Join-Path $PWD "clear_auth.html"
$htmlContent | Out-File -FilePath $htmlPath -Encoding UTF8

Write-Host "✅ Created clear_auth.html" -ForegroundColor Green
Write-Host "📍 Location: $htmlPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Opening in default browser..." -ForegroundColor Yellow

try {
    Start-Process $htmlPath
    Write-Host "✅ Browser opened successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Could not open browser automatically" -ForegroundColor Red
    Write-Host "📂 Please manually open: $htmlPath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🛠️  Alternative: Run these commands in your browser's console (F12):" -ForegroundColor Cyan
Write-Host "localStorage.removeItem('mindops-auth');" -ForegroundColor White
Write-Host "sessionStorage.clear();" -ForegroundColor White
Write-Host "location.reload();" -ForegroundColor White
