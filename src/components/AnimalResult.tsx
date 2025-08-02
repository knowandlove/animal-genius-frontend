import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AnimalType } from "@/lib/animals";

interface AnimalResultProps {
  animal: AnimalType;
  studentName: string;
  onPrint?: () => void;
  onShare?: () => void;
  onTakeAgain?: () => void;
}

export default function AnimalResult({
  animal,
  studentName,
  onPrint,
  onShare,
  onTakeAgain,
}: AnimalResultProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="relative h-40 bg-gradient-to-r from-purple-600 to-blue-600">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <div className="relative h-full flex items-center justify-center text-white">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="inline-block p-4 bg-white bg-opacity-20 rounded-full mb-4"
                >
                  <span className="text-4xl">⭐</span>
                </motion.div>
                <h1 className="text-3xl font-bold mb-2">Congratulations, {studentName}!</h1>
                <p className="text-xl opacity-90">Your Animal Genius Assessment Results</p>
              </div>
            </div>
          </div>

          {/* Main Result */}
          <div className="p-8 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <div className="relative inline-block">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <img 
                    src={animal.imagePath} 
                    alt={animal.name}
                    className="w-24 h-24 object-contain"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">❤️</span>
                </div>
              </div>
              <h2 className="text-4xl font-bold text-gray-800 mb-2">
                You&apos;re {animal.name === 'Otter' ? 'an' : 'a'} {animal.name}!
              </h2>
              <p className="text-xl text-gray-600 mb-4" style={{ color: animal.color }}>
                {animal.description}
              </p>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {animal.personalityTypes.join(' • ')}
              </Badge>
            </motion.div>

            {/* Traits Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="space-y-4"
              >
                <div className="text-left p-6 bg-red-50 rounded-lg">
                  <div className="flex items-center mb-3">
                    <span className="text-red-500 text-2xl mr-3">👑</span>
                    <h3 className="text-lg font-semibold text-gray-800">Leadership Style</h3>
                  </div>
                  <ul className="space-y-1">
                    {animal.leadershipStyle.slice(0, 3).map((style, index) => (
                      <li key={index} className="text-gray-600 flex items-center">
                        <span className="text-yellow-500 mr-2">⭐</span>
                        {style}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-left p-6 bg-blue-50 rounded-lg">
                  <div className="flex items-center mb-3">
                    <span className="text-blue-500 text-2xl mr-3">🧠</span>
                    <h3 className="text-lg font-semibold text-gray-800">Thinking Style</h3>
                  </div>
                  <p className="text-gray-600">{animal.thinkingStyle}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="space-y-4"
              >
                <div className="text-left p-6 bg-accent/10 rounded-lg">
                  <div className="flex items-center mb-3">
                    <span className="text-accent text-2xl mr-3">🏠</span>
                    <h3 className="text-lg font-semibold text-gray-800">Natural Habitat</h3>
                  </div>
                  <p className="text-gray-600">{animal.habitat}</p>
                </div>

                <div className="text-left p-6 bg-purple-50 rounded-lg">
                  <div className="flex items-center mb-3">
                    <span className="text-purple-500 text-2xl mr-3">✨</span>
                    <h3 className="text-lg font-semibold text-gray-800">Key Traits</h3>
                  </div>
                  <ul className="space-y-1">
                    {animal.traits.slice(0, 3).map((trait, index) => (
                      <li key={index} className="text-gray-600 flex items-center">
                        <span className="text-purple-500 mr-2">•</span>
                        {trait}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex flex-wrap gap-4 justify-center"
            >
              {onPrint && (
                <Button
                  variant="outline"
                  onClick={onPrint}
                  className="px-8 py-3 text-lg"
                >
                  🖨️ Print Results
                </Button>
              )}
              {onShare && (
                <Button
                  variant="outline"
                  onClick={onShare}
                  className="px-8 py-3 text-lg"
                >
                  📤 Share Results
                </Button>
              )}
              {onTakeAgain && (
                <Button
                  onClick={onTakeAgain}
                  size="lg"
                >
                  Take Quiz Again
                </Button>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}