import React, { useEffect, useRef, useMemo } from 'react';
import { FluidSolver } from '../lib/solver';
import { cn } from '../lib/utils';

interface TankSimulationProps {
  rpm: number;
  temperature: number;
  concentration: number;
  bitumenGrade: string;
  isSimulating: boolean;
  onMetricsUpdate: (metrics: SimulationMetrics) => void;
}

export interface SimulationMetrics {
  avgVelocity: number;
  deadZonePercentage: number;
  homogeneity: number;
  viscosity: number;
  energyConsumption: number;
}

const SIZE = 64;
const SCALE = 8;

export const TankSimulation: React.FC<TankSimulationProps> = ({
  rpm,
  temperature,
  concentration,
  bitumenGrade,
  isSimulating,
  onMetricsUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const solver = useMemo(() => new FluidSolver(SIZE, 0.1, 0.0001, 0.0001), []);
  const requestRef = useRef<number>(null);
  const rotationAngleRef = useRef<number>(0);

  // Physical parameters
  const baseViscosity = bitumenGrade === '60/70' ? 0.5 : 0.4;
  const tempFactor = Math.exp(-0.05 * (temperature - 160));
  const concFactor = 1 + 0.1 * concentration;
  const currentViscosity = baseViscosity * tempFactor * concFactor;

  useEffect(() => {
    solver.visc = currentViscosity * 0.001; // Scale for solver
  }, [currentViscosity, solver]);

  // Draw standby visualization when solver is paused
  const drawStaticTank = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = SIZE * SCALE;
    const height = SIZE * SCALE;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Vessel fluid background
    const gradient = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, width / 2);
    gradient.addColorStop(0, '#1c1917');
    gradient.addColorStop(0.7, '#0c0a09');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Mixing Tank Circular Vessel Outline
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, width / 2 - 12, 0, Math.PI * 2);
    ctx.stroke();

    // Dead zone corner indicators (typical stagnation areas in square mixing profiles)
    const deadZoneIntensity = Math.min(1, Math.max(0.1, 1 - (rpm / 2000)));
    ctx.strokeStyle = `rgba(239, 68, 68, ${0.15 * deadZoneIntensity})`;
    ctx.fillStyle = `rgba(239, 68, 68, ${0.04 * deadZoneIntensity})`;
    const cornerSize = 80;

    // 4 corners
    const corners = [
      [8, 8],
      [width - 8 - cornerSize, 8],
      [8, height - 8 - cornerSize],
      [width - 8 - cornerSize, height - 8 - cornerSize],
    ];
    corners.forEach(([x, y]) => {
      ctx.fillRect(x, y, cornerSize, cornerSize);
      ctx.strokeRect(x, y, cornerSize, cornerSize);
    });

    // Impeller Hub & Blades in center
    ctx.save();
    ctx.translate(centerX, centerY);
    const blades = 4;
    const bladeLength = 70;
    const bladeWidth = 14;

    ctx.strokeStyle = '#f97316';
    ctx.fillStyle = '#ea580c';

    for (let b = 0; b < blades; b++) {
      ctx.rotate((Math.PI * 2) / blades);
      ctx.beginPath();
      ctx.rect(-bladeWidth / 2, 12, bladeWidth, bladeLength);
      ctx.fill();
      ctx.stroke();
    }

    // Center Hub
    ctx.fillStyle = '#78716c';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Standby guidance text in center-bottom
    ctx.fillStyle = 'rgba(168, 162, 158, 0.7)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SOLVER STANDBY • LIVE VELOCITY FIELD READY', centerX, height - 26);
  };

  // Immediate baseline metrics calculation when sliders move or on load
  useEffect(() => {
    if (!isSimulating) {
      let deadZone: number;
      let avgV: number;
      let homo: number;

      if (rpm === 0) {
        deadZone = 100;
        avgV = 0;
        homo = 0;
      } else {
        const shear = (rpm / 1000) / Math.sqrt(Math.max(0.1, currentViscosity));
        // Exponential decay of dead zones with increasing shear
        deadZone = Math.max(3.2, Math.min(99, 100 * Math.exp(-0.88 * shear)));
        avgV = (rpm / 3000) * 0.38 / Math.sqrt(Math.max(0.2, currentViscosity));
        homo = Math.max(0, Math.min(99.2, 100 - deadZone * 1.05));
      }

      const energy = (rpm * rpm * 0.00001) + (temperature * 0.1);

      onMetricsUpdate({
        avgVelocity: avgV,
        deadZonePercentage: deadZone,
        homogeneity: homo,
        viscosity: currentViscosity,
        energyConsumption: energy,
      });

      drawStaticTank();
    }
  }, [isSimulating, rpm, temperature, concentration, bitumenGrade, currentViscosity]);

  const render = () => {
    if (!canvasRef.current || !isSimulating) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    rotationAngleRef.current += (rpm / 1000) * 0.15;

    // Add forces from impeller (center)
    const centerX = SIZE / 2;
    const centerY = SIZE / 2;
    const force = (rpm / 1000) * 2;
    
    // Simulating a high-shear impeller (radial and axial flow)
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        const angle = Math.atan2(j, i);
        solver.addVelocity(centerX + i, centerY + j, Math.cos(angle + Math.PI/2) * force, Math.sin(angle + Math.PI/2) * force);
        solver.addDensity(centerX + i, centerY + j, concentration / 100);
      }
    }

    solver.step();

    // Draw fluid field
    ctx.clearRect(0, 0, SIZE * SCALE, SIZE * SCALE);
    
    let totalVel = 0;
    let deadZoneCount = 0;
    // Dead zone threshold depends slightly on fluid viscosity
    const deadZoneThreshold = 0.045 * Math.sqrt(Math.max(0.25, currentViscosity / 0.5));

    for (let j = 1; j <= SIZE; j++) {
      for (let i = 1; i <= SIZE; i++) {
        const d = solver.density[solver.getIndex(i, j)];
        const u = solver.u[solver.getIndex(i, j)];
        const v = solver.v[solver.getIndex(i, j)];
        const vel = Math.sqrt(u * u + v * v);
        
        totalVel += vel;
        if (vel < deadZoneThreshold) deadZoneCount++;

        // Draw fluid density
        const alpha = Math.min(d * 2, 1);
        ctx.fillStyle = `rgba(30, 30, 30, ${alpha})`;
        ctx.fillRect((i - 1) * SCALE, (j - 1) * SCALE, SCALE, SCALE);

        // Draw velocity vectors (occasionally)
        if (i % 4 === 0 && j % 4 === 0 && vel > 0.01) {
          ctx.strokeStyle = `rgba(255, 100, 0, ${Math.min(vel * 2, 0.5)})`;
          ctx.beginPath();
          ctx.moveTo((i - 1) * SCALE, (j - 1) * SCALE);
          ctx.lineTo((i - 1 + u * 10) * SCALE, (j - 1 + v * 10) * SCALE);
          ctx.stroke();
        }
      }
    }

    // Highlight Dead Zones (bottom corners and perimeter stagnations)
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    for (let j = 1; j <= SIZE; j++) {
      for (let i = 1; i <= SIZE; i++) {
        const u = solver.u[solver.getIndex(i, j)];
        const v = solver.v[solver.getIndex(i, j)];
        const vel = Math.sqrt(u * u + v * v);
        if (vel < deadZoneThreshold) {
          ctx.strokeRect((i - 1) * SCALE, (j - 1) * SCALE, SCALE, SCALE);
        }
      }
    }

    // Draw central rotating impeller
    ctx.save();
    ctx.translate(centerX * SCALE, centerY * SCALE);
    ctx.rotate(rotationAngleRef.current);
    ctx.fillStyle = '#f97316';
    for (let b = 0; b < 4; b++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillRect(-4, 6, 8, 32);
    }
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#e4e4e7';
    ctx.fill();
    ctx.restore();

    // Update metrics
    const avgVel = totalVel / (SIZE * SIZE);
    const deadZonePerc = (deadZoneCount / (SIZE * SIZE)) * 100;
    const homogeneity = Math.max(0, Math.min(100, 100 - deadZonePerc * 1.05 - (Math.random() * 1.5)));
    const energy = (rpm * rpm * 0.00001) + (temperature * 0.1);

    onMetricsUpdate({
      avgVelocity: avgVel,
      deadZonePercentage: deadZonePerc,
      homogeneity: homogeneity,
      viscosity: currentViscosity,
      energyConsumption: energy,
    });

    requestRef.current = requestAnimationFrame(render);
  };

  useEffect(() => {
    if (isSimulating) {
      requestRef.current = requestAnimationFrame(render);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isSimulating, rpm, temperature, concentration, bitumenGrade, currentViscosity]);

  return (
    <div className="relative border-2 border-zinc-800 bg-zinc-900 rounded-lg overflow-hidden shadow-2xl">
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        <span className="px-2 py-1 bg-zinc-800/80 text-[10px] font-mono text-zinc-400 uppercase tracking-wider border border-zinc-700 rounded">
          {isSimulating ? 'Live CFD Feed' : 'CFD Solver Standby'}
        </span>
        <span
          className={cn(
            "px-2 py-1 text-[10px] font-mono uppercase tracking-wider border rounded transition-colors",
            isSimulating
              ? "bg-red-900/40 text-red-400 border-red-800/50 animate-pulse"
              : "bg-zinc-800/80 text-zinc-400 border-zinc-700"
          )}
        >
          Dead Zone Mapping Active
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={SIZE * SCALE}
        height={SIZE * SCALE}
        className="w-full aspect-square cursor-crosshair"
      />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
        <div 
          className="h-full bg-orange-500 transition-all duration-500" 
          style={{ width: `${Math.min(rpm / 30, 100)}%` }} 
        />
      </div>
    </div>
  );
};
