import React from 'react';
import { Activity, Zap, Droplets, Target, AlertTriangle } from 'lucide-react';
import { SimulationMetrics } from './TankSimulation';
import { cn } from '../lib/utils';

interface MetricsPanelProps {
  metrics: SimulationMetrics;
  digestionTime: number;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics, digestionTime }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isGoldilocks = metrics.homogeneity > 90 && digestionTime > 30 && digestionTime < 60;

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Homogeneity */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Homogeneity</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-mono font-bold text-zinc-100">{metrics.homogeneity.toFixed(1)}</span>
          <span className="text-xs text-zinc-500">%</span>
        </div>
        <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500" 
            style={{ width: `${metrics.homogeneity}%` }} 
          />
        </div>
      </div>

      {/* Dead Zones */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Dead Zones</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-mono font-bold text-zinc-100">{metrics.deadZonePercentage.toFixed(1)}</span>
          <span className="text-xs text-zinc-500">%</span>
        </div>
        <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-red-500 transition-all duration-500" 
            style={{ width: `${metrics.deadZonePercentage}%` }} 
          />
        </div>
      </div>

      {/* Viscosity */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Droplets className="w-4 h-4 text-blue-500" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Viscosity</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-mono font-bold text-zinc-100">{metrics.viscosity.toFixed(3)}</span>
          <span className="text-xs text-zinc-500">Pa·s</span>
        </div>
      </div>

      {/* Energy */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Energy Load</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-mono font-bold text-zinc-100">{metrics.energyConsumption.toFixed(1)}</span>
          <span className="text-xs text-zinc-500">kW</span>
        </div>
      </div>

      {/* Digestion Status */}
      <div className={cn(
        "col-span-2 p-6 border rounded-xl transition-all duration-500",
        isGoldilocks 
          ? "bg-emerald-500/10 border-emerald-500/50" 
          : "bg-zinc-900 border-zinc-800"
      )}>
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className={cn("w-5 h-5", isGoldilocks ? "text-emerald-500" : "text-zinc-500")} />
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100">Digestion Progress</h3>
            </div>
            <p className="text-xs text-zinc-500">
              {isGoldilocks 
                ? "Optimal digestion reached. 'Goldilocks Window' active." 
                : "Digestion in progress. Monitoring homogeneity..."}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-orange-500">{formatTime(digestionTime)}</div>
            <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Process Time</div>
          </div>
        </div>
        {isGoldilocks && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
              Data-Driven Shutdown Recommended
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
