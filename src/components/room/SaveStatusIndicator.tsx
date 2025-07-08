import React, { useEffect, useState } from 'react';
import { Check, CloudOff, Loader2 } from 'lucide-react';
import { useRoomStore } from '@/stores/roomStore';
import { cn } from '@/lib/utils';

export function SaveStatusIndicator() {
  const { isSaving, saveError, lastSaved } = useRoomStore(state => state.ui);
  const room = useRoomStore(state => state.room);
  const draftRoom = useRoomStore(state => state.draftRoom);
  const [showSaved, setShowSaved] = useState(false);
  
  // Check if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(room) !== JSON.stringify(draftRoom);
  
  // Show "Saved" message for 2 seconds after successful save
  useEffect(() => {
    if (lastSaved && !isSaving && !hasUnsavedChanges) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastSaved, isSaving, hasUnsavedChanges]);
  
  // Only show when actively saving, recently saved, or there's an error
  if (!isSaving && !showSaved && !saveError) {
    return null;
  }
  
  return (
    <div className="fixed bottom-20 left-4 z-50">
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all",
        "bg-white/90 backdrop-blur-sm shadow-lg border",
        saveError && "border-red-200 text-red-700",
        isSaving && "border-blue-200 text-blue-700",
        showSaved && "border-green-200 text-green-700"
      )}>
        {saveError ? (
          <>
            <CloudOff className="h-4 w-4" />
            <span>Save failed</span>
          </>
        ) : isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </>
        ) : showSaved ? (
          <>
            <Check className="h-4 w-4" />
            <span>Saved</span>
          </>
        ) : null}
      </div>
    </div>
  );
}