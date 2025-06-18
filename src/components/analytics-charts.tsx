import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsChartsProps {
  animalDistribution: Record<string, number>;
  personalityDistribution: Record<string, number>;
}

export function AnalyticsCharts({ animalDistribution, personalityDistribution }: AnalyticsChartsProps) {
  // Transform animal distribution data for pie chart
  const animalChartData = Object.entries(animalDistribution).map(([animal, count]) => ({
    name: animal,
    value: count,
    color: getAnimalColor(animal)
  }));

  // Define colors for each chart
  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ffbb28', '#ff8042'];

  // Transform personality distribution data
  const personalityChartData = [
    { name: 'Extroversion', value: personalityDistribution.E || 0, color: '#8884d8' },
    { name: 'Introversion', value: personalityDistribution.I || 0, color: '#82ca9d' }
  ];

  const sensingIntuitionData = [
    { name: 'Sensing', value: personalityDistribution.S || 0, color: '#ffc658' },
    { name: 'Intuition', value: personalityDistribution.N || 0, color: '#ff7300' }
  ];

  const thinkingFeelingData = [
    { name: 'Thinking', value: personalityDistribution.T || 0, color: '#0088fe' },
    { name: 'Feeling', value: personalityDistribution.F || 0, color: '#00c49f' }
  ];

  const judgingPerceivingData = [
    { name: 'Judging', value: personalityDistribution.J || 0, color: '#ffbb28' },
    { name: 'Perceiving', value: personalityDistribution.P || 0, color: '#ff8042' }
  ];

  return (
    <div className="space-y-6">
      {/* Animal Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Animal Personality Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={animalChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {animalChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Personality Dimensions Bar Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Extroversion vs Introversion</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={personalityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {personalityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sensing vs Intuition</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sensingIntuitionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {sensingIntuitionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thinking vs Feeling</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={thinkingFeelingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {thinkingFeelingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Judging vs Perceiving</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={judgingPerceivingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {judgingPerceivingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to get animal colors
function getAnimalColor(animal: string): string {
  const colorMap: Record<string, string> = {
    'Meerkat': '#f97316',
    'Panda': '#22c55e', 
    'Owl': '#6366f1',
    'Beaver': '#a855f7',
    'Elephant': '#06b6d4',
    'Otter': '#f59e0b',
    'Parrot': '#ef4444',
    'Border Collie': '#8b5cf6'
  };
  return colorMap[animal] || '#6b7280';
}