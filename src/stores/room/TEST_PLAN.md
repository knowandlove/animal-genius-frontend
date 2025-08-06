# Room Store Refactoring Test Plan

## Manual Testing Checklist

### 1. Rapid Changes Test
- [ ] Open avatar customizer
- [ ] Rapidly equip/unequip items 10 times
- [ ] Watch Network tab - should see only ONE save request after 2 seconds
- [ ] Verify all changes are included in the save

### 2. Save Failure Test
- [ ] Open Network tab, set to "Offline"
- [ ] Make avatar changes
- [ ] Make room changes
- [ ] Verify draft state remains in UI
- [ ] Set back to "Online"
- [ ] Make another change to trigger save
- [ ] Verify changes are saved correctly

### 3. Cross-Tab Sync Test
- [ ] Open room in two browser tabs
- [ ] Make changes in Tab 1
- [ ] Wait for save (2 seconds)
- [ ] Switch to Tab 2
- [ ] Verify changes appear after queryClient invalidation

### 4. Memory Leak Test
- [ ] Open React DevTools Profiler
- [ ] Record performance
- [ ] Make 50+ rapid changes
- [ ] Stop recording
- [ ] Check for:
  - No excessive re-renders
  - Memory usage stable
  - Component unmounts clean up subscriptions

### 5. Permission Test
- [ ] Load room where `canEdit = false`
- [ ] Try to open inventory - should be blocked
- [ ] Try to drag items - should be blocked
- [ ] Verify read-only mode works correctly

### 6. Complete User Flow Test
1. [ ] Load room page
2. [ ] Open avatar customizer
3. [ ] Equip hat, glasses, neckwear rapidly
4. [ ] Switch to room decorator
5. [ ] Place 5 furniture items
6. [ ] Move 2 items to new positions
7. [ ] Remove 1 item to trash
8. [ ] Change wall color
9. [ ] Change floor pattern
10. [ ] Press undo twice
11. [ ] Close inventory
12. [ ] Wait for auto-save indicator
13. [ ] Refresh page (F5)
14. [ ] Verify all changes persisted correctly

### 7. Pet System Test
- [ ] Update pet name
- [ ] Move pet position
- [ ] Update pet stats
- [ ] Verify all changes save correctly

### 8. Theme System Test
- [ ] Change room theme
- [ ] Apply wall pattern (CSS type)
- [ ] Apply floor pattern (image type)
- [ ] Verify patterns render correctly
- [ ] Verify patterns save/load correctly

### 9. Avatar Colors Test
- [ ] Change primary color
- [ ] Change secondary color
- [ ] Verify `hasCustomized` flag sets to true
- [ ] Save and reload
- [ ] Verify colors persist

### 10. Edge Case Tests
- [ ] Place 50 items (hit room limit)
- [ ] Try to place 51st item - should show warning
- [ ] Remove all items one by one
- [ ] Verify inventory quantities update correctly
- [ ] Test with slow network (throttle to 3G)

## Automated Test Coverage

Run existing tests:
```bash
npm test
```

Run the new integration test:
```bash
npm test -- storeIntegration.test.ts
```

## Performance Benchmarks

### Before Refactoring (with original roomStore)
- Initial render: ___ ms
- Avatar change re-renders: ___ components
- Room change re-renders: ___ components
- Memory after 100 changes: ___ MB

### After Refactoring (with split stores)
- Initial render: ___ ms
- Avatar change re-renders: ___ components
- Room change re-renders: ___ components  
- Memory after 100 changes: ___ MB

## Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Mobile Testing
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Responsive design at 768px width

## Rollback Plan

If critical issues found:
1. Revert the import in components:
   ```typescript
   // Change back from:
   import { useRoomStores } from '@/hooks/useRoomStores';
   // To:
   import { useRoomStore } from '@/stores/roomStore';
   ```

2. The old `roomStore.ts` is preserved and can be restored

## Sign-off Checklist

- [ ] All manual tests pass
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Performance equal or better
- [ ] No memory leaks
- [ ] All features work as before

**Tested by**: ________________
**Date**: ________________
**Sign-off**: ________________