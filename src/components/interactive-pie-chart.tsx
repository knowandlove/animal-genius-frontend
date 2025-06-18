import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LabelList } from 'recharts';

interface PieChartData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  svg: string;
}

interface InteractivePieChartProps {
  data: PieChartData[];
  selectedAnimal: string | null;
  onAnimalClick: (animal: string | null) => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium flex items-center gap-2">
          <img src={data.svg} alt={data.name} className="w-6 h-6" />
          {data.name}
        </p>
        <p className="text-sm text-gray-600">
          Count: <span className="font-medium">{data.value}</span>
        </p>
        <p className="text-sm text-gray-600">
          Percentage: <span className="font-medium">{data.percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percentage }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only show label if percentage is 5% or higher to avoid overcrowding
  if (percentage < 5) return null;

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize="11"
      fontWeight="bold"
      style={{ 
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
        pointerEvents: 'none'
      }}
    >
      {`${name} ${percentage}%`}
    </text>
  );
};

export function InteractivePieChart({ data, selectedAnimal, onAnimalClick }: InteractivePieChartProps) {
  const handleClick = (entry: any) => {
    if (selectedAnimal === entry.name) {
      onAnimalClick(null); // Deselect if clicking the same animal
    } else {
      onAnimalClick(entry.name);
    }
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={40}
            paddingAngle={2}
            dataKey="value"
            onClick={handleClick}
            cursor="pointer"
            labelLine={false}
            label={CustomLabel}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke={selectedAnimal === entry.name ? '#374151' : 'transparent'}
                strokeWidth={selectedAnimal === entry.name ? 3 : 0}
                opacity={selectedAnimal && selectedAnimal !== entry.name ? 0.4 : 1}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      

    </div>
  );
}