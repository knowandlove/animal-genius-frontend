import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PersonalityRadarChartProps {
  scores: {
    E: number;
    I: number;
    S: number;
    N: number;
    T: number;
    F: number;
    J: number;
    P: number;
  };
  studentName?: string;
  className?: string;
}

export function PersonalityRadarChart({ scores, studentName, className }: PersonalityRadarChartProps) {
  // Transform scores into radar chart data
  const radarData = [
    {
      dimension: 'Energy Style',
      score: scores.E > scores.I ? scores.E : scores.I,
      preference: scores.E > scores.I ? 'Extroverted' : 'Introverted',
      description: scores.E > scores.I ? 'Gains energy from others' : 'Gains energy from reflection'
    },
    {
      dimension: 'Information Processing',
      score: scores.S > scores.N ? scores.S : scores.N,
      preference: scores.S > scores.N ? 'Sensing' : 'Intuitive',
      description: scores.S > scores.N ? 'Focuses on details & facts' : 'Focuses on patterns & possibilities'
    },
    {
      dimension: 'Decision Making',
      score: scores.T > scores.F ? scores.T : scores.F,
      preference: scores.T > scores.F ? 'Thinking' : 'Feeling',
      description: scores.T > scores.F ? 'Uses logic & analysis' : 'Considers people & values'
    },
    {
      dimension: 'Structure Preference',
      score: scores.J > scores.P ? scores.J : scores.P,
      preference: scores.J > scores.P ? 'Judging' : 'Perceiving',
      description: scores.J > scores.P ? 'Prefers structure & plans' : 'Prefers flexibility & options'
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-blue-600">
            <span className="font-medium">{data.preference}</span> (Score: {data.score})
          </p>
          <p className="text-xs text-gray-600 mt-1">{data.description}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {studentName ? `${studentName}'s Personality Profile` : 'Personality Profile'}
        </h3>
        <p className="text-sm text-gray-600">Interactive visualization of personality dimensions</p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis 
              dataKey="dimension" 
              tick={{ fontSize: 12, fill: '#374151' }}
              className="text-xs"
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 10]} 
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickCount={6}
            />
            <Radar
              name="Personality Score"
              dataKey="score"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        {radarData.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
            <div>
              <span className="font-medium text-gray-900">{item.dimension}:</span>
              <span className="text-blue-600 ml-1">{item.preference}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}