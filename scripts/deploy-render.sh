#!/bin/bash

# Render Deploy Script for MindOps Application
# This script ensures the application builds correctly for production

echo "🚀 Starting MindOps deployment process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run type checking
echo "🔍 Running TypeScript type check..."
npm run type-check

# Build the application
echo "🏗️ Building application for production..."
npm run build

echo "✅ Build completed successfully!"
echo "📁 Static files ready in ./dist directory"

# Verify critical files exist
if [ ! -f "dist/index.html" ]; then
    echo "❌ Error: index.html not found in dist directory"
    exit 1
fi

if [ ! -d "dist/assets" ]; then
    echo "❌ Error: assets directory not found in dist"
    exit 1
fi

echo "✅ All critical files verified"
echo "🎉 Ready for deployment!"
