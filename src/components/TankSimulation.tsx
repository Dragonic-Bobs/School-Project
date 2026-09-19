import React, { useEffect, useRef, useState, useMemo } from 'react';
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

  // Physical parameters
  const baseViscosity = bitumenGrade === '60/70' ? 0.5 : 0.4;
  const tempFactor = Math.exp(-0.05 * (temperature - 160));
  const concFactor = 1 + 0.1 * concentration;
  const currentViscosity = baseViscosity * tempFactor * concFactor;

  useEffect(() => {
    solver.visc = currentViscosity * 0.001; // Scale for solver
  }, [currentViscosity, solver]);

  const render = () => {
    if (!canvasRef.current || !isSimulating) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

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

    // Draw
    ctx.clearRect(0, 0, SIZE * SCALE, SIZE * SCALE);
    
    let totalVel = 0;
    let deadZoneCount = 0;
    const deadZoneThreshold = 0.05;

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

    // Highlight Dead Zones (bottom corners and edges)
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

    // Update metrics
    const avgVel = totalVel / (SIZE * SIZE);
    const deadZonePerc = (deadZoneCount / (SIZE * SIZE)) * 100;
    const homogeneity = Math.max(0, 100 - deadZonePerc - (Math.random() * 5)); // Simplified
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
  }, [isSimulating, rpm, temperature, concentration, bitumenGrade]);

  return (
    <div className="relative border-2 border-zinc-800 bg-zinc-900 rounded-lg overflow-hidden shadow-2xl">
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        <span className="px-2 py-1 bg-zinc-800/80 text-[10px] font-mono text-zinc-400 uppercase tracking-wider border border-zinc-700 rounded">
          Live CFD Feed
        </span>
        <span className="px-2 py-1 bg-red-900/40 text-[10px] font-mono text-red-400 uppercase tracking-wider border border-red-800/50 rounded animate-pulse">
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
