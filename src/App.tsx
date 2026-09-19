import React, { useState, useEffect } from 'react';
import { TankSimulation, SimulationMetrics } from './components/TankSimulation';
import { ControlPanel } from './components/ControlPanel';
import { MetricsPanel } from './components/MetricsPanel';
import { ValidationChart } from './components/ValidationChart';
import { Beaker, Info, ShieldCheck, Zap } from 'lucide-react';

export default function App() {
  const [rpm, setRpm] = useState(1200);
  const [temperature, setTemperature] = useState(175);
  const [concentration, setConcentration] = useState(10);
  const [bitumenGrade, setBitumenGrade] = useState('60/70');
  const [isSimulating, setIsSimulating] = useState(false);
  const [digestionTime, setDigestionTime] = useState(0);
  const [metrics, setMetrics] = useState<SimulationMetrics>({
    avgVelocity: 0,
    deadZonePercentage: 0,
    homogeneity: 0,
    viscosity: 0.5,
    energyConsumption: 0,
  });

  useEffect(() => {
    let interval: number;
    if (isSimulating) {
      interval = window.setInterval(() => {
        setDigestionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  const handleReset = () => {
    setDigestionTime(0);
    setIsSimulating(false);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
              <Beaker className="w-5 h-5 text-zinc-900" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-100">Bitumen CFD</h1>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Digital Mixing Window v1.0</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> ISO 9001 Compliant</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Energy Optimized</span>
            </div>
            <div className="h-8 w-[1px] bg-zinc-800" />
            <div className="text-right">
              <div className="text-xs font-bold text-zinc-100">Richard Ayomide Miracle</div>
              <div className="text-[9px] text-zinc-500 uppercase tracking-tighter">Materials Engineering | OAU</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Simulation & Metrics */}
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TankSimulation
                rpm={rpm}
                temperature={temperature}
                concentration={concentration}
                bitumenGrade={bitumenGrade}
                isSimulating={isSimulating}
                onMetricsUpdate={setMetrics}
              />
              <MetricsPanel 
                metrics={metrics} 
                digestionTime={digestionTime} 
              />
            </div>

            <ValidationChart homogeneity={metrics.homogeneity} />

            <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Info className="w-5 h-5 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Research Context</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    This simulation addresses the "Black Box Problem" in bitumen modification. By visualizing velocity vectors and identifying 
                    <span className="text-red-400 font-bold"> Dead Zones</span>, engineers can optimize impeller RPM and digestion temperature 
                    (160°C - 190°C) to ensure a 100% homogenous mix. This data-driven approach reduces energy waste and prevents the 
                    premature failure of road surfaces like rutting and fatigue cracking.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Controls & Info */}
          <div className="lg:col-span-4 space-y-8">
            <ControlPanel
              rpm={rpm} setRpm={setRpm}
              temperature={temperature} setTemperature={setTemperature}
              concentration={concentration} setConcentration={setConcentration}
              bitumenGrade={bitumenGrade} setBitumenGrade={setBitumenGrade}
              isSimulating={isSimulating} setIsSimulating={setIsSimulating}
              onReset={handleReset}
            />

            <div className="p-6 bg-orange-500/5 border border-orange-500/20 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest">Economic Impact</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500 uppercase">Fuel Savings Est.</span>
                  <span className="text-sm font-mono font-bold text-zinc-100">15-20%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500 uppercase">Machinery Wear Reduc.</span>
                  <span className="text-sm font-mono font-bold text-zinc-100">12%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500 uppercase">Road Lifespan Ext.</span>
                  <span className="text-sm font-mono font-bold text-zinc-100">+5 Years</span>
                </div>
              </div>
              <div className="pt-4 border-t border-orange-500/10">
                <p className="text-[10px] text-zinc-500 italic">
                  "Breaking the paywall by moving heavy engineering simulations into the browser."
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-zinc-900 py-10 px-6">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
            © 2026 Obafemi Awolowo University | Dept. of Materials Science & Engineering
          </div>
          <div className="flex gap-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <a href="#" className="hover:text-orange-500 transition-colors">Documentation</a>
            <a href="#" className="hover:text-orange-500 transition-colors">Lab Data</a>
            <a href="#" className="hover:text-orange-500 transition-colors">Methodology</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
