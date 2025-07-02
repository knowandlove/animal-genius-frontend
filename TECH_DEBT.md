# Technical Debt Documentation

This document tracks technical debt items identified during the pre-deployment scan on 2025-07-02.

## High Priority

### 1. Inconsistent Avatar Rendering Systems
**Impact**: High - Risk of developer confusion and inconsistent avatar rendering  
**Files Affected**:
- `src/pages/admin/avatar-item-positioner.tsx` (old admin tool)
- `src/components/avatar-v2/LayeredAvatarFixed.tsx`
- `src/components/avatar-v2/LayeredAvatarDB.tsx`
- `src/components/avatar-v2/LayeredAvatarRoom.tsx`
- `src/components/avatar-v2/LayeredAvatarPositionerWithImage.tsx`
- `src/utils/avatar-render.ts` (old positioning utilities)

**Issue**: The codebase contains two parallel avatar rendering systems - the new normalized system and the old percentage-based system.

**Resolution**:
1. Delete all old avatar rendering components listed above
2. Remove `src/pages/admin/avatar-item-positioner.tsx` (replaced by normalized version)
3. Update `src/pages/admin/avatar-size-debug.tsx` to use `NormalizedAvatar`
4. Delete `src/utils/avatar-render.ts` as it's no longer needed
5. Consider moving old files to `.cleanup/` directory first for safety

## Medium Priority

### 2. StandardAvatar and SafeAvatar Components
**Impact**: Medium - Unused components that may confuse developers  
**Files Affected**:
- `src/components/avatar-v2/StandardAvatar.tsx`
- `src/components/avatar-v2/SafeAvatar.tsx`

**Issue**: These components appear to be unused wrappers around the old avatar system.

**Resolution**:
1. Verify these components are not imported anywhere
2. Delete if confirmed unused
3. Update any references to use `NormalizedAvatar` directly

## Low Priority

### 3. Unwrapped Console Logs in Old Admin Tool
**Impact**: Low - Admin-only tool with minor console output  
**Files Affected**:
- `src/pages/admin/avatar-item-positioner.tsx` (lines 70, 71, 72, 76)

**Issue**: Console.log statements not wrapped in development checks.

**Resolution**:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('Store items loaded:', storeItems);
  // ... other console logs
}
```

### 4. Hardcoded Supabase URL
**Impact**: Low - Makes asset management less centralized  
**Files Affected**:
- `src/pages/ClassIsland.tsx` (line 20 in `getAnimalHeadIcon`)

**Issue**: Hardcoded URL bypasses centralized asset management.

**Resolution**:
```typescript
import { getAssetUrl } from '@/utils/cloud-assets';

const getAnimalHeadIcon = (animalType: string): string => {
  const normalizedType = animalType.toLowerCase().replace(/\s+/g, '_');
  return getAssetUrl(`/animals/head_icons/${normalizedType}.png`);
};
```

### 5. RoomSticker Still Using LayeredAvatarRoom
**Impact**: Low - Internal component using old avatar system  
**Files Affected**:
- `src/components/room/RoomSticker.tsx` (line 4, 164)

**Issue**: Still imports and uses `LayeredAvatarRoom` instead of normalized system.

**Resolution**:
1. Replace `LayeredAvatarRoom` import with `NormalizedAvatar`
2. Update the avatar rendering to use `NormalizedAvatar` component
3. Test room sticker functionality after update

## Future Improvements

### API Call Optimization
The item positions API call frequency has been reduced from `staleTime: 0` to `staleTime: 5 minutes` in `src/contexts/StoreDataContext.tsx`. Monitor performance and adjust if needed.

### Component Cleanup Strategy
1. Create a `.cleanup/` directory for deprecated components
2. Move old components there before final deletion
3. Keep for 1-2 sprints as safety net
4. Delete after confirming no issues

## Notes
- All critical issues for deployment have been resolved
- The student-facing room experience uses the correct normalized avatar system
- Old components are isolated and not affecting the main user flow