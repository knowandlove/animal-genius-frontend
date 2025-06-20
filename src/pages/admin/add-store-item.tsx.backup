import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STORE_CATALOG } from '@shared/currency-types';
import { Plus, Copy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AddStoreItem() {
  const [newItem, setNewItem] = useState({
    id: '',
    name: '',
    type: 'avatar_hat',
    cost: 100,
    description: '',
    rarity: 'common'
  });
  
  const [generatedCode, setGeneratedCode] = useState('');

  const getImagePath = () => {
    const { type, id } = newItem;
    
    // Avatar items
    if (type === 'avatar_hat') {
      return `/avatars/items/hats/${id}.png`;
    }
    if (type === 'avatar_accessory') {
      // Check if it's glasses based on common patterns
      if (id.includes('glass') || id.includes('blind') || id.includes('shade') || id.includes('spectacle') || id.includes('monocle')) {
        return `/avatars/items/glasses/${id}.png`;
      }
      return `/avatars/items/accessories/${id}.png`;
    }
    
    // Room items
    if (type === 'room_furniture') {
      return `/furniture/${id}.png`;
    }
    if (type === 'room_decoration') {
      return `/decorations/${id}.png`;
    }
    if (type === 'room_wallpaper') {
      return `/rooms/wallpapers/${id}.png`;
    }
    if (type === 'room_flooring') {
      return `/rooms/floors/${id}.png`;
    }
    
    return `/items/${id}.png`;
  };

  const generateItemCode = () => {
    const code = `{
  id: "${newItem.id}",
  name: "${newItem.name}",
  type: "${newItem.type}",
  cost: ${newItem.cost},
  description: "${newItem.description}",
  rarity: "${newItem.rarity}",
  imageUrl: "${getImagePath()}"
}`;
    setGeneratedCode(code);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    alert('Code copied to clipboard! Add it to STORE_CATALOG in currency-types.ts');
  };

  // Group items by category for display
  const categorizedItems = {
    hats: STORE_CATALOG.filter(item => item.type === 'avatar_hat'),
    accessories: STORE_CATALOG.filter(item => item.type === 'avatar_accessory'),
    furniture: STORE_CATALOG.filter(item => item.type === 'room_furniture'),
    decorations: STORE_CATALOG.filter(item => item.type === 'room_decoration'),
    wallpapers: STORE_CATALOG.filter(item => item.type === 'room_wallpaper'),
    flooring: STORE_CATALOG.filter(item => item.type === 'room_flooring')
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add New Store Item</CardTitle>
            <p className="text-muted-foreground">
              Generate code to add a new item to the store catalog
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Item ID (lowercase, no spaces)</Label>
              <Input
                value={newItem.id}
                onChange={(e) => setNewItem(prev => ({ ...prev, id: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                placeholder="wizard_hat"
              />
            </div>

            <div>
              <Label>Display Name</Label>
              <Input
                value={newItem.name}
                onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Wizard Hat"
              />
            </div>

            <div>
              <Label>Item Type</Label>
              <Select 
                value={newItem.type} 
                onValueChange={(value) => setNewItem(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="avatar_hat">Avatar Hat</SelectItem>
                  <SelectItem value="avatar_accessory">Avatar Accessory (Glasses, Scarves, etc)</SelectItem>
                  <SelectItem value="room_furniture">Room Furniture</SelectItem>
                  <SelectItem value="room_decoration">Room Decoration/Objects</SelectItem>
                  <SelectItem value="room_wallpaper">Wallpaper Pattern</SelectItem>
                  <SelectItem value="room_flooring">Flooring Pattern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cost (coins)</Label>
              <Input
                type="number"
                value={newItem.cost}
                onChange={(e) => setNewItem(prev => ({ ...prev, cost: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="A cool item for your avatar!"
              />
            </div>

            <div>
              <Label>Rarity</Label>
              <Select 
                value={newItem.rarity} 
                onValueChange={(value) => setNewItem(prev => ({ ...prev, rarity: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={generateItemCode} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Generate Item Code
            </Button>

            {generatedCode && (
              <div className="space-y-2">
                <Label>Generated Code:</Label>
                <Textarea
                  value={generatedCode}
                  readOnly
                  className="font-mono text-sm h-40"
                />
                <div className="bg-blue-50 p-3 rounded text-sm">
                  <p className="font-semibold mb-1">📁 File Location:</p>
                  <p className="font-mono text-xs">{getImagePath()}</p>
                </div>
                <Button onClick={copyToClipboard} variant="outline" className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </Button>
                <p className="text-sm text-muted-foreground">
                  Add this code to the STORE_CATALOG array in shared/currency-types.ts
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Store Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="hats" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="hats">Hats ({categorizedItems.hats.length})</TabsTrigger>
                <TabsTrigger value="accessories">Accessories ({categorizedItems.accessories.length})</TabsTrigger>
                <TabsTrigger value="furniture">Furniture ({categorizedItems.furniture.length})</TabsTrigger>
                <TabsTrigger value="decorations">Decorations ({categorizedItems.decorations.length})</TabsTrigger>
                <TabsTrigger value="wallpapers">Wallpapers ({categorizedItems.wallpapers.length})</TabsTrigger>
                <TabsTrigger value="flooring">Flooring ({categorizedItems.flooring.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="hats">
                {categorizedItems.hats.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">No hats in the catalog yet</p>
                ) : (
                  <div className="space-y-2">
                    {categorizedItems.hats.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">({item.id})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.cost} coins</span>
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">{item.rarity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="accessories">
                {categorizedItems.accessories.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">No accessories in the catalog yet</p>
                ) : (
                  <div className="space-y-2">
                    {categorizedItems.accessories.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">({item.id})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.cost} coins</span>
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">{item.rarity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="furniture">
                {categorizedItems.furniture.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">No furniture in the catalog yet</p>
                ) : (
                  <div className="space-y-2">
                    {categorizedItems.furniture.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">({item.id})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.cost} coins</span>
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">{item.rarity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="decorations">
                {categorizedItems.decorations.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">No decorations in the catalog yet</p>
                ) : (
                  <div className="space-y-2">
                    {categorizedItems.decorations.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">({item.id})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.cost} coins</span>
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">{item.rarity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="wallpapers">
                {categorizedItems.wallpapers.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">No wallpapers in the catalog yet</p>
                ) : (
                  <div className="space-y-2">
                    {categorizedItems.wallpapers.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">({item.id})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.cost} coins</span>
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">{item.rarity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="flooring">
                {categorizedItems.flooring.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">No flooring in the catalog yet</p>
                ) : (
                  <div className="space-y-2">
                    {categorizedItems.flooring.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">({item.id})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.cost} coins</span>
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">{item.rarity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
