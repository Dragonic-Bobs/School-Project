import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Sparkles, Fuel, Wrench, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

interface EconomicImpactPanelProps {
  temperature: number;
  rpm: number;
  concentration: number;
  deadZonePercentage: number;
  homogeneity: number;
}

export const EconomicImpactPanel: React.FC<EconomicImpactPanelProps> = ({
  temperature,
  rpm,
  concentration,
  deadZonePercentage,
  homogeneity,
}) => {
  // 1. Temperature window factor (Goldilocks: 160°C - 190°C)
  const isGoldilocksTemp = temperature >= 160 && temperature <= 190;
  let tempFactor = 1.0;
  if (isGoldilocksTemp) {
    // Peak at 175°C
    const distFromCenter = Math.abs(temperature - 175);
    tempFactor = 1.0 - (distFromCenter / 15) * 0.08; // 0.92 to 1.0
  } else if (temperature < 160) {
    // Poor dispersion penalty
    const diff = 160 - temperature;
    tempFactor = Math.max(-0.2, 0.85 - diff * 0.09); // drops down to ~ -0.05 at 150°C
  } else {
    // Thermal degradation penalty (> 190°C)
    const diff = temperature - 190;
    tempFactor = Math.max(-0.4, 0.85 - diff * 0.13); // drops down to -0.45 at 200°C
  }

  // 2. Dead zone & homogeneity flow factor
  // Minimized dead zones (< 12%) is optimal
  let deadZoneFactor = 1.0;
  if (deadZonePercentage <= 12) {
    deadZoneFactor = 1.0 - (deadZonePercentage / 12) * 0.08; // 0.92 to 1.0
  } else if (deadZonePercentage <= 30) {
    deadZoneFactor = 0.90 - ((deadZonePercentage - 12) / 18) * 0.45; // 0.45 to 0.90
  } else {
    deadZoneFactor = Math.max(-0.6, 0.45 - ((deadZonePercentage - 30) / 70) * 1.05); // drops to negative
  }

  // Homogeneity factor (ideally > 88%)
  const homoFactor = Math.max(-0.3, (homogeneity - 45) / 55);

  // RPM efficiency penalty if RPM is 0 or excessive (> 2600)
  let rpmEfficiency = 1.0;
  if (rpm === 0) {
    rpmEfficiency = -0.5;
  } else if (rpm < 600) {
    rpmEfficiency = 0.3;
  } else if (rpm > 2600) {
    rpmEfficiency = 0.85 - ((rpm - 2600) / 400) * 0.25; // wasted electrical load
  }

  // Overall process health score [-1, 1]
  const rawScore = 0.42 * tempFactor + 0.38 * deadZoneFactor + 0.20 * homoFactor;
  const processScore = Math.max(-1, Math.min(1, rawScore * Math.max(0.2, rpmEfficiency)));

  // Calculate Metrics based on processScore
  // Optimal: 15-20% fuel savings, 12% machinery wear reduction, +5 Years lifespan
  let fuelSavingsDisplay: string;
  let fuelSavingsSub: string;
  let fuelIsPositive = true;

  let wearDisplay: string;
  let wearSub: string;
  let wearIsPositive = true;

  let lifespanDisplay: string;
  let lifespanSub: string;
  let lifespanIsPositive = true;

  if (processScore >= 0.75) {
    // Optimal Goldilocks regime: 15 - 20%
    const fuelVal = 15 + (processScore - 0.75) * 20; // 15.0% to 20.0%
    fuelSavingsDisplay = `${fuelVal.toFixed(1)}%`;
    fuelSavingsSub = 'Optimal Thermal Window';

    const wearVal = 10 + (processScore - 0.75) * 8; // 10.0% to 12.0%
    wearDisplay = `${wearVal.toFixed(0)}%`;
    wearSub = 'Min Cavitation & Drag';

    const lifeVal = 4.5 + (processScore - 0.75) * 2.0; // +4.5 to +5.0 Years
    lifespanDisplay = `+${lifeVal.toFixed(1)} Years`;
    lifespanSub = 'Rutting & Fatigue Resilient';
  } else if (processScore >= 0.25) {
    // Suboptimal regime
    const fuelVal = 4 + ((processScore - 0.25) / 0.5) * 10; // 4% to 14%
    fuelSavingsDisplay = `${fuelVal.toFixed(1)}%`;
    fuelSavingsSub = 'Suboptimal Dispersion';

    const wearVal = 3 + ((processScore - 0.25) / 0.5) * 6; // 3% to 9%
    wearDisplay = `${wearVal.toFixed(0)}%`;
    wearSub = 'Moderate Vessel Drag';

    const lifeVal = 1.5 + ((processScore - 0.25) / 0.5) * 2.8; // +1.5 to +4.3 Years
    lifespanDisplay = `+${lifeVal.toFixed(1)} Years`;
    lifespanSub = 'Standard Quality Binder';
  } else if (processScore >= 0) {
    // Low efficiency regime
    const fuelVal = processScore * 12; // 0% to 3%
    fuelSavingsDisplay = `${fuelVal.toFixed(1)}%`;
    fuelSavingsSub = 'High Thermal Loss';

    const wearVal = processScore * 8;
    wearDisplay = `${wearVal.toFixed(0)}%`;
    wearSub = 'High Viscous Resistance';

    const lifeVal = Math.max(0.2, processScore * 4);
    lifespanDisplay = `+${lifeVal.toFixed(1)} Years`;
    lifespanSub = 'Incomplete Polymer Matrix';
  } else {
    // Negative outcome: High Energy Waste / Premature Wear / Road Failure
    fuelIsPositive = false;
    const wastePercent = Math.abs(processScore * 18);
    fuelSavingsDisplay = `-${wastePercent.toFixed(0)}%`;
    fuelSavingsSub = 'High Energy Waste';

    wearIsPositive = false;
    const wearPenalty = Math.abs(processScore * 15);
    wearDisplay = `+${wearPenalty.toFixed(0)}%`;
    wearSub = 'Accelerated Wear & Drag';

    lifespanIsPositive = false;
    const lossYears = Math.abs(processScore * 2.8);
    lifespanDisplay = `-${lossYears.toFixed(1)} Years`;
    lifespanSub = 'Premature Rutting Failure';
  }

  // Status diagnosis
  let statusBadge: { text: string; bg: string; textCol: string; border: string; icon: React.ReactNode };
  let diagnosisMessage: string;

  if (processScore >= 0.75) {
    statusBadge = {
      text: 'Peak Savings Active',
      bg: 'bg-emerald-500/10',
      textCol: 'text-emerald-400',
      border: 'border-emerald-500/30',
      icon: <CheckCircle className="w-3 h-3 text-emerald-400" />,
    };
    diagnosisMessage =
      'Ideal digestion temperature (160°C–190°C) with minimized dead zones (<12%). Maximizing binder elasticity and fuel economy.';
  } else if (temperature > 190) {
    statusBadge = {
      text: 'Thermal Degradation',
      bg: 'bg-red-500/10',
      textCol: 'text-red-400',
      border: 'border-red-500/30',
      icon: <AlertTriangle className="w-3 h-3 text-red-400" />,
    };
    diagnosisMessage =
      'Tank temperature exceeds 190°C. Thermal chain scission degrades polymers, turning burner fuel into net energy waste.';
  } else if (temperature < 160) {
    statusBadge = {
      text: 'Poor CRM Dispersion',
      bg: 'bg-amber-500/10',
      textCol: 'text-amber-400',
      border: 'border-amber-500/30',
      icon: <AlertTriangle className="w-3 h-3 text-amber-400" />,
    };
    diagnosisMessage =
      'Temperature below 160°C prevents rubber swelling. High viscosity creates stagnant flow and suppresses economic returns.';
  } else if (deadZonePercentage > 35 || homogeneity < 65) {
    statusBadge = {
      text: 'High Dead Zones',
      bg: 'bg-red-500/10',
      textCol: 'text-red-400',
      border: 'border-red-500/30',
      icon: <AlertTriangle className="w-3 h-3 text-red-400" />,
    };
    diagnosisMessage =
      'Excessive dead zones detected (>35%). Severe fluid stagnation risks binder segregation and premature pavement failure.';
  } else {
    statusBadge = {
      text: 'Suboptimal Mix',
      bg: 'bg-zinc-800',
      textCol: 'text-zinc-400',
      border: 'border-zinc-700',
      icon: <TrendingUp className="w-3 h-3 text-zinc-400" />,
    };
    diagnosisMessage =
      'Approaching optimal envelope. Increase RPM or fine-tune temperature to 175°C to unlock maximum 15-20% fuel savings.';
  }

  // Process Optimization meter (0 to 100%)
  const meterPercent = Math.max(0, Math.min(100, (processScore + 0.3) / 1.3 * 100));

  return (
    <div
      className={cn(
        "p-6 rounded-xl space-y-4 border transition-all duration-500",
        processScore >= 0.75
          ? "bg-emerald-950/10 border-emerald-500/30 shadow-lg shadow-emerald-950/20"
          : processScore < 0.2
          ? "bg-red-950/10 border-red-500/30 shadow-lg shadow-red-950/20"
          : "bg-orange-500/5 border-orange-500/20"
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
          Economic Impact
        </h3>
        <span
          className={cn(
            "flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold uppercase rounded border transition-colors",
            statusBadge.bg,
            statusBadge.textCol,
            statusBadge.border
          )}
        >
          {statusBadge.icon}
          {statusBadge.text}
        </span>
      </div>

      {/* Dynamic Process Health Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[9px] font-mono uppercase tracking-wider text-zinc-400">
          <span>Simulation Efficiency Rating</span>
          <span
            className={cn(
              "font-bold",
              processScore >= 0.75 ? "text-emerald-400" : processScore < 0.2 ? "text-red-400" : "text-orange-400"
            )}
          >
            {processScore >= 0.75 ? "Optimal (15-20% Target)" : processScore < 0.2 ? "Negative (Energy Waste)" : "Moderate"}
          </span>
        </div>
        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500",
              processScore >= 0.75
                ? "bg-emerald-500"
                : processScore < 0.2
                ? "bg-red-500"
                : "bg-orange-500"
            )}
            style={{ width: `${meterPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {/* Fuel Savings */}
        <div className="flex justify-between items-center p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
          <div>
            <div className="text-[10px] text-zinc-400 uppercase font-semibold flex items-center gap-1">
              <Fuel className="w-3 h-3 text-orange-500" />
              Fuel Savings Est.
            </div>
            <div className={cn("text-[9px]", fuelIsPositive ? "text-zinc-500" : "text-red-400 font-semibold")}>
              {fuelSavingsSub}
            </div>
          </div>
          <div className="text-right">
            <span
              className={cn(
                "text-sm font-mono font-bold transition-colors",
                fuelIsPositive
                  ? processScore >= 0.75
                    ? "text-emerald-400"
                    : "text-zinc-100"
                  : "text-red-400 font-black animate-pulse"
              )}
            >
              {fuelSavingsDisplay}
            </span>
          </div>
        </div>

        {/* Machinery Wear */}
        <div className="flex justify-between items-center p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
          <div>
            <div className="text-[10px] text-zinc-400 uppercase font-semibold flex items-center gap-1">
              <Wrench className="w-3 h-3 text-orange-500" />
              Machinery Wear Reduc.
            </div>
            <div className={cn("text-[9px]", wearIsPositive ? "text-zinc-500" : "text-red-400 font-semibold")}>
              {wearSub}
            </div>
          </div>
          <div className="text-right">
            <span
              className={cn(
                "text-sm font-mono font-bold transition-colors",
                wearIsPositive
                  ? processScore >= 0.75
                    ? "text-emerald-400"
                    : "text-zinc-100"
                  : "text-red-400 font-black"
              )}
            >
              {wearDisplay}
            </span>
          </div>
        </div>

        {/* Road Lifespan */}
        <div className="flex justify-between items-center p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
          <div>
            <div className="text-[10px] text-zinc-400 uppercase font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-orange-500" />
              Road Lifespan Ext.
            </div>
            <div className={cn("text-[9px]", lifespanIsPositive ? "text-zinc-500" : "text-red-400 font-semibold")}>
              {lifespanSub}
            </div>
          </div>
          <div className="text-right">
            <span
              className={cn(
                "text-sm font-mono font-bold transition-colors",
                lifespanIsPositive
                  ? processScore >= 0.75
                    ? "text-emerald-400"
                    : "text-zinc-100"
                  : "text-red-400 font-black"
              )}
            >
              {lifespanDisplay}
            </span>
          </div>
        </div>
      </div>

      {/* Diagnosis Explanation */}
      <div className="p-2.5 bg-zinc-900/40 rounded-lg border border-zinc-800/60">
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          {diagnosisMessage}
        </p>
      </div>

      <div className="pt-2 border-t border-orange-500/10">
        <p className="text-[10px] text-zinc-500 italic">
          "Breaking the paywall by moving heavy engineering simulations into the browser."
        </p>
      </div>
    </div>
  );
};
