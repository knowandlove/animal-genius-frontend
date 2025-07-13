import React, { useEffect, useState, useRef } from 'react';
import { useRive, useStateMachineInput, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import HighScoreBoard from './HighScoreBoard';
import { apiRequest } from '@/lib/queryClient';

// Game constants
const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const FISH_SIZE = 80; // 3x smaller than 240
const FISH_SPEED = 4;
const NUM_BUBBLES = 5; // More bubbles for variety
const GAME_TOP_MARGIN = 100; // Keep fish away from top of bowl
const GAME_BOTTOM_MARGIN = 120; // Keep fish away from bottom sand
const GAME_SIDE_MARGIN = 80; // Keep fish away from glass edges

// Bubble types
const BUBBLE_TYPES = [
  { size: 20, speed: 2.5, points: 5, color: 'rgba(255, 255, 100, 0.6)' }, // Small, fast, yellow
  { size: 30, speed: 1.8, points: 3, color: 'rgba(100, 200, 255, 0.6)' }, // Medium, normal, blue
  { size: 45, speed: 1.0, points: 1, color: 'rgba(150, 255, 150, 0.6)' }, // Large, slow, green
  { size: 35, speed: 1.5, points: -2, color: 'rgba(150, 150, 150, 0.6)' }, // Gray penalty bubble
];

interface RiveBubbleGameProps {
  passportCode?: string;
  classId?: string;
  onGameComplete?: (score: number) => void;
}

export default function RiveBubbleGame({ passportCode, classId, onGameComplete }: RiveBubbleGameProps) {
  // Fish position - use refs for performance
  const fishPos = useRef({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });
  const [fishDisplay, setFishDisplay] = useState({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });
  
  // Game state
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameActive, setGameActive] = useState(false);
  const gameActiveRef = useRef(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // Multiple bubbles - use ref for performance
  const bubblesRef = useRef<Array<{
    id: number;
    x: number;
    y: number;
    type: typeof BUBBLE_TYPES[number];
    popping: boolean;
    popTime: number;
  }>>([]);
  const [bubblesDisplay, setBubblesDisplay] = useState<Array<{
    id: number;
    x: number;
    y: number;
    type: typeof BUBBLE_TYPES[number];
    popping: boolean;
    popTime: number;
  }>>([]);
  
  // Movement state
  const keysPressed = useRef({ left: false, right: false, up: false, down: false });
  const animationFrameId = useRef<number>();
  const lastDirection = useRef<number>(1); // Track last direction (1 = right, -1 = left)
  
  // Rive setup for fish
  const fishUrl = 'https://zqyvfnbwpagguutzdvpy.supabase.co/storage/v1/object/public/store-items/pets/fish-character.riv';
  
  const { rive, RiveComponent } = useRive({
    src: fishUrl,
    stateMachines: 'FishController',
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });
  
  // Get Rive inputs
  const happinessInput = useStateMachineInput(rive, 'FishController', 'happiness');
  const directionInput = useStateMachineInput(rive, 'FishController', 'direction');
  
  // Update fish happiness based on score
  useEffect(() => {
    if (happinessInput) {
      // Map score to happiness (0-100)
      const happiness = Math.min(100, 50 + score * 2);
      happinessInput.value = happiness;
    }
  }, [score, happinessInput]);

  // Set initial direction
  useEffect(() => {
    if (directionInput) {
      directionInput.value = lastDirection.current; // Start facing the last direction
    }
  }, [directionInput]);
  
  // Check collision with all bubbles
  const checkCollisions = () => {
    const fishX = fishPos.current.x;
    const fishY = fishPos.current.y;
    let scoreIncrease = 0;
    
    bubblesRef.current = bubblesRef.current.map(bubble => {
      const dx = fishX - (bubble.x + bubble.type.size/2);
      const dy = fishY - (bubble.y + bubble.type.size/2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < (FISH_SIZE/2 + bubble.type.size/2) && !bubble.popping) {
        scoreIncrease += bubble.type.points;
        // Create new bubble with random type
        const newType = BUBBLE_TYPES[Math.floor(Math.random() * BUBBLE_TYPES.length)];
        return {
          ...bubble,
          x: GAME_SIDE_MARGIN + Math.random() * (GAME_WIDTH - 2 * GAME_SIDE_MARGIN - newType.size),
          y: GAME_HEIGHT - 40, // Start higher up within the aquarium
          type: newType,
          popping: false,
          popTime: 0,
        };
      }
      return bubble;
    });
    
    if (scoreIncrease !== 0) {
      setScore(prev => prev + scoreIncrease);
    }
  };
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          keysPressed.current.left = true;
          if (directionInput) {
            directionInput.value = -1;
            lastDirection.current = -1;
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          keysPressed.current.right = true;
          if (directionInput) {
            directionInput.value = 1;
            lastDirection.current = 1;
          }
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          keysPressed.current.up = true;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          keysPressed.current.down = true;
          break;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          keysPressed.current.left = false;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          keysPressed.current.right = false;
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          keysPressed.current.up = false;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          keysPressed.current.down = false;
          break;
      }
      
      // Keep facing the last direction when no left/right keys pressed
      if (!keysPressed.current.left && !keysPressed.current.right && directionInput) {
        directionInput.value = lastDirection.current;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [directionInput]);
  
  // Countdown timer
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    
    const timer = setTimeout(() => {
      if (countdown > 1) {
        setCountdown(countdown - 1);
      } else {
        setCountdown(null);
        setGameActive(true);
        gameActiveRef.current = true;
        // Initialize bubbles when game starts
        const initialBubbles = Array.from({ length: NUM_BUBBLES }, (_, i) => {
          const type = BUBBLE_TYPES[Math.floor(Math.random() * BUBBLE_TYPES.length)];
          return {
            id: i,
            x: GAME_SIDE_MARGIN + Math.random() * (GAME_WIDTH - 2 * GAME_SIDE_MARGIN - type.size),
            y: GAME_HEIGHT - 100 - (i * 60), // Start higher up, spaced closer
            type: type,
            popping: false,
            popTime: 0,
          };
        });
        bubblesRef.current = initialBubbles;
        setBubblesDisplay(initialBubbles);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown]);

  // Game timer
  useEffect(() => {
    if (!gameActive || countdown !== null) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameActive(false);
          gameActiveRef.current = false;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameActive, countdown]);
  
  // Save score when game ends
  useEffect(() => {
    if (!gameActive && timeLeft === 0 && score > 0 && !scoreSaved) {
      saveGameScore();
      // Call the completion callback
      if (onGameComplete) {
        onGameComplete(score);
      }
    }
  }, [gameActive, timeLeft, score, scoreSaved, onGameComplete]);
  
  const saveGameScore = async () => {
    try {
      await apiRequest('POST', '/api/game-scores', {
        gameType: 'fish_bubble_pop',
        score: score,
        gameData: {
          duration: 60,
          timestamp: new Date().toISOString()
        }
      });
      setScoreSaved(true);
    } catch (error) {
      console.error('Failed to save score:', error);
    }
  };
  
  // Game loop - optimized to use refs
  useEffect(() => {
    if (!gameActive) return;
    
    let frameCount = 0;
    const DISPLAY_UPDATE_INTERVAL = 3; // Update display every 3 frames (~50ms at 60fps)
    
    const gameLoop = () => {
      if (!gameActiveRef.current) return;
      
      // Calculate new fish position
      let newX = fishPos.current.x;
      let newY = fishPos.current.y;
      
      if (keysPressed.current.left) newX -= FISH_SPEED;
      if (keysPressed.current.right) newX += FISH_SPEED;
      if (keysPressed.current.up) newY -= FISH_SPEED;
      if (keysPressed.current.down) newY += FISH_SPEED;
      
      // Define rectangular boundary for square aquarium
      const minX = 12;
      const maxX = GAME_WIDTH - 12;
      const minY = -15;
      const maxY = GAME_HEIGHT - 25;
      
      // Keep fish within rectangular bounds
      if (newX - FISH_SIZE/2 < minX) newX = minX + FISH_SIZE/2;
      if (newX + FISH_SIZE/2 > maxX) newX = maxX - FISH_SIZE/2;
      if (newY - FISH_SIZE/2 < minY) newY = minY + FISH_SIZE/2;
      if (newY + FISH_SIZE/2 > maxY) newY = maxY - FISH_SIZE/2;
      
      // Update fish position in ref
      fishPos.current.x = newX;
      fishPos.current.y = newY;
      
      // Move all bubbles upward
      bubblesRef.current = bubblesRef.current.map(bubble => {
        // If bubble is popping, check if animation is done
        if (bubble.popping) {
          const newPopTime = bubble.popTime + 16;
          
          // After 500ms, respawn the bubble
          if (newPopTime >= 500) {
            const newType = BUBBLE_TYPES[Math.floor(Math.random() * BUBBLE_TYPES.length)];
            return {
              ...bubble,
              x: GAME_SIDE_MARGIN + Math.random() * (GAME_WIDTH - 2 * GAME_SIDE_MARGIN - newType.size),
              y: GAME_HEIGHT - 40,
              type: newType,
              popping: false,
              popTime: 0,
            };
          }
          
          return { ...bubble, popTime: newPopTime };
        }
        
        const newY = bubble.y - bubble.type.speed;
        
        // Check if bubble reached the top
        if (newY < 7) {
          // Start popping animation
          return { ...bubble, popping: true, popTime: 0 };
        }
        
        return { ...bubble, y: newY };
      });
      
      checkCollisions();
      
      // Update display state less frequently
      frameCount++;
      if (frameCount % DISPLAY_UPDATE_INTERVAL === 0) {
        setFishDisplay({ x: fishPos.current.x, y: fishPos.current.y });
        setBubblesDisplay([...bubblesRef.current]);
      }
      
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };
    
    animationFrameId.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameActive]);
  
  // Start game
  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    fishPos.current = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
    setFishDisplay({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });
    setCountdown(3);
    setScoreSaved(false);
    setShowLeaderboard(false);
    bubblesRef.current = [];
    setBubblesDisplay([]); // Start with no bubbles
  };
  
  return (
    <div className="flex items-center justify-center bg-transparent">
      <style>{`
        @keyframes bubblePop {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.5;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
      <div className="flex gap-8 items-center px-8">
        {/* Game Instructions - Left Side */}
        <div className="bg-white rounded-lg p-4 w-56" style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)' }}>
          <h3 className="text-lg font-bold text-blue-900 mb-3">Fish Bubble Pop</h3>
          <p className="text-xs text-gray-700 mb-4">
            Catch bubbles to earn points! Avoid gray ones. 60 seconds to play.
          </p>
          
          {/* Controls */}
          <div className="mb-4">
            <h4 className="font-semibold text-blue-800 mb-1 text-sm">Controls</h4>
            <div className="text-xs text-gray-600">
              <div>⬆️⬇️⬅️➡️ or WASD</div>
            </div>
          </div>
          
          {/* Point Values */}
          <div>
            <h4 className="font-semibold text-blue-800 mb-2 text-sm">Points</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(255, 255, 100, 0.8)' }}></div>
                <span>Small/Fast = +5</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(100, 200, 255, 0.8)' }}></div>
                <span>Medium = +3</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(150, 255, 150, 0.8)' }}></div>
                <span>Large/Slow = +1</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(150, 150, 150, 0.8)' }}></div>
                <span>Gray = -2</span>
              </div>
            </div>
          </div>
          
          {/* High Scores */}
          <div className="mt-4">
            <HighScoreBoard
              gameType="fish_bubble_pop"
              passportCode={passportCode}
              compact={true}
            />
          </div>
        </div>

        {/* Game Area - Right Side */}
        <div className="flex flex-col items-center">
          {/* Score and Timer */}
          <div className="flex gap-8 relative" style={{ top: '30px' }}>
            <div className="bg-white rounded-full px-4 py-2 shadow-md">
              <span className="text-lg font-semibold text-blue-800">Score: {score}</span>
            </div>
            <div className="bg-white rounded-full px-4 py-2 shadow-md">
              <span className="text-lg font-semibold text-blue-800">Time: {timeLeft}s</span>
            </div>
          </div>
          
          {/* Fishbowl container */}
          <div className="relative" style={{ 
            width: GAME_WIDTH + 200, 
            height: GAME_HEIGHT + 200,
            filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.2))'
          }}>
        {/* Fishbowl SVG background */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(https://zqyvfnbwpagguutzdvpy.supabase.co/storage/v1/object/public/store-items/pets/aquarium.svg)',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'none',
          }}
        />
        
        {/* Game area - shaped to fit inside the bowl */}
        <div 
          className="absolute"
          style={{ 
            width: GAME_WIDTH, 
            height: GAME_HEIGHT,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Rive Fish */}
          <div
            className="absolute transition-none"
            style={{
              width: FISH_SIZE,
              height: FISH_SIZE,
              left: fishDisplay.x - FISH_SIZE/2,
              top: fishDisplay.y - FISH_SIZE/2,
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <RiveComponent className="w-full h-full" />
          </div>
          
          {/* Bubbles */}
          {bubblesDisplay.map(bubble => (
            <div
              key={bubble.id}
              className="absolute"
              style={{
                width: bubble.type.size,
                height: bubble.type.size,
                left: bubble.x,
                top: bubble.y,
                animation: bubble.popping 
                  ? 'bubblePop 0.5s ease-out forwards' 
                  : bubble.type.size === 20 ? 'pulse 1s infinite' : bubble.type.size === 45 ? 'pulse 2s infinite' : 'pulse 1.5s infinite',
              }}
            >
              <div className="relative w-full h-full">
                {/* Main bubble with custom color */}
                <div 
                  className={`absolute inset-0 backdrop-blur-sm rounded-full border-2 border-white/50 ${bubble.popping ? 'opacity-0' : ''}`}
                  style={{ 
                    backgroundColor: bubble.type.color,
                    transition: bubble.popping ? 'opacity 0.3s ease-out' : 'none',
                  }}
                />
                {/* Point value */}
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold" style={{ fontSize: bubble.type.size * 0.4 }}>
                  {bubble.type.points > 0 ? `+${bubble.type.points}` : bubble.type.points}
                </div>
                {/* Shine effect */}
                <div className="absolute bg-white rounded-full" style={{ 
                  width: bubble.type.size * 0.15, 
                  height: bubble.type.size * 0.15,
                  left: '25%', 
                  top: '20%' 
                }} />
              </div>
            </div>
          ))}
          
          {/* Start Screen */}
          {!gameActive && timeLeft === 60 && countdown === null && (
            <div className="absolute inset-0 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 shadow-2xl text-center">
                <h2 className="text-2xl font-bold mb-4 text-blue-900">Ready to Play?</h2>
                <p className="text-gray-600 mb-6">Help your fish catch bubbles!</p>
                <button
                  onClick={startGame}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105 cursor-pointer"
                >
                  Start Game
                </button>
              </div>
            </div>
          )}
          
          {/* Countdown Screen */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center z-50">
              <div className="bg-white rounded-full w-32 h-32 flex items-center justify-center shadow-2xl">
                <span className="text-6xl font-bold text-blue-600">{countdown}</span>
              </div>
            </div>
          )}
          
          {/* Game Over Screen */}
          {!gameActive && timeLeft === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 shadow-2xl text-center max-w-lg">
                <h2 className="text-3xl font-bold mb-4 text-blue-900">Time's Up!</h2>
                <p className="text-2xl mb-2">Final Score: <span className="font-bold text-blue-600">{score}</span></p>
                <p className="text-sm text-gray-600 mb-6">Your fish is {score > 20 ? 'very' : score > 10 ? 'quite' : 'a bit'} happy!</p>
                
                {showLeaderboard ? (
                  <>
                    <HighScoreBoard
                      gameType="fish_bubble_pop"
                      passportCode={passportCode}
                      currentScore={score}
                      compact={false}
                    />
                    <button
                      onClick={startGame}
                      className="mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105"
                    >
                      Play Again
                    </button>
                  </>
                ) : (
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => setShowLeaderboard(true)}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition hover:scale-105"
                    >
                      View Leaderboard
                    </button>
                    <button
                      onClick={startGame}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition hover:scale-105"
                    >
                      Play Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}