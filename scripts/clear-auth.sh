#!/bin/bash

# Emergency script to clear authentication data
# Run this if you encounter persistent authentication issues

echo "🧹 Clearing authentication data..."

# Create a simple HTML file to run in browser for clearing localStorage
cat > clear_auth.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Clear Authentication Data</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; }
        button { padding: 10px 20px; font-size: 16px; margin: 10px 0; }
        .success { color: green; }
        .info { color: blue; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Authentication Recovery Tool</h1>
        <p class="info">This tool helps clear corrupted authentication data from your browser.</p>
        
        <button onclick="clearAuthData()">Clear Authentication Data</button>
        <button onclick="checkAuthData()">Check Current Auth Data</button>
        
        <div id="output"></div>
        
        <script>
            function clearAuthData() {
                const authKeys = [
                    'mindops-auth',
                    'sb-mindops-auth-token',
                    'supabase.auth.token'
                ];
                
                let cleared = [];
                
                authKeys.forEach(key => {
                    if (localStorage.getItem(key)) {
                        localStorage.removeItem(key);
                        cleared.push(key);
                    }
                    if (sessionStorage.getItem(key)) {
                        sessionStorage.removeItem(key);
                        cleared.push(key + ' (session)');
                    }
                });
                
                const output = document.getElementById('output');
                if (cleared.length > 0) {
                    output.innerHTML = '<p class="success">✅ Cleared: ' + cleared.join(', ') + '</p><p>Please refresh your application.</p>';
                } else {
                    output.innerHTML = '<p>No authentication data found to clear.</p>';
                }
            }
            
            function checkAuthData() {
                const authKeys = [
                    'mindops-auth',
                    'sb-mindops-auth-token',
                    'supabase.auth.token'
                ];
                
                let found = [];
                
                authKeys.forEach(key => {
                    if (localStorage.getItem(key)) {
                        found.push(key + ' (local)');
                    }
                    if (sessionStorage.getItem(key)) {
                        found.push(key + ' (session)');
                    }
                });
                
                const output = document.getElementById('output');
                if (found.length > 0) {
                    output.innerHTML = '<p class="info">📋 Found auth data: ' + found.join(', ') + '</p>';
                } else {
                    output.innerHTML = '<p>No authentication data found.</p>';
                }
            }
        </script>
    </div>
</body>
</html>
EOF

echo "✅ Created clear_auth.html - open this file in your browser to manually clear auth data"
echo "📍 Location: $(pwd)/clear_auth.html"

# Also provide direct commands for clearing
echo ""
echo "🛠️  Alternative: Run these commands in your browser's console:"
echo "localStorage.removeItem('mindops-auth');"
echo "sessionStorage.removeItem('mindops-auth');"
echo "localStorage.removeItem('sb-mindops-auth-token');"
echo "location.reload();"
