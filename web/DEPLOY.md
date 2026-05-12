# Zentro Frontend Deployment Guide

## Prerequisites

- Node.js 20+
- Vercel CLI: `npm i -g vercel`
- Vercel account connected to GitHub

## Environment Setup

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in your values:
```env
NEXT_PUBLIC_API_URL=https://api.zentro.io
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## Local Development

```bash
npm install
npm run dev
```

## Production Deploy

### Option 1: Vercel CLI
```bash
vercel --prod
```

### Option 2: Git Push (Recommended)
Push to `main` branch → GitHub Actions runs tests → Auto-deploys to Vercel

### Option 3: Deploy Script
```bash
chmod +x deploy.sh
./deploy.sh
```

## Post-Deploy Checklist

- [ ] Landing page loads correctly
- [ ] Analytics events firing (check GA4 Realtime)
- [ ] Waitlist form working
- [ ] Auth (login/register) functional
- [ ] Demo modal plays
- [ ] Blog pages render
- [ ] Onboarding flow works
- [ ] Lighthouse score > 90
- [ ] Sitemap accessible at `/sitemap.xml`

## Rollback

```bash
vercel rollback
```

Or use Vercel dashboard → Deployments → Promote previous deployment.
