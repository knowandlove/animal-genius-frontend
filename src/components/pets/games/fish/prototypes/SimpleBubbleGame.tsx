import { useEffect, useRef, useState } from 'react';

export default function SimpleBubbleGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bubbles, setBubbles] = useState<Array<{x: number, y: number, size: number, id: number}>>([]);
  const [score, setScore] = useState(0);
  const nextBubbleId = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Animation loop
    let animationId: number;
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, 400, 600);

      // Update and draw bubbles
      setBubbles(prevBubbles => {
        return prevBubbles
          .map(bubble => ({
            ...bubble,
            y: bubble.y - 2 // Move up
          }))
          .filter(bubble => bubble.y > -bubble.size); // Remove off-screen bubbles
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Spawn bubbles
    const spawnInterval = setInterval(() => {
      setBubbles(prev => [...prev, {
        id: nextBubbleId.current++,
        x: Math.random() * 350 + 25,
        y: 600,
        size: Math.random() * 20 + 20
      }]);
    }, 1000);

    // Handle clicks
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setBubbles(prev => {
        const clicked = prev.filter(bubble => {
          const dx = bubble.x - x;
          const dy = bubble.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < bubble.size) {
            setScore(s => s + Math.floor(50 - bubble.size));
            return false;
          }
          return true;
        });
        return clicked;
      });
    };

    canvas.addEventListener('click', handleClick);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(spawnInterval);
      canvas.removeEventListener('click', handleClick);
    };
  }, []);

  // Draw bubbles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 400, 600);

    // Draw background
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(0, 0, 400, 600);

    // Draw bubbles
    bubbles.forEach(bubble => {
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
      ctx.stroke();
    });
  }, [bubbles]);

  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-2xl font-bold mb-4">Simple Bubble Game</h2>
      <div className="mb-4">Score: {score}</div>
      <canvas
        ref={canvasRef}
        width={400}
        height={600}
        className="border border-gray-300 rounded cursor-pointer"
      />
      <p className="mt-2 text-sm text-gray-600">Click bubbles to pop them!</p>
    </div>
  );
}