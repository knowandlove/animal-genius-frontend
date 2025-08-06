import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Coins, ShoppingBag, Droplets, Sparkles, X, Sprout, Users, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useGardenStore } from "@/stores/gardenStore";
import { AnimatePresence, motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { authenticateStudent, checkSession, isAuthError, isPermissionError } from "@/lib/student-auth";
import { storePassportCode, getPassportAuthHeaders, getStoredPassportCode } from "@/lib/passport-auth";
import { useStoreData } from "@/contexts/StoreDataContext";

// Import garden components
import MainGardenView from "@/components/garden/MainGardenView";
import GardenInventory from "@/components/garden/GardenInventory";
import WateringControls from "@/components/garden/WateringControls";
import { PlantingModal } from "@/components/garden/PlantingModal";
import StoreModal from "@/components/room/StoreModal"; // Reuse from room system
import PassportCodeDialog from "@/components/room/PassportCodeDialog"; // Reuse
import AccessDeniedMessage from "@/components/room/AccessDeniedMessage"; // Reuse
import { SaveStatusIndicator } from "@/components/room/SaveStatusIndicator"; // Reuse
import { StudentHeader } from "@/components/StudentHeader";

interface GardenData {
  plot: {
    id: string;
    studentId: string;
    classId: string;
    plotPosition: number;
    gardenTheme: string;
  };
  crops: any[];
  decorations: any[];
}

interface PageData {
  student: {
    id: string;
    passportCode: string;
    studentName: string;
    gradeLevel: string;
    animalType: string;
    personalityType: string;
    currencyBalance: number;
    avatarData: any;
    className: string;
    classId: string;
    classCode?: string;
  };
  garden: GardenData;
  wallet: {
    total: number;
  };
  storeStatus: {
    isOpen: boolean;
    message: string;
    classId: string;
    className: string;
  };
  canEdit?: boolean;
}

export default function StudentGarden() {
  const params = useParams<{ passportCode: string }>();
  const [, setLocation] = useLocation();
  const passportCode = params.passportCode;
  const currentPassportCode = getStoredPassportCode();

  const [attemptedAuth, setAttemptedAuth] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [showPassportDialog, setShowPassportDialog] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showPlantingModal, setShowPlantingModal] = useState(false);
  const [plantingPosition, setPlantingPosition] = useState<{ x: number; y: number } | null>(null);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const queryClient = useQueryClient();

  // Initialize store state
  const { 
    setPlot, 
    setCrops, 
    setStudent, 
    setInventory,
    student,
    plantSeed,
    harvestCrop,
    waterGarden,
    ui,
    crops
  } = useGardenStore();

  // Fetch garden data
  const { data: pageData, isLoading, error, refetch } = useQuery<PageData>({
    queryKey: [`/api/garden/page-data/${passportCode}`],
    queryFn: async () => {
      try {
        // Get student and garden data for the specific passport code
        const response = await apiRequest('GET', `/api/garden/student/${passportCode}`, undefined, {
          headers: getPassportAuthHeaders(),
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to load garden');
        }
        
        if (!response.garden) {
          // Student exists but hasn't created a garden yet
          // Only create if viewing own garden
          if (currentPassportCode === passportCode) {
            // Create garden for this student
            const plotResponse = await apiRequest('GET', `/api/garden/plot/${passportCode}`, undefined, {
              headers: getPassportAuthHeaders(),
            });
            
            if (!plotResponse.success) {
              throw new Error('Failed to create garden');
            }
            
            response.garden = plotResponse.data;
          } else {
            throw new Error('This student has not created a garden yet');
          }
        }

        // TODO: Get proper store status - for now use defaults
        const storeStatus = {
          isOpen: true,
          message: 'Store is open!',
          classId: response.student.classId,
          className: response.student.className || 'Unknown Class',
        };

        return {
          student: {
            id: response.student.id,
            passportCode: response.student.passportCode,
            studentName: response.student.studentName,
            gradeLevel: 'Unknown', // Not included in response
            animalType: response.student.animalType,
            personalityType: response.student.geniusType || '',
            currencyBalance: response.student.currencyBalance || 0,
            avatarData: {}, // TODO: Get avatar data
            className: response.student.className || 'Unknown Class',
            classId: response.student.classId,
            classCode: response.student.classCode || '',
          },
          garden: response.garden,
          wallet: {
            total: response.student.currencyBalance || 0,
          },
          storeStatus,
        };
      } catch (error) {
        if (isAuthError(error) && !attemptedAuth) {
          const authResult = await authenticateStudent(passportCode);
          setAttemptedAuth(true);
          
          if (authResult) {
            storePassportCode(passportCode);
            queryClient.invalidateQueries();
            return;
          } else {
            throw error;
          }
        }
        throw error;
      }
      
      // This should never be reached, but TypeScript needs it
      throw new Error('Failed to load page data');
    },
    enabled: !!passportCode,
    retry: (failureCount, error) => {
      if (isAuthError(error) || isPermissionError(error)) return false;
      return failureCount < 2;
    },
  });

  // Update store when data loads
  useEffect(() => {
    if (pageData) {
      setStudent(pageData.student);
      setPlot(pageData.garden.plot);
      setCrops(pageData.garden.crops);
      
      // Set can edit from server response
      useGardenStore.setState({ 
        canEdit: pageData.canEdit || false,
        passportCode 
      });
    }
  }, [pageData, setStudent, setPlot, setCrops, passportCode]);

  // Plant mutation
  const plantMutation = useMutation({
    mutationFn: async ({ seedType, x, y }: { seedType: string; x: number; y: number }) => {
      return await apiRequest('POST', '/api/garden/plant', {
        plotId: pageData?.garden.plot.id,
        seedType,
        positionX: x,
        positionY: y
      }, {
        headers: getPassportAuthHeaders()
      });
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['student-inventory'] });
    }
  });

  // Harvest mutation
  const harvestMutation = useMutation({
    mutationFn: async (cropId: string) => {
      return await apiRequest('POST', '/api/garden/harvest', {
        cropId
      }, {
        headers: getPassportAuthHeaders()
      });
    },
    onSuccess: () => {
      refetch();
    }
  });

  // Handle planting
  const handlePlantSeed = async (x: number, y: number) => {
    // Check if we're drag and dropping
    const gardenState = useGardenStore.getState();
    if (gardenState.isDragging && gardenState.draggedSeed) {
      // Direct plant from drag and drop
      await plantSeed(x, y, gardenState.draggedSeed.seedType);
      refetch();
    } else {
      // Show planting modal for manual selection
      setPlantingPosition({ x, y });
      setShowPlantingModal(true);
    }
  };

  // Handle harvesting
  const handleHarvestCrop = async (cropId: string) => {
    harvestMutation.mutate(cropId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-green-50">
        <LoadingSpinner />
      </div>
    );
  }

  // Error states
  if (error) {
    if (isPermissionError(error)) {
      return <AccessDeniedMessage reason="You don't have permission to view this garden" />;
    }
    
    if (isAuthError(error)) {
      if (!showPassportDialog) {
        setShowPassportDialog(true);
      }
      return (
        <PassportCodeDialog
          open={showPassportDialog}
          onOpenChange={setShowPassportDialog}
          onSuccess={() => {
            setLocation(`/garden/${passportCode}`);
          }}
        />
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-green-50">
        <Alert className="max-w-md">
          <AlertDescription>
            Failed to load garden. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!pageData) return null;

  const isOwnGarden = currentPassportCode === passportCode;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-green-50 overflow-hidden">
      {/* Student Header - shows logged in student info */}
      {isOwnGarden && <StudentHeader className="fixed top-0 left-0 right-0 z-50" />}
      
      {/* Garden Controls Header */}
      <div className={cn(
        "fixed left-0 right-0 z-40 bg-white/90 backdrop-blur-sm shadow-sm",
        isOwnGarden ? "top-14" : "top-0"
      )}>
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLocation('/student/dashboard')}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
            <Badge variant="outline" className="gap-1">
              <Coins className="h-3 w-3" />
              {pageData.wallet.total}
            </Badge>
            <Badge variant="secondary">
              {pageData.student.className}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {isOwnGarden ? (
              <>
                <WateringControls 
                  onWater={waterGarden}
                  cooldownMinutes={useGardenStore.getState().getWaterCooldownRemaining()}
                  isWatering={ui.isWatering}
                />
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLocation('/class-garden')}
                  className="gap-1"
                >
                  <Users className="h-4 w-4" />
                  Class Garden
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowInventory(!showInventory)}
                  className="gap-1"
                >
                  <Sprout className="h-4 w-4" />
                  Seeds
                </Button>
                
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setShowStore(true)}
                  disabled={!pageData.storeStatus.isOpen}
                  className="gap-1"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Store
                </Button>
              </>
            ) : (
              <>
                <Badge variant="secondary" className="text-xs">
                  Viewing {pageData.student.studentName}'s Grow Zone
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLocation('/class-garden')}
                  className="gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Class Garden
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Garden View */}
      <MainGardenView
        student={pageData.student}
        plot={pageData.garden.plot}
        crops={crops}
        storeCatalog={[]} // TODO: Get from store context
        passportCode={passportCode}
        canEdit={isOwnGarden}
        onPlantSeed={handlePlantSeed}
        onHarvestCrop={handleHarvestCrop}
      />

      {/* Garden Plot Interaction Layer - only active for own garden */}
      {isOwnGarden && (
        <div className="fixed inset-0 pointer-events-none z-10">
          <div className="relative w-full h-full flex items-center justify-center p-4 pt-20">
            <div className="relative w-full max-w-4xl aspect-[4/3] pointer-events-auto">
              {/* Invisible click areas for planting/harvesting */}
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="w-full h-full" onClick={(e) => {
                  // Calculate grid position from click
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.floor(((e.clientX - rect.left) / rect.width) * 3);
                  const y = Math.floor(((e.clientY - rect.top) / rect.height) * 3);
                  
                  if (x >= 0 && x < 3 && y >= 0 && y < 3) {
                    const crop = crops.find(c => c.positionX === x && c.positionY === y);
                    if (crop && crop.growthInfo.isReady) {
                      handleHarvestCrop(crop.id);
                    } else if (!crop) {
                      handlePlantSeed(x, y);
                    }
                  }
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Status */}
      <SaveStatusIndicator />

      {/* Inventory Panel - only for own garden */}
      {isOwnGarden && (
        <AnimatePresence>
          {showInventory && (
            <GardenInventory
              inventory={[]} // TODO: Get from store
              onClose={() => setShowInventory(false)}
              onSelectSeed={(seedId) => {
                useGardenStore.getState().setSelectedSeed(seedId);
                setShowInventory(false);
              }}
            />
          )}
        </AnimatePresence>
      )}

      {/* Store Modal - only for own garden */}
      {isOwnGarden && (
        <StoreModal
          open={showStore}
          onOpenChange={setShowStore}
          storeStatus={pageData.storeStatus}
          storeCatalog={[]} // TODO: Get from store context
          availableBalance={pageData.wallet.total}
          onPurchaseClick={(item) => {
            // TODO: Handle purchase
            console.log('Purchase:', item);
          }}
        />
      )}
      
      {/* Planting Modal */}
      {isOwnGarden && showPlantingModal && plantingPosition && (
        <PlantingModal
          isOpen={showPlantingModal}
          onClose={() => {
            setShowPlantingModal(false);
            setPlantingPosition(null);
          }}
          position={plantingPosition}
          plotId={pageData.garden.plot.id}
          onPlantSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ['student-inventory'] });
          }}
        />
      )}
    </div>
  );
}