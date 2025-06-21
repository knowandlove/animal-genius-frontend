# 🦁 Know and Love - Animal Genius Frontend

A personality and leadership assessment platform for junior high students, featuring interactive quizzes, customizable avatars, and gamified learning experiences.

## 🎯 Project Overview

Know and Love is an educational platform that helps students discover their personality types through engaging quizzes and activities. Students receive an animal avatar based on their personality type and can customize their virtual space while earning coins through participation.

### Key Features
- 📝 Interactive personality assessments
- 🐾 8 unique animal avatars representing different personality types
- 💰 Virtual currency system for engagement
- 🏠 Customizable avatar outfits and room decorations
- 👩‍🏫 Teacher dashboard for class management
- 🎮 Gamified learning experience

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account (for cloud storage)
- Backend server running (see backend repository)

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd animal-genius-frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your .env file with your credentials
```

### Development

```bash
# Start the frontend development server
npm run dev
# Opens at http://localhost:5173

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build
```

## 🏗️ Project Structure

```
animal-genius-frontend/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── avatar-v2/   # Avatar display components
│   │   ├── island/      # Student island/room components
│   │   └── ui/          # Base UI components (shadcn/ui)
│   ├── contexts/        # React contexts for state management
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and API client
│   ├── pages/           # Route components
│   │   ├── admin/       # Admin/teacher pages
│   │   └── student/     # Student-facing pages
│   ├── stores/          # Zustand state management
│   └── utils/           # Helper functions
├── shared/              # Shared types and schemas
└── public/              # Static assets
```

## 🎨 Key Components

### Student Experience

1. **Personality Quiz** (`/quiz`)
   - 24-question assessment
   - Determines MBTI personality type
   - Awards animal avatar

2. **Student Island** (`/island`)
   - Personal dashboard
   - Avatar customization
   - Room decoration
   - Currency balance display

3. **Store System**
   - Virtual store for items
   - Categories: Hats, Accessories, Furniture
   - Drag-and-drop room decoration

### Teacher Dashboard

1. **Class Management** (`/dashboard`)
   - View all students
   - Track quiz completion
   - Award bonus coins

2. **Admin Tools** (`/admin/*`)
   - Store item management
   - Avatar positioning tool
   - User management

## 🔧 Technical Stack

- **Frontend Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: Zustand
- **Styling**: Tailwind CSS + shadcn/ui components
- **API Client**: Custom fetch wrapper with auth
- **Build Tool**: Vite
- **Cloud Storage**: Supabase Storage
- **Animations**: CSS transitions (Framer Motion removed)

## 📁 Important Files

- `QUICK_START.md` - Common commands and development tips
- `.env.example` - Environment variable template
- `shared/schema.ts` - Database schema definitions
- `shared/currency-types.ts` - Type definitions for the currency system

## 🔐 Environment Variables

```bash
# API Configuration
VITE_API_URL=http://localhost:5001

# Supabase Configuration (for cloud storage)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Feature Flags
VITE_USE_CLOUD_STORAGE=true
```

## 🐛 Known Issues & Solutions

### Avatar Positioning
- Items positioned in the admin tool may appear slightly different in the actual game
- This is due to container size differences (see `AVATAR_POSITIONING_ISSUE.md`)

### Image Loading
- All avatar and item images are now served through Supabase Storage
- Fallback to local images if cloud storage is disabled

## 🚢 Deployment

The app is configured for deployment on Vercel:

```bash
# Build the project
npm run build

# Preview the build locally
npm run preview
```

See `vercel.json` for deployment configuration.

## 👥 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📝 License

This project is proprietary software for Know and Love educational platform.

## 🙏 Acknowledgments

- Created by Jason Lackey and team
- Designed for junior high students to discover their unique personalities
- Part of the Know and Love educational ecosystem

---

For more detailed information about specific features or troubleshooting, please refer to the inline documentation in the source code.
