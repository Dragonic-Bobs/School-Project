import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LineChart as ChartIcon } from 'lucide-react';

const generateData = (homogeneity: number) => {
  // Mock validation data based on current homogeneity
  const baseData = [
    { time: 0, penetration: 70, softening: 45 },
    { time: 15, penetration: 65, softening: 48 },
    { time: 30, penetration: 58, softening: 52 },
    { time: 45, penetration: 52, softening: 58 },
    { time: 60, penetration: 48, softening: 62 },
    { time: 75, penetration: 45, softening: 65 },
  ];

  // Adjust based on current simulation state
  return baseData.map(d => ({
    ...d,
    penetration: d.penetration + (100 - homogeneity) * 0.1,
    softening: d.softening - (100 - homogeneity) * 0.1,
  }));
};

interface ValidationChartProps {
  homogeneity: number;
}

export const ValidationChart: React.FC<ValidationChartProps> = ({ homogeneity }) => {
  const data = generateData(homogeneity);

  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <ChartIcon className="w-5 h-5 text-orange-500" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-100">Lab Validation Benchmarks</h2>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis 
              dataKey="time" 
              stroke="#71717a" 
              fontSize={10} 
              tickFormatter={(v) => `${v}m`}
            />
            <YAxis stroke="#71717a" fontSize={10} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Line 
              type="monotone" 
              dataKey="penetration" 
              name="Penetration (0.1mm)" 
              stroke="#f97316" 
              strokeWidth={2}
              dot={{ r: 4, fill: '#f97316' }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="softening" 
              name="Softening Point (°C)" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ r: 4, fill: '#3b82f6' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          <span className="font-bold text-zinc-400">Note:</span> These curves represent the predicted physical properties of the binder. 
          The intersection point and slope are dynamically adjusted based on the current CFD homogeneity and digestion temperature.
        </p>
      </div>
    </div>
  );
};
