import { useState } from "react";
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
import { Slider } from "@/components/ui/slider";
import { Plus, Edit, Trash2, Upload, ArrowLeft, Dog, Cat, Bird, Rabbit, Fish, Sparkles, Image } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SpriteUploadGuide from "@/components/admin/SpriteUploadGuide";

interface Pet {
  id: string;
  species: string;
  name: string;
  description?: string;
  assetUrl?: string;
  cost: number;
  rarity: string;
  baseStats: {
    hungerDecayRate: number;
    happinessDecayRate: number;
    spriteMetadata?: {
      frameCount: number;
      frameWidth: number;
      frameHeight: number;
      animationSpeed: number;
    };
  };
  isActive: boolean;
  sortOrder: number;
  ownerCount?: number;
}

const RARITIES = [
  { value: 'common', label: 'Common', color: 'bg-green-500' },
  { value: 'uncommon', label: 'Uncommon', color: 'bg-gray-500' },
  { value: 'rare', label: 'Rare', color: 'bg-blue-500' },
  { value: 'epic', label: 'Epic', color: 'bg-purple-500' },
  { value: 'legendary', label: 'Legendary', color: 'bg-orange-500' },
];

const SPECIES_ICONS: Record<string, React.ReactNode> = {
  dog: <Dog className="w-4 h-4" />,
  cat: <Cat className="w-4 h-4" />,
  bird: <Bird className="w-4 h-4" />,
  rabbit: <Rabbit className="w-4 h-4" />,
  fish: <Fish className="w-4 h-4" />,
};

export default function PetManagement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("manage");
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isUploadingSprite, setIsUploadingSprite] = useState(false);
  
  // Form state for new pet
  const [formData, setFormData] = useState({
    species: '',
    name: '',
    description: '',
    cost: 100,
    rarity: 'common',
    baseStats: {
      hungerDecayRate: 2,
      happinessDecayRate: 3,
    },
    isActive: true,
    sortOrder: 0,
  });
  
  // Image upload state
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Sprite metadata form
  const [spriteMetadata, setSpriteMetadata] = useState({
    frameCount: 4,
    frameWidth: 32,
    frameHeight: 32,
    animationSpeed: 150,
  });

  // Fetch all pets
  const { data: pets = [], isLoading } = useQuery<Pet[]>({
    queryKey: ['/api/admin/pets'],
    queryFn: () => apiRequest('GET', '/api/admin/pets'),
  });

  // Upload image function
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'pets');
    
    const response = await fetch('/api/admin/upload-asset', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    
    const data = await response.json();
    return data.assetUrl;
  };

  // Create pet mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Upload image first if selected
      let assetUrl = uploadedImageUrl;
      if (imageFile && !uploadedImageUrl) {
        setIsUploadingImage(true);
        try {
          assetUrl = await uploadImage(imageFile);
          setUploadedImageUrl(assetUrl);
        } catch (error) {
          throw new Error('Failed to upload image');
        } finally {
          setIsUploadingImage(false);
        }
      }
      
      // Create pet with image URL and sprite metadata
      const petData: any = {
        ...data,
        assetUrl,
      };
      
      // Add sprite metadata to baseStats if it's a sprite sheet
      if (imageFile && spriteMetadata.frameCount > 1) {
        petData.baseStats = {
          ...data.baseStats,
          spriteMetadata,
        };
      }
      
      return apiRequest('POST', '/api/admin/pets', petData);
    },
    onSuccess: () => {
      toast({
        title: "Pet created",
        description: "The new pet has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pets'] });
      setActiveTab('manage');
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create pet",
        variant: "destructive",
      });
    },
  });

  // Update pet mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pet> }) => 
      apiRequest('PUT', `/api/admin/pets/${id}`, data),
    onSuccess: () => {
      toast({
        title: "Pet updated",
        description: "The pet has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pets'] });
      setShowEditDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update pet",
        variant: "destructive",
      });
    },
  });

  // Delete pet mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', `/api/admin/pets/${id}`),
    onSuccess: () => {
      toast({
        title: "Pet deleted",
        description: "The pet has been marked as inactive.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pets'] });
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete pet",
        variant: "destructive",
      });
    },
  });

  // Upload sprite mutation
  const uploadSprite = async (petId: string, file: File) => {
    const formData = new FormData();
    formData.append('sprite', file);
    formData.append('spriteMetadata', JSON.stringify(spriteMetadata));

    try {
      setIsUploadingSprite(true);
      const response = await fetch(`/api/admin/pets/${petId}/upload-sprite`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      toast({
        title: "Sprite uploaded",
        description: "The sprite sheet has been uploaded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pets'] });
      return result;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload sprite",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploadingSprite(false);
    }
  };

  const resetForm = () => {
    setFormData({
      species: '',
      name: '',
      description: '',
      cost: 100,
      rarity: 'common',
      baseStats: {
        hungerDecayRate: 2,
        happinessDecayRate: 3,
      },
      isActive: true,
      sortOrder: 0,
    });
    setUploadedImageUrl(null);
    setImageFile(null);
  };
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (pet: Pet) => {
    setSelectedPet(pet);
    setShowEditDialog(true);
  };

  const handleSpriteUpload = async (petId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    await uploadSprite(petId, file);
  };

  // Group pets by type
  const petsByType = pets.reduce((acc, pet) => {
    const type = pet.species.split('_')[1] || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(pet);
    return acc;
  }, {} as Record<string, Pet[]>);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
          <h1 className="text-3xl font-bold">Pet Management</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="manage">All Pets</TabsTrigger>
          <TabsTrigger value="add">Add New Pet</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-6">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </CardContent>
            </Card>
          ) : pets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">No pets found</p>
                <Button onClick={() => setActiveTab('add')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Pet
                </Button>
              </CardContent>
            </Card>
          ) : (
            Object.entries(petsByType).map(([type, typePets]) => (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {SPECIES_ICONS[type] || <Sparkles className="w-5 h-5" />}
                    {type.charAt(0).toUpperCase() + type.slice(1)}s
                  </CardTitle>
                  <CardDescription>
                    {typePets.length} pets in this category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {typePets.map((pet) => (
                      <Card key={pet.id} className="relative">
                        <CardContent className="p-3">
                          {/* Active indicator */}
                          <div className="absolute top-1 right-1 z-10">
                            <div 
                              className={`w-2 h-2 rounded-full ${pet.isActive ? 'bg-green-500' : 'bg-red-500'}`}
                              title={pet.isActive ? "Active" : "Inactive"}
                            />
                          </div>
                          
                          {/* Pet image */}
                          {pet.assetUrl && (
                            <div className="mb-2 w-24 h-24 bg-gray-100 rounded overflow-hidden mx-auto">
                              <img 
                                src={pet.assetUrl} 
                                alt={pet.name}
                                className="w-full h-full object-contain"
                                style={{ imageRendering: 'pixelated' }}
                              />
                            </div>
                          )}
                          
                          {/* Pet details */}
                          <h3 className="font-medium text-sm text-center truncate">{pet.name}</h3>
                          <p className="text-xs text-muted-foreground text-center">{pet.species}</p>
                          
                          <div className="flex items-center justify-between my-2">
                            <Badge className={`${RARITIES.find(r => r.value === pet.rarity)?.color} text-[10px] py-0 px-1`}>
                              {pet.rarity}
                            </Badge>
                            <span className="text-[10px] font-medium">{pet.cost}c</span>
                          </div>
                          
                          {pet.ownerCount !== undefined && (
                            <p className="text-xs text-center text-muted-foreground">
                              {pet.ownerCount} owners
                            </p>
                          )}
                          
                          {/* Actions */}
                          <div className="flex gap-1 justify-center mt-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(pet)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedPet(pet);
                                setShowDeleteDialog(true);
                              }}
                              className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {/* Sprite upload */}
                          <div className="mt-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleSpriteUpload(pet.id, e)}
                              className="hidden"
                              id={`sprite-${pet.id}`}
                              disabled={isUploadingSprite}
                            />
                            <label
                              htmlFor={`sprite-${pet.id}`}
                              className="text-[10px] text-blue-600 hover:underline cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Upload className="w-3 h-3" />
                              Upload Sprite
                            </label>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add New Pet</CardTitle>
              <CardDescription>
                Create a new pet type for students to purchase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="species">Species Code</Label>
                  <Input
                    id="species"
                    value={formData.species}
                    onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                    placeholder="e.g., code_dog, cyber_cat"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: adjective_animal
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Code Dog"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="A friendly companion that loves debugging code..."
                  rows={3}
                />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-4">
                <Label>Pet Image / Sprite Sheet</Label>
                {!uploadedImageUrl ? (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      disabled={isUploadingImage}
                      className="hidden"
                      id="pet-image-upload"
                    />
                    <label
                      htmlFor="pet-image-upload"
                      className="block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-gray-400"
                    >
                      <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to upload pet image or sprite sheet
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative w-48 h-48 bg-gray-100 rounded-lg overflow-hidden mx-auto">
                      <img
                        src={uploadedImageUrl}
                        alt="Pet preview"
                        className="w-full h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setUploadedImageUrl(null);
                        setImageFile(null);
                      }}
                      className="w-full"
                    >
                      Remove & Choose Different Image
                    </Button>
                    
                    {/* Sprite Format Guide */}
                    <SpriteUploadGuide />
                    
                    {/* Sprite Sheet Configuration */}
                    <Card className="bg-gray-50">
                      <CardHeader>
                        <CardTitle className="text-sm">Sprite Sheet Configuration (Optional)</CardTitle>
                        <CardDescription className="text-xs">
                          If this is an animated sprite sheet, configure the animation settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Frame Count</Label>
                            <Input
                              type="number"
                              value={spriteMetadata.frameCount}
                              onChange={(e) => setSpriteMetadata({
                                ...spriteMetadata,
                                frameCount: parseInt(e.target.value) || 4
                              })}
                              min={1}
                              max={20}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Animation Speed (ms)</Label>
                            <Input
                              type="number"
                              value={spriteMetadata.animationSpeed}
                              onChange={(e) => setSpriteMetadata({
                                ...spriteMetadata,
                                animationSpeed: parseInt(e.target.value) || 150
                              })}
                              min={50}
                              max={1000}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Frame Width (px)</Label>
                            <Input
                              type="number"
                              value={spriteMetadata.frameWidth}
                              onChange={(e) => setSpriteMetadata({
                                ...spriteMetadata,
                                frameWidth: parseInt(e.target.value) || 32
                              })}
                              min={1}
                              max={512}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Frame Height (px)</Label>
                            <Input
                              type="number"
                              value={spriteMetadata.frameHeight}
                              onChange={(e) => setSpriteMetadata({
                                ...spriteMetadata,
                                frameHeight: parseInt(e.target.value) || 32
                              })}
                              min={1}
                              max={512}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          For your corgi sprite: 4 frames, 32x32px each, 150ms speed
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost">Cost (coins)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
                    min={0}
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
                          {rarity.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Base Stats</h4>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Hunger Decay Rate</Label>
                    <span className="text-sm text-muted-foreground">
                      {formData.baseStats.hungerDecayRate} / hour
                    </span>
                  </div>
                  <Slider
                    value={[formData.baseStats.hungerDecayRate]}
                    onValueChange={([value]) => setFormData({
                      ...formData,
                      baseStats: { ...formData.baseStats, hungerDecayRate: value }
                    })}
                    min={0}
                    max={10}
                    step={0.5}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Happiness Decay Rate</Label>
                    <span className="text-sm text-muted-foreground">
                      {formData.baseStats.happinessDecayRate} / hour
                    </span>
                  </div>
                  <Slider
                    value={[formData.baseStats.happinessDecayRate]}
                    onValueChange={([value]) => setFormData({
                      ...formData,
                      baseStats: { ...formData.baseStats, happinessDecayRate: value }
                    })}
                    min={0}
                    max={10}
                    step={0.5}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="active">Active (available for purchase)</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={resetForm}
                >
                  Reset
                </Button>
                <Button
                  onClick={() => createMutation.mutate(formData)}
                  disabled={createMutation.isPending || !formData.species || !formData.name}
                >
                  {createMutation.isPending && <LoadingSpinner className="w-4 h-4 mr-2" />}
                  Create Pet
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pet</DialogTitle>
            <DialogDescription>
              Update pet details and stats
            </DialogDescription>
          </DialogHeader>
          {selectedPet && (
            <div className="space-y-4">
              <Input
                value={selectedPet.name}
                onChange={(e) => setSelectedPet({ ...selectedPet, name: e.target.value })}
                placeholder="Pet name"
              />
              <Textarea
                value={selectedPet.description || ''}
                onChange={(e) => setSelectedPet({ ...selectedPet, description: e.target.value })}
                placeholder="Description"
                rows={3}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  value={selectedPet.cost}
                  onChange={(e) => setSelectedPet({ ...selectedPet, cost: parseInt(e.target.value) || 0 })}
                  placeholder="Cost"
                />
                <Select
                  value={selectedPet.rarity}
                  onValueChange={(value) => setSelectedPet({ ...selectedPet, rarity: value })}
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
              <div className="flex items-center space-x-2">
                <Switch
                  checked={selectedPet.isActive}
                  onCheckedChange={(checked) => setSelectedPet({ ...selectedPet, isActive: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedPet && updateMutation.mutate({
                id: selectedPet.id,
                data: selectedPet
              })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <LoadingSpinner className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pet</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedPet?.name}"? 
              {selectedPet?.ownerCount && selectedPet.ownerCount > 0 && (
                <Alert className="mt-2">
                  <AlertDescription>
                    This pet is owned by {selectedPet.ownerCount} students and cannot be deleted. 
                    It will be marked as inactive instead.
                  </AlertDescription>
                </Alert>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedPet && deleteMutation.mutate(selectedPet.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <LoadingSpinner className="w-4 h-4 mr-2" />}
              Delete Pet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}