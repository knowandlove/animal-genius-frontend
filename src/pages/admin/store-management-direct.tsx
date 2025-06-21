import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Upload, Package, AlertTriangle, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StoreItem {
  id: string;
  name: string;
  description?: string;
  itemType: string;
  cost: number;
  rarity: string;
  isActive: boolean;
  sortOrder: number;
  imageUrl?: string;
}

const ITEM_TYPES = [
  { value: 'avatar_hat', label: 'Avatar Hat' },
  { value: 'avatar_accessory', label: 'Avatar Accessory' },
  { value: 'room_furniture', label: 'Room Furniture' },
  { value: 'room_decoration', label: 'Room Decoration' },
  { value: 'room_wallpaper', label: 'Room Wallpaper' },
  { value: 'room_flooring', label: 'Room Flooring' },
];

const RARITIES = [
  { value: 'common', label: 'Common', color: 'bg-gray-500' },
  { value: 'rare', label: 'Rare', color: 'bg-blue-500' },
  { value: 'legendary', label: 'Legendary', color: 'bg-yellow-500' },
];

export default function StoreManagementDirect() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('manage');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedAssetId, setUploadedAssetId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    itemType: 'avatar_hat',
    cost: 10,
    rarity: 'common',
    isActive: true,
    sortOrder: 0,
  });

  // Fetch all store items
  const { data: items = [], isLoading } = useQuery<StoreItem[]>({
    queryKey: ['/api/store/admin/items'],
    queryFn: () => apiRequest('GET', '/api/store/admin/items'),
  });

  // Upload file function
  const uploadFile = async (file: File, itemType: string) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', itemType);
    
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/assets/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }
    
    return response.json();
  };

  // Create item mutation
  const createItem = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/store/admin/items', data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Item created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/store/admin/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/store/catalog'] }); // Also invalidate public catalog
      resetForm();
      setActiveTab('manage');
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create item",
        variant: "destructive" 
      });
    },
  });

  // Update item mutation
  const updateItem = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest('PUT', `/api/store/admin/items/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Item updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/store/admin/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/store/catalog'] }); // Also invalidate public catalog
      setShowEditDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update item",
        variant: "destructive" 
      });
    },
  });

  // Delete item mutation
  const deleteItem = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/store/admin/items/${id}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Item deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/store/admin/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/store/catalog'] }); // Also invalidate public catalog
      setShowDeleteDialog(false);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete item",
        variant: "destructive" 
      });
    },
  });

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Upload the file
      const result = await uploadFile(file, formData.itemType);
      
      // Store the URL and assetId
      setUploadedImageUrl(result.url);
      setUploadedAssetId(result.assetId);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload image',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      itemType: 'avatar_hat',
      cost: 10,
      rarity: 'common',
      isActive: true,
      sortOrder: 0,
    });
    setUploadedImageUrl(null);
    setUploadedAssetId(null);
  };

  const handleEdit = (item: StoreItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      itemType: item.itemType,
      cost: item.cost,
      rarity: item.rarity,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setShowEditDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadedImageUrl && !selectedItem) {
      toast({
        title: "Error",
        description: "Please upload an image first",
        variant: "destructive"
      });
      return;
    }

    if (selectedItem) {
      updateItem.mutate({ id: selectedItem.id, data: formData });
    } else {
      createItem.mutate({
        ...formData,
        imageUrl: uploadedImageUrl,
        assetId: uploadedAssetId,
      });
    }
  };

  // Group items by type
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.itemType]) acc[item.itemType] = [];
    acc[item.itemType].push(item);
    return acc;
  }, {} as Record<string, StoreItem[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/admin")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Admin
              </Button>
              <div className="flex items-center gap-2">
                <Package className="h-8 w-8 text-purple-600" />
                <h1 className="text-3xl font-bold">Store Management</h1>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {items.length} Total Items
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage">Manage Items</TabsTrigger>
          <TabsTrigger value="add">Add New Item</TabsTrigger>
        </TabsList>

        {/* Manage Items Tab */}
        <TabsContent value="manage" className="space-y-4">
          {Object.entries(groupedItems).map(([type, typeItems]) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="text-xl">
                  {ITEM_TYPES.find(t => t.value === type)?.label || type}
                </CardTitle>
                <CardDescription>
                  {typeItems.length} items in this category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeItems.map((item) => (
                    <Card key={item.id} className="relative">
                      <CardContent className="p-4">
                        {/* Active toggle */}
                        <div className="absolute top-2 right-2 z-10">
                          <Badge variant={item.isActive ? "default" : "secondary"}>
                            {item.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        
                        {/* Item image */}
                        {item.imageUrl && (
                          <div className="mb-3 aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <img 
                              src={item.imageUrl} 
                              alt={item.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        
                        {/* Item details */}
                        <h3 className="font-semibold mb-1">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.description || 'No description'}
                        </p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <Badge className={RARITIES.find(r => r.value === item.rarity)?.color}>
                            {item.rarity}
                          </Badge>
                          <span className="font-semibold">{item.cost} coins</span>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowDeleteDialog(true);
                            }}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {items.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Store Items Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first store item.
                </p>
                <Button onClick={() => setActiveTab('add')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Add New Item Tab */}
        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add New Store Item</CardTitle>
              <CardDescription>
                Upload an image and fill in the details to create a new store item
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left column - Image upload */}
                  <div className="space-y-4">
                    <div>
                      <Label>Item Image</Label>
                      {!uploadedImageUrl ? (
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                            className="hidden"
                            id="file-upload"
                          />
                          <label
                            htmlFor="file-upload"
                            className={`block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                              ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}`}
                          >
                            {isUploading ? (
                              <>
                                <LoadingSpinner className="h-10 w-10 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Uploading...</p>
                              </>
                            ) : (
                              <>
                                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">
                                  Click to upload an image
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  PNG, JPG, GIF, WebP up to 10MB
                                </p>
                              </>
                            )}
                          </label>
                        </div>
                      ) : (
                        <div className="mt-2 space-y-4">
                          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={uploadedImageUrl}
                              alt="Preview"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setUploadedImageUrl(null);
                              setUploadedAssetId(null);
                            }}
                            className="w-full"
                          >
                            Remove & Choose Different Image
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right column - Item details */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="itemType">Item Type</Label>
                      <Select
                        value={formData.itemType}
                        onValueChange={(value) => setFormData({ ...formData, itemType: value })}
                        disabled={!!uploadedImageUrl}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ITEM_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {uploadedImageUrl && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Cannot change type after uploading
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="name">Item Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Wizard Hat"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cost">Cost (coins)</Label>
                        <Input
                          id="cost"
                          type="number"
                          min="0"
                          max="10000"
                          value={formData.cost}
                          onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="rarity">Rarity</Label>
                        <Select
                          value={formData.rarity}
                          onValueChange={(value) => setFormData({ ...formData, rarity: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RARITIES.map((rarity) => (
                              <SelectItem key={rarity.value} value={rarity.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${rarity.color}`} />
                                  {rarity.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description (optional)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="A magical hat that sparkles..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Form actions */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createItem.isPending || !uploadedImageUrl || !formData.name}
                  >
                    {createItem.isPending ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Item
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Store Item</DialogTitle>
            <DialogDescription>
              Update the details for {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Show current image */}
            {selectedItem?.imageUrl && (
              <div className="aspect-square max-w-xs mx-auto bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={selectedItem.imageUrl} 
                  alt={selectedItem.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            
            <Alert>
              <ImageIcon className="h-4 w-4" />
              <AlertDescription>
                To change the image, delete this item and create a new one.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Item Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-type">Item Type</Label>
                <Select
                  value={formData.itemType}
                  onValueChange={(value) => setFormData({ ...formData, itemType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-cost">Cost (coins)</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  min="0"
                  max="10000"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-rarity">Rarity</Label>
                <Select
                  value={formData.rarity}
                  onValueChange={(value) => setFormData({ ...formData, rarity: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RARITIES.map((rarity) => (
                      <SelectItem key={rarity.value} value={rarity.value}>
                        {rarity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-sort">Sort Order</Label>
                <Input
                  id="edit-sort"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="edit-active">Active (visible in store)</Label>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateItem.isPending}>
                {updateItem.isPending ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Store Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedItem?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              This will permanently remove the item from the store. Students who already own this item will keep it.
            </AlertDescription>
          </Alert>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedItem && deleteItem.mutate(selectedItem.id)}
              disabled={deleteItem.isPending}
            >
              {deleteItem.isPending ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Item'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
