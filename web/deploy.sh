#!/bin/bash
set -e

echo "🚀 Zentro Frontend Deploy Script"
echo "================================"

# Check for uncommitted changes
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "⚠️  Warning: You have uncommitted changes"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run type checking
echo "🔍 Type checking..."
npx tsc --noEmit

# Run build
echo "🏗️  Building..."
npm run build

# Deploy to Vercel (production)
echo "🚀 Deploying to Vercel..."
npx vercel --prod

echo "✅ Deploy complete!"
echo ""
echo "Next steps:"
echo "1. Check Vercel dashboard for deployment status"
echo "2. Verify analytics are working"
echo "3. Run Lighthouse audit"
