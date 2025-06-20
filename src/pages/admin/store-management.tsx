import { uploadImage, validateImageFile } from "@/lib/secure-upload";import { useState, useCallback } from "react";
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
import { Plus, Edit, Trash2, Upload, Package, Sparkles, AlertTriangle, ArrowLeft } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useDropzone } from "react-dropzone";

interface StoreItem {
  id: string;
  name: string;
  description?: string;
  itemType: string;
  cost: number;
  imageUrl?: string;
  rarity: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
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

export default function StoreManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('manage');
  
  // Form state for new/edit item
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    itemType: 'avatar_hat',
    cost: 10,
    rarity: 'common',
    isActive: true,
    sortOrder: 0,
  });
  
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch all store items
  const { data: items = [], isLoading } = useQuery<StoreItem[]>({
    queryKey: ['/api/store/admin/items'],
    queryFn: () => apiRequest('GET', '/api/store/admin/items'),
  });

  // Create item mutation
  const createItem = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating item with data:', data);
      
      // First upload image if present
      let imageUrl = data.imageUrl;
      let assetId = undefined;
      
      if (uploadedImage) {
        // Validate file before upload
        const validation = validateImageFile(uploadedImage);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
        
        // Show upload progress
        toast({ 
          title: "Uploading image...", 
          description: "Please wait while we securely upload your image" 
        });
        
        const uploadResult = await uploadImage({
          file: uploadedImage,
          type: 'item',
          itemType: data.itemType,
          name: data.name,
          bucket: 'store-items',
          onProgress: (progress) => {
            console.log(`Upload progress: ${progress}%`);
          }
        });
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload image');
        }
        
        imageUrl = uploadResult.url;
        assetId = uploadResult.assetId;
      }
      
      const payload = {
        ...data,
      };
      
      // Add image data if we have it
      if (imageUrl) {
        payload.imageUrl = imageUrl;
      }
      if (assetId) {
        payload.assetId = assetId;
      }
      
      console.log('Sending payload to API:', payload);
      
      return apiRequest('POST', '/api/store/admin/items', payload);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Item created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/store/admin/items'] });
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
      // Upload new image if changed
      let imageUrl = data.imageUrl;
      let assetId = data.assetId;
      
      if (uploadedImage) {
        // Validate file before upload
        const validation = validateImageFile(uploadedImage);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
        
        // Show upload progress
        toast({ 
          title: "Uploading new image...", 
          description: "Please wait while we update the image" 
        });
        
        const uploadResult = await uploadImage({
          file: uploadedImage,
          type: 'item',
          itemType: data.itemType,
          name: data.name,
          bucket: 'store-items',
          onProgress: (progress) => {
            console.log(`Upload progress: ${progress}%`);
          }
        });
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload image');
        }
        
        imageUrl = uploadResult.url;
        assetId = uploadResult.assetId;
      }
      
      return apiRequest('PUT', `/api/store/admin/items/${id}`, {
        ...data,
        imageUrl,
        assetId,
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Item updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/store/admin/items'] });
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

  // Toggle item active status
  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      apiRequest('PUT', `/api/store/admin/items/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/store/admin/items'] });
    },
  });

  // Image upload handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setUploadedImage(acceptedFiles[0]);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

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
    setUploadedImage(null);
    setImagePreview(null);
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
    setImagePreview(item.imageUrl || null);
    setShowEditDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem) {
      updateItem.mutate({ id: selectedItem.id, data: formData });
    } else {
      createItem.mutate(formData);
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
                          <Switch
                            checked={item.isActive}
                            onCheckedChange={(checked) => 
                              toggleActive.mutate({ id: item.id, isActive: checked })
                            }
                          />
                        </div>
                        
                        {/* Item image */}
                        {item.imageUrl && (
                          <div className="mb-3 aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <img 
                              src={item.imageUrl} 
                              alt={item.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                console.error('Image failed to load:', item.imageUrl);
                                e.currentTarget.style.display = 'none';
                              }}
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
                Create a new item for students to purchase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left column */}
                  <div className="space-y-4">
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
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="A magical hat that sparkles..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="itemType">Item Type</Label>
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
                  </div>
                  
                  {/* Right column - Image upload */}
                  <div>
                    <Label>Item Image</Label>
                    <div
                      {...getRootProps()}
                      className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                        ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}`}
                    >
                      <input {...getInputProps()} />
                      {imagePreview ? (
                        <div className="space-y-4">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="mx-auto max-w-full max-h-48 rounded"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedImage(null);
                              setImagePreview(null);
                            }}
                          >
                            Remove Image
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-10 w-10 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-600">
                            Drop an image here, or click to select
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF, WebP up to 10MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Form actions */}
                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={createItem.isPending}
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
            
            <div>
              <Label>Image</Label>
              <div
                {...getRootProps()}
                className={`mt-2 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}`}
              >
                <input {...getInputProps()} />
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="mx-auto max-h-32 rounded" 
                  />
                ) : (
                  <p className="text-sm text-gray-500">Click or drag to change image</p>
                )}
              </div>
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
