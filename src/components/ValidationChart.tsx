import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LineChart as ChartIcon, CheckCircle2, AlertTriangle, Flame, Snowflake } from 'lucide-react';
import { cn } from '../lib/utils';

interface ValidationChartProps {
  homogeneity: number;
  temperature: number;
  concentration: number;
  bitumenGrade: string;
}

interface BenchmarkPoint {
  time: number;
  penetration: number;
  softening: number;
}

const calculateBenchmarkCurves = (
  homogeneity: number,
  temperature: number,
  concentration: number,
  bitumenGrade: string
): BenchmarkPoint[] => {
  const times = [0, 15, 30, 45, 60, 75];

  // Baseline virgin bitumen properties at t=0
  const is6070 = bitumenGrade === '60/70';
  const basePen = is6070 ? 65 : 85; // dmm (0.1 mm)
  const baseSoftening = is6070 ? 48.5 : 44.0; // °C

  // CRM Concentration effect:
  // As CRM increases, polymer network stiffens binder:
  // - Softening point potential increase (approx +1.35°C per 1% CRM)
  // - Penetration potential decrease (approx -1.30 dmm per 1% CRM)
  const maxSofteningGain = concentration * 1.35;
  const maxPenDrop = concentration * 1.30;

  // Mixing homogeneity efficiency factor (better mixing -> faster and fuller reaction)
  const mixingEfficiency = 0.55 + 0.45 * Math.min(1, Math.max(0.2, homogeneity / 100));

  // Temperature Regimes:
  // Goldilocks window: 160°C - 190°C
  const isTooLow = temperature < 160;
  const isTooHigh = temperature > 190;

  return times.map((time) => {
    if (time === 0) {
      return {
        time: 0,
        penetration: Number(basePen.toFixed(1)),
        softening: Number(baseSoftening.toFixed(1)),
      };
    }

    if (isTooLow) {
      // REGIME: POOR DISPERSION (< 160°C)
      // Viscosity is too high and thermal activation energy is insufficient.
      // Rubber particles do not swell or dissolve properly.
      const tempDeficit = 160 - temperature; // 1 to 10°C
      const dispersionFactor = Math.max(0.18, 1.0 - tempDeficit * 0.08); // suppressed ceiling
      const tau = 22 * (1 + tempDeficit * 0.22); // severely slowed reaction kinetics
      const reactionProgress = 1 - Math.exp(-time / tau);

      const effectiveSofteningGain = maxSofteningGain * mixingEfficiency * dispersionFactor * reactionProgress;
      const effectivePenDrop = maxPenDrop * mixingEfficiency * dispersionFactor * reactionProgress;

      const softening = baseSoftening + effectiveSofteningGain;
      const penetration = Math.max(25, basePen - effectivePenDrop);

      return {
        time,
        penetration: Number(penetration.toFixed(1)),
        softening: Number(softening.toFixed(1)),
      };
    } else if (isTooHigh) {
      // REGIME: THERMAL DEGRADATION (> 190°C)
      // Initial accelerated swelling at t <= 15-30m, followed by severe
      // devulcanization and polymer chain scission at t >= 30m.
      const tempExcess = temperature - 190; // 1 to 10°C
      const initialProgress = 1 - Math.exp(-time / 14); // fast early absorption

      let softening = baseSoftening + maxSofteningGain * mixingEfficiency * initialProgress;
      let penetration = basePen - maxPenDrop * mixingEfficiency * initialProgress;

      // Degradation sets in progressively after 20 minutes
      if (time >= 25) {
        const degradeFactor = Math.pow((time - 20) / 45, 1.4) * (tempExcess * 1.55);
        // Softening point regresses sharply
        softening = Math.max(baseSoftening - 2, softening - degradeFactor);
        // Penetration regresses upwards as decomposed polymer structure breaks down
        penetration = Math.min(basePen + 5, penetration + degradeFactor * 0.7);
      }

      return {
        time,
        penetration: Number(Math.max(22, penetration).toFixed(1)),
        softening: Number(Math.max(38, softening).toFixed(1)),
      };
    } else {
      // REGIME: OPTIMAL GOLDILOCKS WINDOW (160°C - 190°C)
      // Ideal swelling, consistent dissolution, and stable polymer network plateau
      const tempBoost = 1.0 + ((temperature - 175) / 15) * 0.05;
      const tau = 21 / Math.max(0.8, tempBoost);
      const reactionProgress = 1 - Math.exp(-time / tau);

      const effectiveSofteningGain = maxSofteningGain * mixingEfficiency * reactionProgress;
      const effectivePenDrop = maxPenDrop * mixingEfficiency * reactionProgress;

      const softening = baseSoftening + effectiveSofteningGain;
      const penetration = Math.max(22, basePen - effectivePenDrop);

      return {
        time,
        penetration: Number(penetration.toFixed(1)),
        softening: Number(softening.toFixed(1)),
      };
    }
  });
};

export const ValidationChart: React.FC<ValidationChartProps> = ({
  homogeneity,
  temperature,
  concentration,
  bitumenGrade,
}) => {
  const data = useMemo(
    () => calculateBenchmarkCurves(homogeneity, temperature, concentration, bitumenGrade),
    [homogeneity, temperature, concentration, bitumenGrade]
  );

  const isGoldilocks = temperature >= 160 && temperature <= 190;
  const isPoorDispersion = temperature < 160;
  const isThermalDegradation = temperature > 190;

  // Key stats at 60 min benchmark
  const point60 = data.find((d) => d.time === 60) || data[data.length - 1];
  const point0 = data[0];
  const softeningGain = (point60.softening - point0.softening).toFixed(1);
  const penChange = (point60.penetration - point0.penetration).toFixed(1);

  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ChartIcon className="w-5 h-5 text-orange-500" />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-100">
              Lab Validation Benchmarks
            </h2>
            <p className="text-[10px] text-zinc-400 font-mono">
              ASTM D5 Penetration & ASTM D36 Softening Point vs Digestion Time
            </p>
          </div>
        </div>

        {/* Temperature & Regime Status Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {isGoldilocks && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Goldilocks Window (160–190°C)
            </span>
          )}
          {isPoorDispersion && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Snowflake className="w-3.5 h-3.5 text-amber-400" />
              Poor Dispersion Regime (T &lt; 160°C)
            </span>
          )}
          {isThermalDegradation && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
              <Flame className="w-3.5 h-3.5 text-red-400" />
              Thermal Degradation Active (T &gt; 190°C)
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Physical Property Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-2.5 bg-zinc-950/60 border border-zinc-800 rounded-lg">
          <div className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider">Softening Point (60m)</div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-mono font-bold text-blue-400">{point60.softening}°C</span>
            <span className="text-[10px] font-mono text-zinc-500">
              {Number(softeningGain) >= 0 ? `+${softeningGain}°C` : `${softeningGain}°C`}
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-zinc-950/60 border border-zinc-800 rounded-lg">
          <div className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider">Penetration (60m)</div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-mono font-bold text-orange-400">{point60.penetration}</span>
            <span className="text-[10px] font-mono text-zinc-500">
              0.1mm ({penChange})
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-zinc-950/60 border border-zinc-800 rounded-lg">
          <div className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider">CRM Concentration</div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-mono font-bold text-zinc-100">{concentration}%</span>
            <span className="text-[10px] text-zinc-500 font-sans">
              {concentration > 15 ? 'High Stiffening' : concentration > 5 ? 'Balanced' : 'Low Mod.'}
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-zinc-950/60 border border-zinc-800 rounded-lg">
          <div className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider">Polymer Network</div>
          <div className="mt-0.5">
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-wider font-mono",
                isGoldilocks ? "text-emerald-400" : isPoorDispersion ? "text-amber-400" : "text-red-400"
              )}
            >
              {isGoldilocks ? "Stable Plateau" : isPoorDispersion ? "Incomplete Swell" : "Chain Scission"}
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[290px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis 
              dataKey="time" 
              stroke="#71717a" 
              fontSize={10} 
              tickFormatter={(v) => `${v}m`}
            />
            <YAxis 
              stroke="#71717a" 
              fontSize={10} 
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
              itemStyle={{ fontSize: '12px' }}
              formatter={(value: any, name: any) => {
                if (name.includes('Penetration')) return [`${value} dmm (0.1mm)`, 'Penetration'];
                if (name.includes('Softening')) return [`${value} °C`, 'Softening Point'];
                return [value, name];
              }}
              labelFormatter={(label) => `Digestion Time: ${label} minutes`}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Line 
              type="monotone" 
              dataKey="penetration" 
              name="Penetration (0.1mm)" 
              stroke="#f97316" 
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#f97316' }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="softening" 
              name="Softening Point (°C)" 
              stroke="#3b82f6" 
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#3b82f6' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Contextual Scientific Analysis */}
      <div
        className={cn(
          "p-3 rounded-lg border text-[11px] leading-relaxed transition-colors",
          isGoldilocks
            ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-200"
            : isPoorDispersion
            ? "bg-amber-950/20 border-amber-800/40 text-amber-200"
            : "bg-red-950/20 border-red-800/40 text-red-200"
        )}
      >
        <div className="flex items-start gap-2">
          {isGoldilocks ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold uppercase tracking-wider">
              {isGoldilocks
                ? "Active Benchmark State: Optimal Polymer Digestion"
                : isPoorDispersion
                ? "Active Benchmark State: Poor CRM Dispersion (<160°C)"
                : "Active Benchmark State: Thermal Degradation & Depolymerization (>190°C)"}
            </span>
            <p className="mt-1 opacity-90">
              {isGoldilocks && (
                <>
                  CRM concentration ({concentration}%) stiffens the binder network, raising Softening Point to {point60.softening}°C (+{softeningGain}°C) and reducing Penetration to {point60.penetration} dmm. Within 160°C–190°C, the curve plateaus smoothly after 45m without thermal breakdown.
                </>
              )}
              {isPoorDispersion && (
                <>
                  At {temperature}°C, fluid viscosity is elevated and crumb rubber swells too sluggishly. Softening Point remains suppressed (stalling at {point60.softening}°C), leaving Penetration high ({point60.penetration} dmm) due to unintegrated rubber granules.
                </>
              )}
              {isThermalDegradation && (
                <>
                  At {temperature}°C, initial swelling peaks early, but severe devulcanization and chain scission destroy the polymer matrix after 30 min. The softening curve regresses sharply down to {point60.softening}°C, resulting in brittle, prematurely aged binder.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
