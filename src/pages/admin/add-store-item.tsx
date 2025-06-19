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

  const generateItemCode = () => {
    const code = `{
  id: "${newItem.id}",
  name: "${newItem.name}",
  type: "${newItem.type}",
  cost: ${newItem.cost},
  description: "${newItem.description}",
  rarity: "${newItem.rarity}",
  imageUrl: "/avatars/items/${newItem.type.includes('hat') ? 'hats' : 'accessories'}/${newItem.id}.png"
}`;
    setGeneratedCode(code);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    alert('Code copied to clipboard! Add it to STORE_CATALOG in currency-types.ts');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
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
                  <SelectItem value="avatar_accessory">Avatar Accessory</SelectItem>
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
            <div className="space-y-2">
              {STORE_CATALOG
                .filter(item => item.type.startsWith('avatar'))
                .map(item => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">({item.id})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.cost} coins</span>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">{item.type}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
