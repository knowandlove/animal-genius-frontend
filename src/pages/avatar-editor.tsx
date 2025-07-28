import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Download, Upload, Copy, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const animals = [
  'beaver', 'panda', 'elephant', 'owl', 
  'meerkat', 'otter', 'parrot', 'border collie'
];

const itemTypes: Record<string, string[]> = {
  hat: ['explorer', 'safari'],
  glasses: ['greenblinds', 'hearts'],
  accessory: ['bow_tie', 'necklace']
};

interface ItemConfig {
  top: number;
  left: number;
  scale: number;
  rotation: number;
}

interface AnimalConfigs {
  [animal: string]: {
    [itemType: string]: {
      [itemId: string]: ItemConfig;
    };
  };
}

interface ItemDetails {
  name: string;
  price: number;
  rarity: string;
  description: string;
}

// Helper component for item controls
function ItemControls({ 
  selectedCategory, 
  selectedItem, 
  setSelectedItem, 
  config, 
  updateConfig,
  handleImageUpload,
  equippedItems,
  setEquippedItems,
  selectedAnimal,
  itemDetails,
  updateItemDetails,
  uploadedImages
}: any) {
  return (
    <>
      {/* Item Selector */}
      <div>
        <Label>Select Item</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {itemTypes[selectedCategory].map(item => (
            <Button
              key={item}
              variant={selectedItem === item ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedItem(item)}
              className="text-xs"
            >
              {uploadedImages[`${selectedCategory}-${item}`] ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  {item.replace('_', ' ')}
                </span>
              ) : (
                item.replace('_', ' ')
              )}
            </Button>
          ))}
        </div>
        {itemTypes[selectedCategory].length === 0 && (
          <p className="text-xs text-gray-500 mt-2">No items yet. Upload one below!</p>
        )}
      </div>

      {/* Equip/Unequip Button */}
      <div>
        <Button
          onClick={() => {
            const equipped = equippedItems[selectedAnimal]?.[selectedCategory] === selectedItem;
            setEquippedItems((prev: {[animal: string]: {hat?: string; glasses?: string; accessory?: string}}) => ({
              ...prev,
              [selectedAnimal]: {
                ...prev[selectedAnimal],
                [selectedCategory]: equipped ? undefined : selectedItem
              }
            }));
          }}
          variant={equippedItems[selectedAnimal]?.[selectedCategory] === selectedItem ? 'destructive' : 'default'}
          className="w-full"
        >
          {equippedItems[selectedAnimal]?.[selectedCategory] === selectedItem ? 'Unequip' : 'Equip'} {selectedItem.replace('_', ' ')}
        </Button>
      </div>

      {/* Upload Item Image */}
      <div>
        <Label>Upload New Item</Label>
        <Input
          type="file"
          accept="image/png,image/jpg,image/jpeg"
          onChange={handleImageUpload}
          className="mt-2"
        />
        <p className="text-xs text-gray-500 mt-1">
          Name format: <strong>hat_</strong>pirate.png, <strong>glasses_</strong>cool.png, or <strong>neck_</strong>chain.png
        </p>
      </div>

      {/* Position Controls */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <Label>Vertical Position (Top)</Label>
            <span className="text-sm text-gray-600">{config.top}%</span>
          </div>
          <Slider
            value={[config.top]}
            onValueChange={([value]) => updateConfig('top', value)}
            min={0}
            max={100}
            step={1}
          />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <Label>Horizontal Position (Left)</Label>
            <span className="text-sm text-gray-600">{config.left}%</span>
          </div>
          <Slider
            value={[config.left]}
            onValueChange={([value]) => updateConfig('left', value)}
            min={0}
            max={100}
            step={1}
          />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <Label>Scale (Size)</Label>
            <span className="text-sm text-gray-600">{config.scale}</span>
          </div>
          <Slider
            value={[config.scale * 100]}
            onValueChange={([value]) => updateConfig('scale', value / 100)}
            min={10}
            max={200}
            step={5}
          />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <Label>Rotation</Label>
            <span className="text-sm text-gray-600">{config.rotation}°</span>
          </div>
          <Slider
            value={[config.rotation]}
            onValueChange={([value]) => updateConfig('rotation', value)}
            min={-180}
            max={180}
            step={5}
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <Label>Quick Adjustments</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateConfig('top', config.top - 5)}
          >
            Move Up
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateConfig('top', config.top + 5)}
          >
            Move Down
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateConfig('scale', config.scale * 1.1)}
          >
            Bigger
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateConfig('scale', config.scale * 0.9)}
          >
            Smaller
          </Button>
        </div>
      </div>

      {/* Item Details Section */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold text-sm">Store Details</h3>
        
        {/* Display Name */}
        <div>
          <Label>Display Name</Label>
          <Input
            value={itemDetails[`${selectedCategory}-${selectedItem}`]?.name || selectedItem.replace('_', ' ')}
            onChange={(e) => updateItemDetails('name', e.target.value)}
            placeholder="Pirate Hat"
          />
        </div>

        {/* Price */}
        <div>
          <Label>Price (coins)</Label>
          <Input
            type="number"
            value={itemDetails[`${selectedCategory}-${selectedItem}`]?.price || 100}
            onChange={(e) => updateItemDetails('price', parseInt(e.target.value) || 100)}
            min="0"
            max="9999"
          />
        </div>

        {/* Rarity */}
        <div>
          <Label>Rarity</Label>
          <Select
            value={itemDetails[`${selectedCategory}-${selectedItem}`]?.rarity || 'common'}
            onValueChange={(value) => updateItemDetails('rarity', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="common">Common (Gray)</SelectItem>
              <SelectItem value="uncommon">Uncommon (Green)</SelectItem>
              <SelectItem value="rare">Rare (Blue)</SelectItem>
              <SelectItem value="epic">Epic (Purple)</SelectItem>
              <SelectItem value="legendary">Legendary (Gold)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div>
          <Label>Description</Label>
          <Textarea
            value={itemDetails[`${selectedCategory}-${selectedItem}`]?.description || ''}
            onChange={(e) => updateItemDetails('description', e.target.value)}
            placeholder="A mystical hat that grants wisdom..."
            rows={2}
          />
        </div>
      </div>
    </>
  );
}

export default function AvatarEditor() {
  const [selectedAnimal, setSelectedAnimal] = useState('border collie');
  const [selectedCategory, setSelectedCategory] = useState<'hat' | 'glasses' | 'accessory'>('hat');
  const [selectedItem, setSelectedItem] = useState('explorer');
  const [showDebug, setShowDebug] = useState(true);
  
  // Track which items are equipped on the current animal
  const [equippedItems, setEquippedItems] = useState<{[animal: string]: {hat?: string; glasses?: string; accessory?: string}}>({});
  
  // Track item details for store
  const [itemDetails, setItemDetails] = useState<{[key: string]: ItemDetails}>({});
  
  // Initialize selected item when changing categories
  useEffect(() => {
    if (selectedCategory === 'hat' && itemTypes.hat.length > 0) setSelectedItem(itemTypes.hat[0] || 'explorer');
    else if (selectedCategory === 'glasses' && itemTypes.glasses.length > 0) setSelectedItem(itemTypes.glasses[0] || 'greenblinds');
    else if (selectedCategory === 'accessory' && itemTypes.accessory.length > 0) setSelectedItem(itemTypes.accessory[0] || 'bow_tie');
  }, [selectedCategory]);

  // Store all configurations
  const [configs, setConfigs] = useState<AnimalConfigs>(() => {
    const initialConfigs: AnimalConfigs = {};
    animals.forEach(animal => {
      initialConfigs[animal] = {
        hat: {
          explorer: { top: 15, left: 50, scale: 0.5, rotation: 0 },
          safari: { top: 10, left: 50, scale: 0.45, rotation: 0 }
        },
        glasses: {
          greenblinds: { top: 40, left: 50, scale: 0.35, rotation: 0 },
          hearts: { top: 40, left: 50, scale: 0.4, rotation: 0 }
        },
        accessory: {
          bow_tie: { top: 65, left: 50, scale: 0.5, rotation: 0 },
          necklace: { top: 60, left: 50, scale: 0.55, rotation: 0 }
        }
      };
    });
    return initialConfigs;
  });

  // Temporary image storage for items only
  const [uploadedImages, setUploadedImages] = useState<{[key: string]: string}>({});

  const getCurrentConfig = () => {
    return configs[selectedAnimal]?.[selectedCategory]?.[selectedItem] || 
           { top: 50, left: 50, scale: 0.5, rotation: 0 };
  };

  const updateConfig = (field: keyof ItemConfig, value: number) => {
    setConfigs(prev => ({
      ...prev,
      [selectedAnimal]: {
        ...prev[selectedAnimal],
        [selectedCategory]: {
          ...prev[selectedAnimal][selectedCategory],
          [selectedItem]: {
            ...prev[selectedAnimal][selectedCategory][selectedItem],
            [field]: value
          }
        }
      }
    }));
  };

  const updateItemDetails = (field: string, value: any) => {
    const key = `${selectedCategory}-${selectedItem}`;
    setItemDetails(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileName = file.name.toLowerCase();
        
        // Extract item name from filename (e.g., 'glasses_hearts.png' -> 'hearts')
        let itemName = '';
        let category = '';
        
        if (fileName.startsWith('hat_')) {
          category = 'hat';
          itemName = fileName.replace('hat_', '').replace('.png', '').replace('.jpg', '').replace('.jpeg', '');
        } else if (fileName.startsWith('glasses_')) {
          category = 'glasses';
          itemName = fileName.replace('glasses_', '').replace('.png', '').replace('.jpg', '').replace('.jpeg', '');
        } else if (fileName.startsWith('neck_')) {
          category = 'accessory';
          itemName = fileName.replace('neck_', '').replace('.png', '').replace('.jpg', '').replace('.jpeg', '');
        }
        
        if (category && itemName) {
          // Auto-switch to the right category
          setSelectedCategory(category as any);
          setSelectedItem(itemName);
          
          // Add to available items if not already there
          if (!itemTypes[category].includes(itemName)) {
            itemTypes[category].push(itemName);
          }
          
          // Store the uploaded image
          const key = `${category}-${itemName}`;
          setUploadedImages(prev => ({
            ...prev,
            [key]: e.target?.result as string
          }));
          
          // Initialize config for new item if needed
          setConfigs(prev => {
            const newConfigs = { ...prev };
            animals.forEach(animal => {
              if (!newConfigs[animal][category][itemName]) {
                newConfigs[animal][category][itemName] = { 
                  top: category === 'hat' ? 15 : category === 'glasses' ? 40 : 60, 
                  left: 50, 
                  scale: 0.5, 
                  rotation: 0 
                };
              }
            });
            return newConfigs;
          });
        } else {
          alert('Please name your file with format: hat_name.png, glasses_name.png, or neck_name.png');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const exportConfig = () => {
    // Generate complete store catalog
    const storeCatalog: any[] = [];
    
    Object.entries(itemTypes).forEach(([category, items]) => {
      items.forEach(itemId => {
        const key = `${category}-${itemId}`;
        const details = itemDetails[key] || {};
        
        storeCatalog.push({
          id: itemId,
          name: details.name || itemId.replace('_', ' '),
          type: category === 'hat' ? 'avatar_hat' : 'avatar_accessory',
          cost: details.price || 100,
          description: details.description || 'A cool item for your avatar!',
          rarity: (details.rarity || 'common') as 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
          imageUrl: `/avatars/items/${category === 'hat' ? 'hats' : category === 'glasses' ? 'glasses' : 'accessories'}/${itemId}.png`
        });
      });
    });

    // Generate position configs for all animals
    const animalAdjustments: any = {};
    animals.forEach(animal => {
      animalAdjustments[animal] = {};
      Object.entries(configs[animal]).forEach(([category, items]) => {
        animalAdjustments[animal][category] = {};
        Object.entries(items).forEach(([itemId, config]) => {
          animalAdjustments[animal][category][itemId] = {
            top: `${config.top}%`,
            left: `${config.left}%`,
            scale: config.scale,
            rotation: config.rotation
          };
        });
      });
    });

    // Combined export
    const fullExport = `// Store Catalog - Generated from Avatar Editor
export const STORE_CATALOG = ${JSON.stringify(storeCatalog, null, 2)};

// Position Adjustments - Generated from Avatar Editor  
export const animalAdjustments = ${JSON.stringify(animalAdjustments, null, 2)};`;

    navigator.clipboard.writeText(fullExport);
    alert('Complete configuration copied! This includes store catalog AND positions.');
  };

  const exportCurrentAnimalOnly = () => {
    const animalConfig = configs[selectedAnimal];
    const formattedConfig: any = {};
    
    Object.entries(animalConfig).forEach(([category, items]) => {
      formattedConfig[category] = {};
      Object.entries(items).forEach(([itemId, config]) => {
        formattedConfig[category][itemId] = {
          top: `${config.top}%`,
          left: `${config.left}%`,
          scale: config.scale,
          rotation: config.rotation
        };
      });
    });

    const exportText = `  "${selectedAnimal}": ${JSON.stringify(formattedConfig, null, 2).split('\n').map((line, i) => i === 0 ? line : '  ' + line).join('\n')}`;
    
    navigator.clipboard.writeText(exportText);
    alert(`Positioning for "${selectedAnimal}" copied! Just replace this animal's section in LayeredAvatar.tsx`);
  };

  const exportCurrentItemOnly = () => {
    const itemConfig = configs[selectedAnimal][selectedCategory][selectedItem];
    const formattedConfig = {
      top: `${itemConfig.top}%`,
      left: `${itemConfig.left}%`,
      scale: itemConfig.scale,
      rotation: itemConfig.rotation
    };

    const exportText = `      "${selectedItem}": ${JSON.stringify(formattedConfig, null, 2).split('\n').map((line, i) => i === 0 ? line : '      ' + line).join('\n')}`;
    
    navigator.clipboard.writeText(exportText);
    alert(`Positioning for "${selectedItem}" on "${selectedAnimal}" copied! Just replace this item in LayeredAvatar.tsx`);
  };

  const exportStoreCatalogOnly = () => {
    const storeCatalog: any[] = [];
    
    Object.entries(itemTypes).forEach(([category, items]) => {
      items.forEach(itemId => {
        const key = `${category}-${itemId}`;
        const details = itemDetails[key] || {};
        
        storeCatalog.push({
          id: itemId,
          name: details.name || itemId.replace('_', ' '),
          type: category === 'hat' ? 'avatar_hat' : 'avatar_accessory',
          cost: details.price || 100,
          description: details.description || 'A cool item for your avatar!',
          rarity: (details.rarity || 'common') as 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
          imageUrl: `/avatars/items/${category === 'hat' ? 'hats' : category === 'glasses' ? 'glasses' : 'accessories'}/${itemId}.png`
        });
      });
    });

    const exportText = `export const STORE_CATALOG: StoreItem[] = ${JSON.stringify(storeCatalog, null, 2)};`;
    
    navigator.clipboard.writeText(exportText);
    alert('Store catalog copied! Paste into shared/currency-types.ts');
  };

  const config = getCurrentConfig();
  const animalImage = selectedAnimal === 'border collie' 
    ? '/avatars/animals/collie.png'
    : `/avatars/animals/${selectedAnimal.replace(' ', '-')}.png`;
  
  // Get currently equipped items for this animal
  const currentEquipped = equippedItems[selectedAnimal] || {};

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Avatar Configuration Editor</h1>
        <p className="text-gray-600">Upload images and visually adjust positioning for each animal/item combination</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Preview Area */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebug(!showDebug)}
              >
                {showDebug ? 'Hide' : 'Show'} Debug Info
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative mx-auto bg-gradient-to-br from-blue-100 to-green-100 rounded-lg overflow-hidden"
                 style={{ width: 400, height: 400 }}>
              {/* Base Animal - key forces re-render on animal change */}
              <img
                key={`animal-${selectedAnimal}`}
                src={animalImage}
                alt={selectedAnimal}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 object-contain"
                style={{ maxWidth: '75%', maxHeight: '75%' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.opacity = '0.3';
                }}
              />
              
              {/* Render ALL equipped items */}
              {Object.entries(currentEquipped).map(([category, itemId]) => {
                if (!itemId) return null;
                
                const itemConfig = configs[selectedAnimal]?.[category]?.[itemId] || 
                                 { top: 50, left: 50, scale: 0.5, rotation: 0 };
                const itemImageSrc = uploadedImages[`${category}-${itemId}`] || 
                                   `/avatars/items/${category === 'hat' ? 'hats' : category === 'glasses' ? 'glasses' : 'accessories'}/${itemId}.png`;
                
                return (
                  <img
                    key={`${category}-${itemId}`}
                    src={itemImageSrc}
                    alt={itemId}
                    className="absolute"
                    style={{
                      top: `${itemConfig.top}%`,
                      left: `${itemConfig.left}%`,
                      transform: `translate(-50%, -50%) scale(${itemConfig.scale}) rotate(${itemConfig.rotation}deg)`,
                      transformOrigin: 'center',
                      opacity: category === selectedCategory ? 1 : 0.7, // Highlight current category
                      border: category === selectedCategory && itemId === selectedItem ? '2px solid red' : 'none',
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.opacity = '0.3';
                    }}
                  />
                );
              })}
              
              {/* Preview current selection if not equipped */}
              {!currentEquipped[selectedCategory] && selectedItem && (
                <img
                  key={`preview-${selectedCategory}-${selectedItem}`}
                  src={uploadedImages[`${selectedCategory}-${selectedItem}`] || 
                       `/avatars/items/${selectedCategory === 'hat' ? 'hats' : selectedCategory === 'glasses' ? 'glasses' : 'accessories'}/${selectedItem}.png`}
                  alt={selectedItem}
                  className="absolute"
                  style={{
                    top: `${config.top}%`,
                    left: `${config.left}%`,
                    transform: `translate(-50%, -50%) scale(${config.scale}) rotate(${config.rotation}deg)`,
                    transformOrigin: 'center',
                    opacity: 0.5, // Semi-transparent preview
                    border: '2px dashed blue',
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.opacity = '0.2';
                  }}
                />
              )}
              
              {/* Debug Overlay */}
              {showDebug && (
                <>
                  {/* Crosshairs */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-red-500 opacity-30" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-red-500 opacity-30" />
                  </div>
                  
                  {/* Position indicator */}
                  <div
                    className="absolute w-2 h-2 bg-red-500 rounded-full"
                    style={{
                      top: `${config.top}%`,
                      left: `${config.left}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                  
                  {/* Info */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded">
                    <div>Animal: {selectedAnimal}</div>
                    <div>Item: {selectedItem}</div>
                    <div>Pos: {config.top}%, {config.left}%</div>
                    <div>Scale: {config.scale}</div>
                    <div>Rotation: {config.rotation}°</div>
                    <div className="mt-1 text-yellow-400">Equipped: {Object.keys(currentEquipped).length} items</div>
                  </div>
                </>
              )}
            </div>
            
            {/* Animal Selector */}
            <div className="mt-4">
              <Label>Select Animal</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {animals.map(animal => {
                  const hasImage = animal === 'border collie'; // Only collie has image for now
                  return (
                    <Button
                      key={animal}
                      variant={selectedAnimal === animal ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedAnimal(animal)}
                      className={cn(
                        "capitalize text-xs",
                        !hasImage && "opacity-60"
                      )}
                    >
                      {animal}
                      {hasImage && (
                        <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs scale-75">
                          ✓
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">✓ = Image available</p>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Adjust Item Position</CardTitle>
            <CardDescription>Fine-tune position and size for each item</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="hat">Hats</TabsTrigger>
                <TabsTrigger value="glasses">Glasses</TabsTrigger>
                <TabsTrigger value="accessory">Accessories</TabsTrigger>
              </TabsList>
              
              <TabsContent value="hat" className="space-y-4">
                <ItemControls 
                  selectedCategory={selectedCategory}
                  selectedItem={selectedItem}
                  setSelectedItem={setSelectedItem}
                  config={config}
                  updateConfig={updateConfig}
                  handleImageUpload={handleImageUpload}
                  equippedItems={equippedItems}
                  setEquippedItems={setEquippedItems}
                  selectedAnimal={selectedAnimal}
                  itemDetails={itemDetails}
                  updateItemDetails={updateItemDetails}
                  uploadedImages={uploadedImages}
                />
              </TabsContent>
              <TabsContent value="glasses" className="space-y-4">
                <ItemControls 
                  selectedCategory={selectedCategory}
                  selectedItem={selectedItem}
                  setSelectedItem={setSelectedItem}
                  config={config}
                  updateConfig={updateConfig}
                  handleImageUpload={handleImageUpload}
                  equippedItems={equippedItems}
                  setEquippedItems={setEquippedItems}
                  selectedAnimal={selectedAnimal}
                  itemDetails={itemDetails}
                  updateItemDetails={updateItemDetails}
                  uploadedImages={uploadedImages}
                />
              </TabsContent>
              <TabsContent value="accessory" className="space-y-4">
                <ItemControls 
                  selectedCategory={selectedCategory}
                  selectedItem={selectedItem}
                  setSelectedItem={setSelectedItem}
                  config={config}
                  updateConfig={updateConfig}
                  handleImageUpload={handleImageUpload}
                  equippedItems={equippedItems}
                  setEquippedItems={setEquippedItems}
                  selectedAnimal={selectedAnimal}
                  itemDetails={itemDetails}
                  updateItemDetails={updateItemDetails}
                  uploadedImages={uploadedImages}
                />
              </TabsContent>
            </Tabs>

            {/* Export Button */}
            <div className="mt-6 space-y-2">
              <Label>Export Options</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={exportCurrentItemOnly} variant="outline" className="text-sm">
                  <Copy className="w-3 h-3 mr-1" />
                  Current Item Only
                </Button>
                <Button onClick={exportCurrentAnimalOnly} variant="outline" className="text-sm">
                  <Copy className="w-3 h-3 mr-1" />
                  {selectedAnimal} Only
                </Button>
                <Button onClick={exportStoreCatalogOnly} variant="outline" className="text-sm">
                  <Copy className="w-3 h-3 mr-1" />
                  Store Catalog
                </Button>
                <Button onClick={exportConfig} variant="default" className="text-sm">
                  <Copy className="w-3 h-3 mr-1" />
                  Export All
                </Button>
              </div>
              <p className="text-xs text-gray-600 text-center mt-2">
                Export just what you need - single item, animal, or everything
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
