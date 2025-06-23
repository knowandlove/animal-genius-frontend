import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LayeredAvatarRoom from '@/components/avatar-v2/LayeredAvatarRoom';
import LayeredAvatarPositionerWithImage from '@/components/avatar-v2/LayeredAvatarPositionerWithImage';
import { ANIMAL_CONFIGS } from '@/config/animal-sizing';
import { getAnimalScale, AVATAR_RENDER_CONFIG } from '@/utils/avatar-render';
import { Ruler, Info } from 'lucide-react';

const ANIMALS = [
  { id: 'meerkat', name: 'Meerkat', emoji: '🦫' },
  { id: 'panda', name: 'Panda', emoji: '🐼' },
  { id: 'owl', name: 'Owl', emoji: '🦉' },
  { id: 'beaver', name: 'Beaver', emoji: '🦫' },
  { id: 'elephant', name: 'Elephant', emoji: '🐘' },
  { id: 'otter', name: 'Otter', emoji: '🦦' },
  { id: 'parrot', name: 'Parrot', emoji: '🦜' },
  { id: 'border-collie', name: 'Border Collie', emoji: '🐕' }
];

export default function AvatarDebug() {
  const [selectedAnimal, setSelectedAnimal] = useState<string>('meerkat');
  const [showGrid, setShowGrid] = useState(true);
  
  const animalConfig = ANIMAL_CONFIGS[selectedAnimal];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl">Avatar Size Debug Tool</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Compare avatar sizes across different views
                </p>
              </div>
              <Button
                variant={showGrid ? "default" : "outline"}
                onClick={() => setShowGrid(!showGrid)}
              >
                <Ruler className="w-4 h-4 mr-2" />
                {showGrid ? "Hide" : "Show"} Grid
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Animal Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Animal</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedAnimal} onValueChange={setSelectedAnimal}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANIMALS.map(animal => (
                  <SelectItem key={animal.id} value={animal.id}>
                    <div className="flex items-center gap-2">
                      <span>{animal.emoji}</span>
                      <span>{animal.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Animal Config Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Current Animal Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Base Scale:</span>
                <Badge variant="secondary" className="ml-2">{animalConfig?.baseScale || 1.0}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Item Scale:</span>
                <Badge variant="secondary" className="ml-2">{animalConfig?.itemScale || 1.0}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Combined (75% × base):</span>
                <Badge variant="secondary" className="ml-2">
                  {(AVATAR_RENDER_CONFIG.baseAnimalSize * (animalConfig?.baseScale || 1.0)).toFixed(3)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Admin Positioner View (600x600) */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Positioner (600×600)</CardTitle>
              <p className="text-sm text-muted-foreground">Reference size</p>
            </CardHeader>
            <CardContent>
              <div className="relative bg-purple-100 rounded-lg p-4">
                <div 
                  className="relative mx-auto bg-white rounded border-2 border-purple-300"
                  style={{ width: 600, height: 600, maxWidth: '100%' }}
                >
                  {showGrid && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-purple-200" />
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-purple-200" />
                      <div className="absolute inset-0 border-8 border-red-500 opacity-20" />
                    </div>
                  )}
                  <LayeredAvatarPositionerWithImage
                    animalType={selectedAnimal}
                    width={600}
                    height={600}
                    animated={false}
                  />
                </div>
                <div className="mt-4 text-sm space-y-1">
                  <p>Container: 600×600px</p>
                  <p>Scale Factor: 1.00</p>
                  <p>Effective Animal Scale: {getAnimalScale(selectedAnimal).toFixed(3)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Customizer View (504x504) */}
          <Card>
            <CardHeader>
              <CardTitle>Student Customizer (600×600)</CardTitle>
              <p className="text-sm text-muted-foreground">Avatar builder view</p>
            </CardHeader>
            <CardContent>
              <div className="relative bg-blue-100 rounded-lg p-4">
                <div 
                  className="relative mx-auto bg-white rounded border-2 border-blue-300"
                  style={{ width: 600, height: 600, maxWidth: '100%' }}
                >
                  {showGrid && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-200" />
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-200" />
                      <div className="absolute inset-0 border-8 border-red-500 opacity-20" />
                    </div>
                  )}
                  <LayeredAvatarRoom
                    animalType={selectedAnimal}
                    width={600}
                    height={600}
                    animated={false}
                  />
                </div>
                <div className="mt-4 text-sm space-y-1">
                  <p>Container: 600×600px</p>
                  <p>Scale Factor: 1.00</p>
                  <p>Effective Animal Scale: {getAnimalScale(selectedAnimal).toFixed(3)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Island Room View (504x504) */}
          <Card>
            <CardHeader>
              <CardTitle>Island Room (600×600)</CardTitle>
              <p className="text-sm text-muted-foreground">In-room display</p>
            </CardHeader>
            <CardContent>
              <div className="relative bg-green-100 rounded-lg p-4">
                <div 
                  className="relative mx-auto bg-white rounded border-2 border-green-300"
                  style={{ width: 600, height: 600, maxWidth: '100%' }}
                >
                  {showGrid && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-green-200" />
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-green-200" />
                      <div className="absolute inset-0 border-8 border-red-500 opacity-20" />
                    </div>
                  )}
                  <LayeredAvatarRoom
                    animalType={selectedAnimal}
                    width={600}
                    height={600}
                    animated={false}
                  />
                </div>
                <div className="mt-4 text-sm space-y-1">
                  <p>Container: 600×600px</p>
                  <p>Scale Factor: 1.00</p>
                  <p>Effective Animal Scale: {getAnimalScale(selectedAnimal).toFixed(3)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scaling Explanation */}
        <Card>
          <CardHeader>
            <CardTitle>Scaling Calculation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Base Formula:</strong> 75% × animalBaseScale</p>
            <p><strong>Standard Container:</strong> 600×600px for all views</p>
            <p><strong>For {selectedAnimal}:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>All containers: 0.75 × {animalConfig?.baseScale || 1.0} = {getAnimalScale(selectedAnimal).toFixed(3)}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
