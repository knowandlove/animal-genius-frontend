import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShoppingBag, Paintbrush, Sparkles } from 'lucide-react';
import { useLocation } from 'wouter';
import type { Pattern } from '@shared/schema';

// Type definitions
export type SurfaceType = 'wall' | 'floor';
export type SurfaceValue = {
  type: 'color' | 'pattern';
  value: string;
  patternType?: 'css' | 'image';
  patternValue?: string;
  patternData?: {
    patternType: 'css' | 'image';
    patternValue: string;
  };
};

interface SurfaceCustomizerProps {
  surface: SurfaceType;
  currentValue: SurfaceValue;
  ownedPatterns: Pattern[];
  onUpdate: (newValue: SurfaceValue) => void;
}

// Default color palettes
const COLOR_PALETTES = {
  wall: [
    { name: 'Soft Pink', value: '#f5ddd9' },
    { name: 'Sky Blue', value: '#e8f4f8' },
    { name: 'Lavender', value: '#f5e6ff' },
    { name: 'Mint Green', value: '#e8ffe8' },
    { name: 'Warm Beige', value: '#f5e8d9' },
    { name: 'Cool Gray', value: '#e8e8e8' },
    { name: 'Butter Yellow', value: '#fffacd' },
    { name: 'Peach', value: '#ffdab9' },
  ],
  floor: [
    { name: 'Wood Brown', value: '#d4875f' },
    { name: 'Ocean Blue', value: '#a8c5d6' },
    { name: 'Purple', value: '#d4a6ff' },
    { name: 'Forest Green', value: '#a6d4a6' },
    { name: 'Terracotta', value: '#cc7a5f' },
    { name: 'Stone Gray', value: '#a8a8a8' },
    { name: 'Sand', value: '#e6d4a6' },
    { name: 'Slate', value: '#708090' },
  ],
};

// Helper function to get pattern preview for CSS patterns
const getPatternPreview = (patternCode: string): string => {
  switch (patternCode) {
    case 'wallpaper_floral_01':
      return 'radial-gradient(circle at 10px 10px, #FF69B4 4px, transparent 4px), radial-gradient(circle at 25px 25px, #FF1493 3px, transparent 3px), #FFE4E1';
    case 'wallpaper_stripes_01':
      return 'repeating-linear-gradient(90deg, #FFE4E1 0px, #FFE4E1 6px, #E6E6FA 6px, #E6E6FA 12px)';
    case 'tile_checkered_01':
      return 'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50% / 20px 20px';
    case 'css-dots-simple':
      return 'radial-gradient(circle, #d0d0d0 2px, transparent 2px), #fff';
    default:
      return '#e5e7eb';
  }
};

export default function SurfaceCustomizer({
  surface,
  currentValue,
  ownedPatterns,
  onUpdate,
}: SurfaceCustomizerProps) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'colors' | 'patterns'>(
    currentValue.type === 'pattern' ? 'patterns' : 'colors'
  );
  const [lastUsedColor, setLastUsedColor] = useState<string>(
    currentValue.type === 'color' ? currentValue.value : COLOR_PALETTES[surface][0].value
  );

  // Filter patterns by surface type
  const surfacePatterns = (ownedPatterns || []).filter(
    pattern => pattern.surfaceType === (surface === 'wall' ? 'background' : 'texture')
  );

  // Remember last color when switching tabs
  useEffect(() => {
    if (currentValue.type === 'color') {
      setLastUsedColor(currentValue.value);
    }
  }, [currentValue]);

  const handleColorSelect = (color: string) => {
    setLastUsedColor(color);
    onUpdate({ type: 'color', value: color });
  };

  const handlePatternSelect = (pattern: { code: string; patternType: string; patternValue: string } | null) => {
    if (pattern === null) {
      // Remove pattern - revert to last used color
      onUpdate({ type: 'color', value: lastUsedColor });
    } else {
      onUpdate({ 
        type: 'pattern', 
        value: pattern.code,
        patternType: pattern.patternType,
        patternValue: pattern.patternValue 
      });
    }
  };

  const handleCustomColorChange = (color: string) => {
    setLastUsedColor(color);
    onUpdate({ type: 'color', value: color });
  };

  const colorPalette = COLOR_PALETTES[surface];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium capitalize">{surface} Customization</h3>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'colors' | 'patterns')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Paintbrush className="w-4 h-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Patterns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-4 space-y-4">
          {/* Preset Colors */}
          <div>
            <label className="text-xs text-gray-600 mb-2 block">Preset Colors</label>
            <div className="grid grid-cols-4 gap-2">
              {colorPalette.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorSelect(color.value)}
                  className={cn(
                    "aspect-square rounded-lg border-2 transition-all hover:scale-105",
                    currentValue.type === 'color' && currentValue.value === color.value
                      ? "border-gray-800 shadow-lg"
                      : "border-gray-300 hover:border-gray-400"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Custom Color Picker */}
          <div>
            <label className="text-xs text-gray-600 mb-2 block">Custom Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={currentValue.type === 'color' ? currentValue.value : lastUsedColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300"
              />
              <div className="flex-1">
                <div className="text-xs text-gray-600 mb-1">Current color</div>
                <div className="font-mono text-sm">
                  {currentValue.type === 'color' ? currentValue.value : lastUsedColor}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="mt-4 space-y-4">
          {surfacePatterns.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {/* Owned Patterns Grid */}
              {surfacePatterns.map((pattern) => (
                <button
                  key={pattern.id}
                  onClick={() => {
                    const newValue: SurfaceValue = {
                      type: 'pattern',
                      value: pattern.code, // Use pattern code for data-pattern attribute
                      patternData: {
                        patternType: pattern.patternType,
                        patternValue: pattern.patternValue
                      }
                    };
                    onUpdate(newValue);
                  }}
                  className={cn(
                    "aspect-square p-2 rounded-lg border-2 transition-all hover:scale-105",
                    "bg-white hover:bg-gray-50",
                    currentValue.type === 'pattern' && currentValue.value === pattern.code
                      ? "border-gray-800 shadow-lg"
                      : "border-gray-300 hover:border-gray-400"
                  )}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    {pattern.thumbnailUrl ? (
                      <img 
                        src={pattern.thumbnailUrl} 
                        alt={pattern.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded border"
                        style={{
                          background: pattern.patternType === 'css' 
                            ? getPatternPreview(pattern.code)
                            : '#e5e7eb',
                          backgroundSize: pattern.code === 'css-dots-simple' ? '20px 20px' : 'auto'
                        }}
                      />
                    )}
                    <div className="text-xs font-medium text-center truncate w-full px-1">
                      {pattern.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600">
                No patterns owned yet for {surface}s
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}