import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ClassPersonalityRadarProps {
  submissions: any[];
  className?: string;
}

export function ClassPersonalityRadar({ submissions, className }: ClassPersonalityRadarProps) {
  // Calculate average scores across all students
  const calculateAverageScores = () => {
    if (submissions.length === 0) return null;

    const totals = {
      E: 0, I: 0, S: 0, N: 0,
      T: 0, F: 0, J: 0, P: 0
    };

    submissions.forEach(submission => {
      const scores = submission.scores || {};
      Object.keys(totals).forEach(key => {
        totals[key as keyof typeof totals] += scores[key] || 0;
      });
    });

    // Calculate averages
    const averages = {} as any;
    Object.keys(totals).forEach(key => {
      averages[key] = totals[key as keyof typeof totals] / submissions.length;
    });

    return averages;
  };

  const averageScores = calculateAverageScores();
  
  if (!averageScores) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <p>No student data available for class radar chart</p>
        </div>
      </div>
    );
  }

  // Transform scores into radar chart data
  const radarData = [
    {
      dimension: 'Energy Style',
      classAverage: averageScores.E > averageScores.I ? averageScores.E : averageScores.I,
      preference: averageScores.E > averageScores.I ? 'Extroverted' : 'Introverted',
      description: averageScores.E > averageScores.I ? 'Class gains energy from interaction' : 'Class gains energy from reflection'
    },
    {
      dimension: 'Information Processing',
      classAverage: averageScores.S > averageScores.N ? averageScores.S : averageScores.N,
      preference: averageScores.S > averageScores.N ? 'Sensing' : 'Intuitive',
      description: averageScores.S > averageScores.N ? 'Class focuses on details & facts' : 'Class focuses on patterns & possibilities'
    },
    {
      dimension: 'Decision Making',
      classAverage: averageScores.T > averageScores.F ? averageScores.T : averageScores.F,
      preference: averageScores.T > averageScores.F ? 'Thinking' : 'Feeling',
      description: averageScores.T > averageScores.F ? 'Class uses logic & analysis' : 'Class considers people & values'
    },
    {
      dimension: 'Structure Preference',
      classAverage: averageScores.J > averageScores.P ? averageScores.J : averageScores.P,
      preference: averageScores.J > averageScores.P ? 'Judging' : 'Perceiving',
      description: averageScores.J > averageScores.P ? 'Class prefers structure & plans' : 'Class prefers flexibility & options'
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-accent">
            <span className="font-medium">{data.preference}</span> (Avg: {data.classAverage.toFixed(1)})
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
          Class Personality Profile
        </h3>
        <p className="text-sm text-gray-600">
          Average personality dimensions across {submissions.length} students
        </p>
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
              name="Class Average"
              dataKey="classAverage"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.3}
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        {radarData.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-accent rounded-full flex-shrink-0"></div>
            <div>
              <span className="font-medium text-gray-900">{item.dimension}:</span>
              <span className="text-accent ml-1">{item.preference}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Class Insights */}
      <div className="mt-4 p-3 bg-accent/10 rounded-lg">
        <h4 className="font-medium text-accent mb-2">Class Teaching Insights</h4>
        <ul className="text-xs text-accent/80 space-y-1">
          {radarData.map((item, index) => (
            <li key={index}>• {item.description}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}