import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AnimalType } from "@/lib/animals";

const getAnimalImageUrl = (animalName: string) => {
  return `/api/placeholder/300/300?text=${encodeURIComponent(animalName)}`;
};

interface AnimalResultCardProps {
  animal: AnimalType;
  studentName: string;
  onPrint?: () => void;
  onShare?: () => void;
}

export function AnimalResultCard({ animal, studentName, onPrint, onShare }: AnimalResultCardProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="overflow-hidden shadow-2xl border-0" style={{ 
        background: `linear-gradient(135deg, ${animal.color}20 0%, ${animal.color}10 100%)` 
      }}>
        <CardContent className="p-0">
          <div className="relative">
            {/* Header with gradient */}
            <div 
              className="h-32 relative overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${animal.color} 0%, ${animal.color}80 100%)` 
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="absolute bottom-4 left-6 text-white">
                <h1 className="text-2xl font-bold">{studentName}'s Result</h1>
                <p className="text-white/90">Animal Genius Personality Assessment</p>
              </div>
            </div>

            {/* Main content */}
            <div className="px-8 py-12 text-center">
              <div className="relative inline-block mb-8">
                <img 
                  src={getAnimalImageUrl(animal.name)}
                  alt={animal.name}
                  className="w-32 h-32 rounded-full mx-auto shadow-lg object-cover"
                />
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">⭐</span>
                </div>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mt-6 mb-2">
                You're {animal.name === 'Otter' ? 'an' : 'a'} {animal.name}!
              </h2>
              <p className="text-lg font-semibold mb-4" style={{ color: animal.color }}>
                The {animal.dominantFunction.split(' ')[0]} {animal.dominantFunction.split(' ')[1]}
              </p>
              <Badge variant="outline" className="mb-4">
                Personality Types: {animal.personalityTypes.join(', ')}
              </Badge>
            </div>

            {/* Traits section */}
            <div className="px-8 pb-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-red-500 text-lg">❤️</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Core Traits</h4>
                      <p className="text-sm text-gray-600">{animal.traits.slice(0, 3).join(', ')}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-accent text-lg">✅</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Strengths</h4>
                      <p className="text-sm text-gray-600">{animal.traits.slice(3, 6).join(', ')}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-500 text-lg">👑</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Leadership Style</h4>
                      <p className="text-sm text-gray-600">{animal.leadershipStyle.slice(0, 2).join(', ')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <span className="text-yellow-500 text-lg">⭐</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Special Qualities</h4>
                      <p className="text-sm text-gray-600">{animal.thinkingStyle}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-500 text-lg">🧠</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Thinking Style</h4>
                      <p className="text-sm text-gray-600">{animal.dominantFunction}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-500 text-lg">🏠</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Natural Habitat</h4>
                      <p className="text-sm text-gray-600">{animal.habitat}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="px-8 pb-8">
              <div className="flex gap-4 justify-center">
                {onPrint && (
                  <Button
                    onClick={onPrint}
                    variant="secondary"
                    size="lg"
                  >
                    🖨️ Print Results
                  </Button>
                )}
                {onShare && (
                  <Button
                    onClick={onShare}
                    variant="default"
                    size="lg"
                  >
                    📤 Share Results
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}