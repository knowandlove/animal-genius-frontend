import { motion } from 'framer-motion';
// Image import temporarily disabled - asset not found
// import kalImagePath from '@assets/kal_1749097717120.png';

// Temporary placeholder until image is available
const kalImagePath = '/placeholder-robot.svg';

interface KalCharacterProps {
  message: string;
  mood?: 'encouraging' | 'celebrating' | 'default';
}

export function KalCharacter({ message, mood = 'default' }: KalCharacterProps) {
  const moodAnimations = {
    encouraging: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity }
    },
    celebrating: {
      y: [0, -10, 0],
      rotate: [0, 5, -5, 0],
      transition: { duration: 1, repeat: 3 }
    },
    default: {
      scale: 1,
      y: 0,
      rotate: 0
    }
  };

  return (
    <div className="flex items-center gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
      <motion.div
        animate={moodAnimations[mood]}
        className="flex-shrink-0"
      >
        <img 
          src={kalImagePath} 
          alt="KAL Robot Character" 
          className="w-16 h-16 object-contain"
        />
      </motion.div>
      
      <div className="flex-1">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 relative">
          {/* Speech bubble arrow */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2">
            <div className="w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-white"></div>
          </div>
          
          <p className="text-gray-800 font-medium">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

export default KalCharacter;