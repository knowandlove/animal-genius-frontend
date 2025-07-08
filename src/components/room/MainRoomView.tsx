import React from "react";
import NormalizedAvatar from "@/components/avatar-v2/NormalizedAvatar";
import RoomSticker from "@/components/room/RoomSticker";
import { useRoomStore } from "@/stores/roomStore";

interface MainRoomViewProps {
  room: {
    animalType: string;
    studentName: string;
    [key: string]: any;
  };
  storeCatalog: any[];
  passportCode: string;
}

const MainRoomView: React.FC<MainRoomViewProps> = ({ room, storeCatalog, passportCode }) => {
  const draftAvatar = useRoomStore((state) => state.draftAvatar);
  const editingMode = useRoomStore((state) => state.ui.editingMode);

  // Fixed avatar size - using fixed pixel size to match positioning tool
  const avatarSize = 250; // Fixed size for consistency

  return (
    <>
    <div 
      className="absolute inset-0 flex items-center justify-center p-4 pt-20" 
      id="main-room-container"
    >
      <div className="relative w-full max-w-3xl sm:max-w-4xl" id="main-room-content">
        <div className={`relative w-full aspect-[5/3] bg-white rounded-xl sm:rounded-2xl shadow-2xl p-2 overflow-hidden transition-all duration-300 ${
          editingMode === 'room' ? 'ring-4 ring-blue-400 ring-opacity-50' : editingMode === 'avatar' ? 'ring-4 ring-purple-400 ring-opacity-50' : ''
        }`}>
        {/* Room Background and Stickers */}
        <RoomSticker />
        
        {/* Avatar in Room - Lower position and higher z-index */}
        <div 
          className="absolute"
          style={{ 
            top: '70%', // Positioned near the floor
            left: '50%',
            width: `${avatarSize}px`, 
            height: `${avatarSize}px`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 500 // High z-index to appear above room items
          }}
        >
          <NormalizedAvatar
            animalType={room.animalType}
            items={draftAvatar.equipped}
            width={avatarSize}
            height={avatarSize}
            animated={false}
            storeCatalog={storeCatalog}
          />
        </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default React.memo(MainRoomView);
