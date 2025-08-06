import React from "react";
import NormalizedAvatar from "@/components/avatar-v2/NormalizedAvatar";
import GardenPlot from "@/components/garden/GardenPlot";
import { useGardenStore } from "@/stores/gardenStore";

interface MainGardenViewProps {
  student: {
    animalType: string;
    studentName: string;
    avatarData?: any;
    [key: string]: any;
  };
  plot: {
    id: string;
    studentId: string;
    classId: string;
    plotPosition: number;
    gardenTheme: string;
  };
  crops: Array<{
    id: string;
    plotId: string;
    seedType: string;
    plantedAt: string;
    growthStage: number;
    lastWatered: string | null;
    waterBoostUntil: string | null;
    harvestReadyAt: string;
    positionX: number;
    positionY: number;
    isHarvested: boolean;
    seed: {
      id: string;
      name: string;
      iconEmoji: string;
      baseGrowthHours: number;
      baseSellPrice: number;
    };
    growthInfo: {
      currentStage: number;
      percentComplete: number;
      isReady: boolean;
      minutesRemaining: number;
    };
  }>;
  storeCatalog: any[];
  passportCode: string;
  onPlantSeed?: (x: number, y: number) => void;
  onHarvestCrop?: (cropId: string) => void;
  canEdit?: boolean;
}

const MainGardenView: React.FC<MainGardenViewProps> = ({ 
  student, 
  plot,
  crops,
  storeCatalog, 
  passportCode,
  onPlantSeed,
  onHarvestCrop,
  canEdit = false
}) => {
  const draftAvatar = useGardenStore((state) => state.draftAvatar);
  const editingMode = useGardenStore((state) => state.ui.editingMode);

  // Fixed avatar size
  const avatarSize = 200;

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center p-4 pt-20" 
      id="main-garden-container"
    >
      <div className="relative w-full max-w-4xl" id="main-garden-content">
        <div className={`relative w-full aspect-[4/3] bg-gradient-to-b from-sky-200 to-green-100 rounded-xl sm:rounded-2xl shadow-2xl p-6 overflow-hidden transition-all duration-300 ${
          editingMode === 'garden' ? 'ring-4 ring-green-400 ring-opacity-50' : editingMode === 'avatar' ? 'ring-4 ring-purple-400 ring-opacity-50' : ''
        }`}>
          {/* Garden Plot Grid */}
          <GardenPlot 
            plot={plot}
            crops={crops}
            canEdit={canEdit}
            onPlantSeed={onPlantSeed}
            onHarvestCrop={onHarvestCrop}
          />
          
          {/* Avatar in Garden - Walking on the side */}
          <div 
            className="absolute"
            style={{ 
              bottom: '10%',
              right: '5%',
              width: `${avatarSize}px`, 
              height: `${avatarSize}px`,
              pointerEvents: 'none',
              zIndex: 500
            }}
          >
            <NormalizedAvatar
              animalType={student.animalType}
              items={draftAvatar.equipped || {}}
              width={avatarSize}
              height={avatarSize}
              animated={true}
              storeCatalog={storeCatalog}
              primaryColor={student.avatarData?.colors?.primaryColor}
              secondaryColor={student.avatarData?.colors?.secondaryColor}
            />
          </div>

          {/* Grow Zone Label */}
          <div className="absolute top-4 left-4 bg-white/90 px-4 py-2 rounded-lg shadow-md">
            <h2 className="text-lg font-bold text-green-800">
              {student.studentName}'s Grow Zone
            </h2>
            <p className="text-sm text-green-600">Zone #{plot.plotPosition + 1}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MainGardenView);