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
  thumbnailUrl?: string;
  assetType?: string;
  riveUrl?: string;
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
  { value: 'common', label: 'Common', color: 'bg-green-500' },
  { value: 'rare', label: 'Rare', color: 'bg-blue-500' },
  { value: 'epic', label: 'Epic', color: 'bg-purple-500' },
  { value: 'legendary', label: 'Legendary', color: 'bg-orange-500' },
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
  const [uploadedThumbnailUrl, setUploadedThumbnailUrl] = useState<string | null>(null);
  const [uploadedAssetId, setUploadedAssetId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [assetType, setAssetType] = useState<'image' | 'rive'>('image');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  
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

  // Upload file function with support for thumbnails
  const uploadFile = async (mainFile: File, itemType: string, thumbnail?: File) => {
    const formData = new FormData();
    formData.append('image', mainFile);
    formData.append('type', itemType);
    formData.append('assetType', assetType);
    
    if (thumbnail) {
      formData.append('thumbnail', thumbnail);
    }
    
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
      
      // Check if this is a RIVE file
      const isRive = file.name.toLowerCase().endsWith('.riv');
      if (isRive) {
        setAssetType('rive');
      }
      
      // Upload the file with thumbnail if needed
      const result = await uploadFile(file, formData.itemType, thumbnailFile || undefined);
      
      // Store the URLs and assetId
      setUploadedImageUrl(result.url);
      setUploadedThumbnailUrl(result.thumbnailUrl);
      setUploadedAssetId(result.assetId);
      
      toast({
        title: "Success",
        description: isRive ? "RIVE animation uploaded successfully" : "Image uploaded successfully"
      });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload file',
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
    setUploadedThumbnailUrl(null);
    setUploadedAssetId(null);
    setAssetType('image');
    setThumbnailFile(null);
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
    
    // For wallpaper and flooring, we don't require an upload
    const isPatternItem = ['room_wallpaper', 'room_flooring'].includes(formData.itemType);
    
    if (!uploadedImageUrl && !selectedItem && !isPatternItem) {
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
        thumbnailUrl: uploadedThumbnailUrl,
        assetId: uploadedAssetId,
        assetType: assetType,
        riveUrl: assetType === 'rive' ? uploadedImageUrl : undefined,
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
                <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
                  {typeItems.map((item) => (
                    <Card key={item.id} className="relative max-w-[150px]">
                      <CardContent className="p-2">
                        {/* Active toggle */}
                        <div className="absolute top-1 right-1 z-10">
                          <div 
                            className={`w-2 h-2 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-red-500'}`}
                            title={item.isActive ? "Active" : "Inactive"}
                          />
                        </div>
                        
                        {/* Item image - use thumbnail if available */}
                        {(item.thumbnailUrl || item.imageUrl) && (
                          <div className="mb-2 w-[80px] h-[80px] bg-gray-100 rounded overflow-hidden mx-auto">
                            {item.assetType === 'rive' && item.thumbnailUrl ? (
                              <div className="relative w-full h-full">
                                <img 
                                  src={item.thumbnailUrl} 
                                  alt={item.name}
                                  className="w-full h-full object-contain"
                                />
                                <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                                  RIVE
                                </div>
                              </div>
                            ) : (
                              <img 
                                src={item.thumbnailUrl || item.imageUrl} 
                                alt={item.name}
                                className="w-full h-full object-contain"
                              />
                            )}
                          </div>
                        )}
                        
                        {/* Item details */}
                        <h3 className="font-medium text-xs truncate text-center">{item.name}</h3>
                        
                        <div className="flex items-center justify-between mb-1 mt-1">
                          <Badge className={`${RARITIES.find(r => r.value === item.rarity)?.color} text-[10px] py-0 px-1`}>
                            {item.rarity}
                          </Badge>
                          <span className="text-[10px] font-medium">{item.cost}c</span>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(item)}
                            className="h-6 w-6 p-0"
                            title="Edit item"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowDeleteDialog(true);
                            }}
                            className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                            title="Delete item"
                          >
                            <Trash2 className="h-3 w-3" />
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
                  {/* Left column - Asset upload */}
                  <div className="space-y-4">
                    {/* Asset Type Selection */}
                    <div>
                      <Label>Asset Type</Label>
                      <Select
                        value={assetType}
                        onValueChange={(value: 'image' | 'rive') => setAssetType(value)}
                        disabled={!!uploadedImageUrl}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image">Static Image (PNG, JPG)</SelectItem>
                          <SelectItem value="rive">Animated (RIVE)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Main Asset</Label>
                      {['room_wallpaper', 'room_flooring'].includes(formData.itemType) && (
                        <p className="text-sm text-muted-foreground mt-1 mb-2">
                          Optional - Wallpapers and flooring can use CSS patterns instead of images
                        </p>
                      )}
                      {!uploadedImageUrl ? (
                        <div className="mt-2">
                          <input
                            type="file"
                            accept={assetType === 'rive' ? '.riv' : 'image/*'}
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
                                  Click to upload {assetType === 'rive' ? 'a RIVE animation' : 'an image'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {assetType === 'rive' ? '.riv files only' : 'PNG, JPG, GIF, WebP up to 10MB'}
                                </p>
                              </>
                            )}
                          </label>
                        </div>
                      ) : (
                        <div className="mt-2 space-y-4">
                          <div className="relative w-[200px] h-[200px] bg-gray-100 rounded-lg overflow-hidden mx-auto">
                            {assetType === 'rive' ? (
                              <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                  <Package className="h-16 w-16 text-purple-600 mx-auto mb-2" />
                                  <p className="text-sm font-medium">RIVE Animation</p>
                                  <p className="text-xs text-gray-500">{uploadedImageUrl.split('/').pop()}</p>
                                </div>
                              </div>
                            ) : (
                              <img
                                src={uploadedImageUrl}
                                alt="Preview"
                                className="w-full h-full object-contain"
                              />
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setUploadedImageUrl(null);
                              setUploadedThumbnailUrl(null);
                              setUploadedAssetId(null);
                            }}
                            className="w-full"
                          >
                            Remove & Choose Different Asset
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Thumbnail upload for RIVE files */}
                    {assetType === 'rive' && !uploadedImageUrl && (
                      <div>
                        <Label>Thumbnail (Required for RIVE)</Label>
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/png,image/jpeg"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setThumbnailFile(file);
                            }}
                            className="hidden"
                            id="thumbnail-upload"
                          />
                          <label
                            htmlFor="thumbnail-upload"
                            className="block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-gray-400"
                          >
                            {thumbnailFile ? (
                              <p className="text-sm text-gray-600">
                                Thumbnail selected: {thumbnailFile.name}
                              </p>
                            ) : (
                              <>
                                <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                                <p className="text-sm text-gray-600">
                                  Click to upload thumbnail
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  PNG or JPG (128x128 recommended)
                                </p>
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                    )}
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
                  {
                    // Wallpaper and flooring items can use CSS patterns instead of images
                    (() => {
                      const isPatternItem = ['room_wallpaper', 'room_flooring'].includes(formData.itemType);
                      const isImageRequired = !isPatternItem;
                      const isDisabled = createItem.isPending || (isImageRequired && !uploadedImageUrl) || !formData.name;
                      
                      return (
                        <Button
                          type="submit"
                          disabled={isDisabled}
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
                      );
                    })()
                  }
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
