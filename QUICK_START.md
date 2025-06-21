# 🚀 Quick Start Guide

## Prerequisites
- Node.js 18+ and npm installed
- Git configured
- Supabase account (for cloud storage)

## 🏃‍♂️ Get Started in 5 Minutes

### 1. Clone and Setup
```bash
# Clone the frontend
git clone [repository-url]
cd animal-genius-frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 2. Configure Environment
Edit `.env` file with your credentials:
```env
VITE_API_URL=http://localhost:5001
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_USE_CLOUD_STORAGE=true
```

### 3. Start Development Servers

#### Frontend (http://localhost:5173)
```bash
npm run dev
```

#### Backend (http://localhost:5001)
```bash
# In a separate terminal
cd ../animal-genius-backend
npm run dev
```

## 📝 Common Development Tasks

### Making Changes
```bash
# Check current status
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: add new store items"
# or
git commit -m "fix: resolve avatar display issue"
# or
git commit -m "docs: update README"

# Push to GitHub
git push origin main
```

### Running Checks
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Troubleshooting

### Port Already in Use?
```bash
# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9

# Kill process on port 5001 (backend)
lsof -ti:5001 | xargs kill -9
```

### Clean Install
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Clear Vite Cache
```bash
rm -rf node_modules/.vite
```

## 🎯 Key URLs

- **Frontend Dev**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **Student Quiz**: http://localhost:5173/quiz
- **Teacher Login**: http://localhost:5173/login
- **Admin Dashboard**: http://localhost:5173/dashboard

## 🏗️ Project Structure Quick Reference

```
src/
├── components/     # Reusable UI components
├── pages/          # Route pages
├── stores/         # Zustand state management
├── lib/            # API client and utilities
└── contexts/       # React contexts

shared/            # Shared types between frontend/backend
public/            # Static assets
```

## 💡 Development Tips

1. **Always pull latest changes before starting work**
   ```bash
   git pull origin main
   ```

2. **Use proper commit message format**
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `style:` for formatting
   - `refactor:` for code restructuring
   - `test:` for tests
   - `chore:` for maintenance

3. **Test in different viewport sizes**
   - The app is designed for desktop and tablet
   - Mobile support is limited

4. **Check the console for errors**
   - Open DevTools (F12)
   - Look for red error messages
   - Check Network tab for failed requests

## 🚨 Important Notes

- **NO ACTIVE USERS** - Development environment only
- Database can be reset anytime during development
- All test data is safe to modify or delete
- Feel free to experiment and break things!

## 📞 Need Help?

1. Check `STATUS_UPDATE.md` for current project status
2. Look for inline code comments
3. Review component documentation
4. Check error messages carefully

---

**Happy Coding!** 🎉
