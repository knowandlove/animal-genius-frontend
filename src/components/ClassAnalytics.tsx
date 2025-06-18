import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { ANIMAL_TYPES } from "@/lib/animals";

interface ClassAnalyticsProps {
  animalDistribution: Record<string, number>;
  personalityPreferences: {
    E: number;
    I: number;
    S: number;
    N: number;
    T: number;
    F: number;
    J: number;
    P: number;
  };
  totalResponses: number;
}

// Use colors from canonical animal definitions
const getAnimalColor = (animalKey: string): string => {
  const animal = ANIMAL_TYPES[animalKey];
  return animal?.color || "#6B7280";
};

export default function ClassAnalytics({
  animalDistribution,
  personalityPreferences,
  totalResponses
}: ClassAnalyticsProps) {
  // Prepare animal distribution data for charts
  const animalChartData = Object.entries(animalDistribution).map(([animal, count]) => {
    const animalKey = animal.toLowerCase().replace(' ', '');
    const animalInfo = ANIMAL_TYPES[animalKey];
    return {
      name: animalInfo?.name || animal,
      value: count,
      percentage: Math.round((count / totalResponses) * 100),
      color: getAnimalColor(animalKey)
    };
  }).filter(item => item.value > 0);

  // Prepare personality preferences data
  const preferencesData = [
    {
      category: "E vs I",
      Extroversion: personalityPreferences.E,
      Introversion: personalityPreferences.I,
    },
    {
      category: "S vs N", 
      Sensing: personalityPreferences.S,
      Intuition: personalityPreferences.N,
    },
    {
      category: "T vs F",
      Thinking: personalityPreferences.T,
      Feeling: personalityPreferences.F,
    },
    {
      category: "J vs P",
      Judging: personalityPreferences.J,
      Perceiving: personalityPreferences.P,
    }
  ];

  return (
    <div className="grid lg:grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Animal Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Animal Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {animalChartData.length > 0 ? (
            <>
              {/* Pie Chart */}
              <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={animalChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {animalChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, "Students"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Animal Grid */}
              <div className="grid grid-cols-2 gap-3">
                {animalChartData.map((animal) => (
                  <div 
                    key={animal.name}
                    className="text-center p-3 rounded-xl border"
                    style={{ backgroundColor: `${animal.color}15`, borderColor: `${animal.color}40` }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center"
                      style={{ backgroundColor: animal.color }}
                    >
                      <img 
                        src={ANIMAL_TYPES[animal.name.toLowerCase().replace(' ', '')]?.imagePath || '/images/kal-character.png'} 
                        alt={animal.name}
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{animal.name}</p>
                    <p className="text-xl font-bold" style={{ color: animal.color }}>
                      {animal.value}
                    </p>
                    <p className="text-xs text-gray-600">{animal.percentage}%</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No quiz responses yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personality Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Personality Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          {totalResponses > 0 ? (
            <div className="space-y-6">
              {preferencesData.map((pref, index) => {
                const keys = Object.keys(pref).filter(k => k !== 'category');
                const total = keys.reduce((sum, key) => sum + (pref[key as keyof typeof pref] as number), 0);
                
                return (
                  <div key={index}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">{pref.category}</span>
                    </div>
                    <div className="flex h-6 bg-gray-200 rounded-full overflow-hidden">
                      {keys.map((key, keyIndex) => {
                        const value = pref[key as keyof typeof pref] as number;
                        const percentage = total > 0 ? (value / total) * 100 : 0;
                        const colors = ['#3B82F6', '#6B7280'];
                        
                        return (
                          <div
                            key={keyIndex}
                            className="h-full flex items-center justify-center text-xs text-white font-semibold"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: colors[keyIndex]
                            }}
                          >
                            {percentage > 15 ? `${Math.round(percentage)}%` : ''}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      {keys.map((key) => (
                        <span key={key}>
                          {key}: {pref[key as keyof typeof pref]}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Bar Chart */}
              <div className="h-64 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={preferencesData}>
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="Extroversion" fill="#3B82F6" name="First Option" />
                    <Bar dataKey="Introversion" fill="#6B7280" name="Second Option" />
                    <Bar dataKey="Sensing" fill="#3B82F6" name="First Option" />
                    <Bar dataKey="Intuition" fill="#6B7280" name="Second Option" />
                    <Bar dataKey="Thinking" fill="#3B82F6" name="First Option" />
                    <Bar dataKey="Feeling" fill="#6B7280" name="Second Option" />
                    <Bar dataKey="Judging" fill="#3B82F6" name="First Option" />
                    <Bar dataKey="Perceiving" fill="#6B7280" name="Second Option" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No quiz responses yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
