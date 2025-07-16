# Sentry Setup Guide

## 1. Source Maps Setup

### Get Your Auth Token
1. Go to Sentry → Settings → Account → API → Auth Tokens
2. Create a new token with these scopes:
   - `project:releases` (create and edit releases)
   - `org:read` (read org details)
   - `project:write` (upload source maps)

### Add to Your Build Environment
```bash
# Add to your .env.production or CI/CD environment
SENTRY_AUTH_TOKEN=your-auth-token-here
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

### Build with Source Maps
```bash
# Production build will automatically upload source maps
NODE_ENV=production npm run build
```

## 2. AI Rules for Code Editors

Sentry can provide AI-suggested fixes in your IDE. To enable:

### VS Code
1. Install the Sentry VS Code extension
2. Sign in with your Sentry account
3. Select your organization and project

### Configuration in `.vscode/settings.json`:
```json
{
  "sentry.enabled": true,
  "sentry.organization": "your-org-slug",
  "sentry.project": "animal-genius-frontend"
}
```

## 3. Deploy Configuration

### For Vercel
Add these environment variables in Vercel dashboard:
- `VITE_SENTRY_DSN` - Your DSN
- `SENTRY_AUTH_TOKEN` - Your auth token
- `SENTRY_ORG` - Your org slug
- `SENTRY_PROJECT` - Your project slug
- `VITE_APP_VERSION` - Your app version (can use Git SHA)

### For Other Platforms
Ensure these are set during build:
```bash
VITE_SENTRY_DSN=... \
SENTRY_AUTH_TOKEN=... \
SENTRY_ORG=... \
SENTRY_PROJECT=... \
NODE_ENV=production \
npm run build
```

## 4. Testing Source Maps

After deploying:
1. Trigger an error in production
2. Check Sentry - you should see the original source code, not minified
3. If you see minified code, check:
   - Auth token has correct permissions
   - Build process includes `NODE_ENV=production`
   - Source maps are being generated (`sourcemap: true` in vite.config)

## 5. Privacy Considerations

Current configuration:
- ✅ Masks all text in session replays
- ✅ Scrubs passport codes from URLs
- ✅ Removes student names from errors
- ✅ Only tracks anonymous user IDs
- ✅ Ignores noisy browser errors
- ✅ Filters out health check transactions