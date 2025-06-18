import { useLocation } from 'wouter';
import { useEffect } from 'react';

export default function AvatarTest() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect to the new avatar test page
    setLocation('/avatar-test-v2');
  }, [setLocation]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Redirecting to Avatar System V2...</h2>
        <p className="text-gray-600">The Phaser-based system has been replaced with a lighter CSS-based approach.</p>
      </div>
    </div>
  );
}
