import { useEffect, useRef, useState } from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  points: number;
}

export default function BubblePopPrototype() {
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const nextBubbleId = useRef(0);

  // Rive animation for the fish
  const { RiveComponent, rive } = useRive({
    src: '/animations/goldfish.riv',
    stateMachines: 'State Machine 1',
    autoplay: true,
  });

  const swimInput = useStateMachineInput(rive, 'State Machine 1', 'swim');

  // Game loop
  useEffect(() => {
    if (!gameActive) return;

    const gameInterval = setInterval(() => {
      // Move bubbles up
      setBubbles(prev => prev
        .map(bubble => ({
          ...bubble,
          y: bubble.y - bubble.speed
        }))
        .filter(bubble => bubble.y > -bubble.size)
      );

      // Spawn new bubble occasionally
      if (Math.random() < 0.02) {
        setBubbles(prev => [...prev, {
          id: nextBubbleId.current++,
          x: Math.random() * 380 + 10,
          y: 400,
          size: Math.random() * 30 + 20,
          speed: Math.random() * 2 + 1,
          points: Math.floor(Math.random() * 10) + 1
        }]);
      }
    }, 50);

    return () => clearInterval(gameInterval);
  }, [gameActive]);

  const handleBubbleClick = (bubbleId: number) => {
    setBubbles(prev => {
      const bubble = prev.find(b => b.id === bubbleId);
      if (bubble) {
        setScore(s => s + bubble.points);
        // Trigger fish animation
        if (swimInput) {
          swimInput.fire();
        }
      }
      return prev.filter(b => b.id !== bubbleId);
    });
  };

  const startGame = () => {
    setScore(0);
    setBubbles([]);
    setGameActive(true);
  };

  const stopGame = () => {
    setGameActive(false);
  };

  return (
    <div className="relative w-[400px] h-[400px] bg-gradient-to-b from-blue-300 to-blue-500 rounded-lg overflow-hidden">
      {/* Fish animation */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-32 h-32">
        <RiveComponent />
      </div>

      {/* Bubbles */}
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className="absolute rounded-full bg-white bg-opacity-30 border-2 border-white border-opacity-50 cursor-pointer hover:bg-opacity-50 transition-all"
          style={{
            left: `${bubble.x}px`,
            top: `${bubble.y}px`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
          }}
          onClick={() => handleBubbleClick(bubble.id)}
        >
          <div className="flex items-center justify-center h-full text-xs font-bold text-white">
            {bubble.points}
          </div>
        </div>
      ))}

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
        <div className="text-white font-bold">Score: {score}</div>
        {!gameActive ? (
          <button
            onClick={startGame}
            className="bg-white text-blue-500 px-4 py-2 rounded font-bold hover:bg-opacity-90"
          >
            Start Game
          </button>
        ) : (
          <button
            onClick={stopGame}
            className="bg-red-500 text-white px-4 py-2 rounded font-bold hover:bg-red-600"
          >
            Stop
          </button>
        )}
      </div>

      {/* Instructions */}
      {!gameActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white bg-opacity-90 p-6 rounded-lg text-center">
            <h3 className="text-xl font-bold mb-2">Bubble Pop!</h3>
            <p className="text-gray-700">Click bubbles to help the fish collect points!</p>
          </div>
        </div>
      )}
    </div>
  );
}