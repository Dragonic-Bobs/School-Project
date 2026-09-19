import React from 'react';
import { Settings, Thermometer, RotateCw, FlaskConical, Play, Square, RefreshCcw } from 'lucide-react';
import { cn } from '../lib/utils';

interface ControlPanelProps {
  rpm: number;
  setRpm: (v: number) => void;
  temperature: number;
  setTemperature: (v: number) => void;
  concentration: number;
  setConcentration: (v: number) => void;
  bitumenGrade: string;
  setBitumenGrade: (v: string) => void;
  isSimulating: boolean;
  setIsSimulating: (v: boolean) => void;
  onReset: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  rpm, setRpm,
  temperature, setTemperature,
  concentration, setConcentration,
  bitumenGrade, setBitumenGrade,
  isSimulating, setIsSimulating,
  onReset
}) => {
  return (
    <div className="flex flex-col gap-6 p-6 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-orange-500" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-100">Process Parameters</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-tighter transition-all",
              isSimulating 
                ? "bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20" 
                : "bg-orange-500 text-zinc-900 hover:bg-orange-400"
            )}
          >
            {isSimulating ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            {isSimulating ? "Stop Solver" : "Start Solver"}
          </button>
          <button
            onClick={onReset}
            className="p-2 bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-700 rounded-lg transition-colors"
            title="Reset Simulation"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* RPM Control */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
              <RotateCw className="w-3 h-3" /> Impeller Speed (RPM)
            </label>
            <span className="font-mono text-orange-500 text-sm font-bold">{rpm}</span>
          </div>
          <input
            type="range"
            min="0"
            max="3000"
            step="50"
            value={rpm}
            onChange={(e) => setRpm(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-600">
            <span>0</span>
            <span>1500</span>
            <span>3000</span>
          </div>
        </div>

        {/* Temperature Control */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
              <Thermometer className="w-3 h-3" /> Digestion Temp (°C)
            </label>
            <span className="font-mono text-orange-500 text-sm font-bold">{temperature}°C</span>
          </div>
          <input
            type="range"
            min="150"
            max="200"
            step="1"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-600">
            <span>150°C</span>
            <span className="text-orange-900/50 font-bold">Goldilocks Window (160-190)</span>
            <span>200°C</span>
          </div>
        </div>

        {/* Concentration Control */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
              <FlaskConical className="w-3 h-3" /> CRM Concentration (%)
            </label>
            <span className="font-mono text-orange-500 text-sm font-bold">{concentration}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="25"
            step="0.5"
            value={concentration}
            onChange={(e) => setConcentration(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-600">
            <span>0%</span>
            <span>12.5%</span>
            <span>25%</span>
          </div>
        </div>

        {/* Bitumen Grade */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Base Bitumen Grade</label>
          <div className="grid grid-cols-2 gap-2">
            {['60/70', '80/100'].map((grade) => (
              <button
                key={grade}
                onClick={() => setBitumenGrade(grade)}
                className={cn(
                  "py-2 text-xs font-bold rounded border transition-all",
                  bitumenGrade === grade
                    ? "bg-orange-500/10 border-orange-500 text-orange-500"
                    : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600"
                )}
              >
                Pen Grade {grade}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
