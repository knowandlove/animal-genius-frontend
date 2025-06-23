import React from "react";
import LayeredAvatarRoom from "@/components/avatar-v2/LayeredAvatarRoom";
import IslandRoomSticker from "@/components/island/IslandRoom-sticker";
import { useIslandStore } from "@/stores/islandStore";
import { motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";

interface MainRoomViewProps {
  island: {
    animalType: string;
    studentName: string;
    [key: string]: any;
  };
  storeCatalog: any[];
  passportCode: string;
}

const MainRoomView: React.FC<MainRoomViewProps> = ({ island, storeCatalog, passportCode }) => {
  const draftAvatar = useIslandStore((state) => state.draftAvatar);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const editingMode = useIslandStore((state) => state.ui.editingMode);

  // Smaller avatar size
  const avatarSize = isMobile ? 200 : 300;

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center p-4" 
      id="main-room-container"
    >
      <div className="relative w-full max-w-3xl sm:max-w-4xl" id="main-room-content">
        <div className={`relative w-full aspect-[5/3] bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 overflow-hidden transition-all duration-300 ${
          editingMode ? 'ring-4 ring-blue-400 ring-opacity-50' : ''
        }`}>
        {/* Room Background and Stickers */}
        <IslandRoomSticker />
        
        {/* Avatar in Room - Lower position and higher z-index */}
        <div 
          className="absolute"
          style={{ 
            top: '70%', // Positioned near the floor
            left: '50%',
            width: `${avatarSize}px`, 
            height: `${avatarSize}px`,
            marginLeft: `-${avatarSize / 2}px`,
            marginTop: `-${avatarSize / 2}px`,
            pointerEvents: 'none',
            zIndex: 500 // High z-index to appear above room items
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full h-full"
          >
            <LayeredAvatarRoom
              animalType={island.animalType}
              items={draftAvatar.equipped}
              width={avatarSize}
              height={avatarSize}
              animated={true}
              storeCatalog={storeCatalog}
            />
          </motion.div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MainRoomView);
