# Animal Genius Quiz PRO - Frontend

React-based frontend for the Animal Genius educational platform.

## Current Status (Updated: 2025-01-01)

### ✅ Recent Fixes
- Direct purchase flow (no approval needed)
- Fixed infinite re-render loop in auth
- Fixed quiz submission endpoint
- Fixed student island loading
- Fixed analytics display (proper animal names)
- Fixed teacher coin giving functionality

### 🚀 Getting Started

```bash
npm install
npm run dev
```

The app will run on http://localhost:5173

### Environment Variables

Create a `.env` file:
```env
VITE_API_URL=http://localhost:5001
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Key Features

### Teacher Dashboard
- Class creation with unique codes
- Student analytics & tracking
- Direct coin management
- Real-time updates

### Student Experience
- No login required
- Passport code access
- Quiz → Avatar → Island flow
- Direct store purchases
- Avatar customization

## Architecture

### Tech Stack
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- TanStack Query for data fetching
- Shadcn/ui components
- React Router for navigation

### Key Components
- `useAuth` - Teacher authentication hook
- `StudentIsland` - Main student experience
- `ClassAnalytics` - Teacher analytics view
- `StoreModal` - Direct purchase interface
- `LayeredAvatar` - Avatar rendering system

### State Management
- TanStack Query for server state
- Local state for UI interactions
- Context for shared data

## Testing Checklist

- [x] Teacher registration/login
- [x] Class creation
- [x] Student quiz flow
- [x] Store purchases
- [x] Avatar customization
- [x] Coin transactions
- [x] Analytics display

## Deployment

Built for Vercel deployment:
```bash
npm run build
# Deploy dist folder to Vercel
```

## Known Issues

None currently - all major issues resolved in Phase 1.

## License

Proprietary - All rights reserved
