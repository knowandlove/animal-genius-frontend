import { useEffect, useState } from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

export default function PlantGrowthTest() {
  const [currentStage, setCurrentStage] = useState(0);
  
  const { rive, RiveComponent } = useRive({
    src: '/assets/plants/tomato.riv',
    stateMachines: 'State Machine 1',
    autoplay: true,
  });

  const growthStageInput = useStateMachineInput(
    rive,
    'State Machine 1',
    'growthStage'
  );

  useEffect(() => {
    if (growthStageInput) {
      growthStageInput.value = currentStage;
    }
  }, [growthStageInput, currentStage]);

  const stages = [
    { value: 0, name: 'Dirt Mound', emoji: '🟫' },
    { value: 1, name: 'Sprout', emoji: '🌱' },
    { value: 2, name: 'Sapling', emoji: '🌿' },
    { value: 3, name: 'Small Plant', emoji: '🍃' },
    { value: 4, name: 'Medium Plant', emoji: '🌾' },
    { value: 5, name: 'Full Bloom', emoji: '🍅' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-green-800">
          🌱 Plant Growth Test 🌱
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Click the buttons below to test your Rive plant animation
        </p>
        
        <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
          <div className="flex justify-center">
            <div className="border-4 border-green-200 rounded-lg overflow-hidden" 
                 style={{ width: 400, height: 400, background: '#f0f9ff' }}>
              <RiveComponent />
            </div>
          </div>
        </div>

        <div className="bg-green-600 text-white rounded-lg p-4 mb-8 text-center shadow-lg">
          <p className="text-2xl font-bold">
            {stages[currentStage].emoji} Stage {currentStage}: {stages[currentStage].name}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">
            Click to Change Growth Stage:
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {stages.map((stage) => (
              <button
                key={stage.value}
                onClick={() => setCurrentStage(stage.value)}
                className={`p-6 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  currentStage === stage.value
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                <div className="text-3xl mb-2">{stage.emoji}</div>
                <div className="text-lg">Stage {stage.value}</div>
                <div className="text-sm mt-1">{stage.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-gray-800 text-green-400 rounded-lg p-4 font-mono text-sm">
          <p>Debug Info:</p>
          <p>Current Stage Value: {currentStage}</p>
          <p>Rive Loaded: {rive ? 'Yes' : 'No'}</p>
          <p>Input Connected: {growthStageInput ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
}