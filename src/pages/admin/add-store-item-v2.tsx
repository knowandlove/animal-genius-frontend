import { useState, useRef } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Upload, Edit, Trash2, Image as ImageIcon, Save, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import type { StoreItem } from '@/shared/store-types';

export default function AddStoreItem() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('add');
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [newItem, setNewItem] = useState({
    name: '',
    itemType: 'avatar_hat' as const,
    cost: 100,
    description: '',
    rarity: 'common' as const,
    isActive: true,
    sortOrder: 0
  });
  
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch existing items
  const { data: storeItems = [], isLoading } = useQuery({
    queryKey: ['/api/store/admin/items'],
    queryFn: () => apiRequest('GET', '/api/store/admin/items'),
  });

  // Create item mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof newItem & { imageUrl?: string }) => {
      return apiRequest('POST', '/api/store/admin/items', data);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Store item created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/store/admin/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/store/catalog'] });
      resetForm();
      setActiveTab('manage');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create item",
        variant: "destructive",
      });
    },
  });

  // Update item mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StoreItem> }) => {
      return apiRequest('PUT', `/api/store/admin/items/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Store item updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/store/admin/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/store/catalog'] });
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update item",
        variant: "destructive",
      });
    },
  });

  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/store/admin/items/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Store item deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/store/admin/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/store/catalog'] });
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  // Upload image mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/store/admin/upload/store-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      return response.json();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setNewItem({
      name: '',
      itemType: 'avatar_hat',
      cost: 100,
      description: '',
      rarity: 'common',
      isActive: true,
      sortOrder: 0
    });
    setUploadedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let imageUrl = undefined;
    
    // Upload image first if provided
    if (uploadedImage) {
      try {
        const uploadResult = await uploadMutation.mutateAsync(uploadedImage);
        imageUrl = uploadResult.imageUrl;
      } catch (error) {
        return; // Error already handled by mutation
      }
    }
    
    // Create item with image URL
    createMutation.mutate({
      ...newItem,
      imageUrl
    });
  };

  const handleUpdate = async (item: StoreItem, updates: Partial<StoreItem>) => {
    updateMutation.mutate({ id: item.id, data: updates });
  };

  const handleToggleActive = (item: StoreItem) => {
    handleUpdate(item, { isActive: !item.isActive });
  };

  // Group items by type
  const categorizedItems = {
    avatar_hat: storeItems.filter((item: StoreItem) => item.itemType === 'avatar_hat'),
    avatar_accessory: storeItems.filter((item: StoreItem) => item.itemType === 'avatar_accessory'),
    room_furniture: storeItems.filter((item: StoreItem) => item.itemType === 'room_furniture'),
    room_decoration: storeItems.filter((item: StoreItem) => item.itemType === 'room_decoration'),
    room_wallpaper: storeItems.filter((item: StoreItem) => item.itemType === 'room_wallpaper'),
    room_flooring: storeItems.filter((item: StoreItem) => item.itemType === 'room_flooring'),
  };

  const getItemTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      avatar_hat: 'Hats',
      avatar_accessory: 'Accessories',
      room_furniture: 'Furniture',
      room_decoration: 'Decorations',
      room_wallpaper: 'Wallpapers',
      room_flooring: 'Flooring'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Store Management</CardTitle>
            <p className="text-muted-foreground">
              Add and manage items in the student store
            </p>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="add">Add New Item</TabsTrigger>
                <TabsTrigger value="manage">Manage Items ({storeItems.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="add" className="mt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Display Name</Label>
                      <Input
                        value={newItem.name}
                        onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Wizard Hat"
                        required
                      />
                    </div>

                    <div>
                      <Label>Item Type</Label>
                      <Select 
                        value={newItem.itemType} 
                        onValueChange={(value: any) => setNewItem(prev => ({ ...prev, itemType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="avatar_hat">Avatar Hat</SelectItem>
                          <SelectItem value="avatar_accessory">Avatar Accessory</SelectItem>
                          <SelectItem value="room_furniture">Room Furniture</SelectItem>
                          <SelectItem value="room_decoration">Room Decoration</SelectItem>
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
                        min="0"
                        required
                      />
                    </div>

                    <div>
                      <Label>Rarity</Label>
                      <Select 
                        value={newItem.rarity} 
                        onValueChange={(value: any) => setNewItem(prev => ({ ...prev, rarity: value }))}
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

                    <div>
                      <Label>Sort Order</Label>
                      <Input
                        type="number"
                        value={newItem.sortOrder}
                        onChange={(e) => setNewItem(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                        min="0"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={newItem.isActive}
                        onCheckedChange={(checked) => setNewItem(prev => ({ ...prev, isActive: checked }))}
                      />
                      <Label htmlFor="active">Active (visible in store)</Label>
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newItem.description}
                      onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="A cool item for your avatar!"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Item Image</Label>
                    <div className="space-y-2">
                      {imagePreview ? (
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-48 object-contain bg-gray-50 rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setUploadedImage(null);
                              setImagePreview(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Click to upload an image
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Max size: 5MB (JPEG, PNG, GIF)
                          </p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || uploadMutation.isPending}
                      className="flex-1"
                    >
                      {createMutation.isPending || uploadMutation.isPending ? (
                        <>
                          <LoadingSpinner className="w-4 h-4 mr-2" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Item
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Reset
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="manage" className="mt-6">
                <div className="space-y-6">
                  {Object.entries(categorizedItems).map(([type, items]) => (
                    <Card key={type}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {getItemTypeLabel(type)} ({items.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {items.length === 0 ? (
                          <p className="text-center py-4 text-muted-foreground">
                            No items in this category
                          </p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Cost</TableHead>
                                <TableHead>Rarity</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {items.map((item: StoreItem) => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    {item.imageUrl ? (
                                      <img 
                                        src={item.imageUrl.startsWith('http') ? item.imageUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${item.imageUrl}`} 
                                        alt={item.name}
                                        className="w-10 h-10 object-contain"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                        <ImageIcon className="w-6 h-6 text-gray-400" />
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-medium">{item.name}</TableCell>
                                  <TableCell>{item.cost} coins</TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={item.rarity === 'legendary' ? 'default' : 'secondary'}
                                      className={cn(
                                        item.rarity === 'legendary' && 'bg-yellow-500',
                                        item.rarity === 'rare' && 'bg-purple-500'
                                      )}
                                    >
                                      {item.rarity}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Switch
                                      checked={item.isActive}
                                      onCheckedChange={() => handleToggleActive(item)}
                                      disabled={updateMutation.isPending}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingItem(item)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => setDeleteConfirm(item.id)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
              <DialogDescription>
                Update the details for {editingItem?.name}
              </DialogDescription>
            </DialogHeader>
            {editingItem && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleUpdate(editingItem, {
                    name: formData.get('name') as string,
                    description: formData.get('description') as string || undefined,
                    cost: parseInt(formData.get('cost') as string),
                    sortOrder: parseInt(formData.get('sortOrder') as string),
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <Label>Name</Label>
                  <Input name="name" defaultValue={editingItem.name} required />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    name="description" 
                    defaultValue={editingItem.description || ''} 
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cost</Label>
                    <Input 
                      name="cost" 
                      type="number" 
                      defaultValue={editingItem.cost} 
                      min="0"
                      required 
                    />
                  </div>
                  <div>
                    <Label>Sort Order</Label>
                    <Input 
                      name="sortOrder" 
                      type="number" 
                      defaultValue={editingItem.sortOrder}
                      min="0"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Item</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this item? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
