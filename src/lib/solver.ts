/**
 * Stable Fluids Solver (Jos Stam's Algorithm)
 * Adapted for Bitumen Mixing Simulation
 */

export class FluidSolver {
  size: number;
  dt: number;
  diff: number;
  visc: number;

  s: Float32Array;
  density: Float32Array;

  u: Float32Array;
  v: Float32Array;

  u0: Float32Array;
  v0: Float32Array;

  constructor(size: number, dt: number, diffusion: number, viscosity: number) {
    this.size = size;
    this.dt = dt;
    this.diff = diffusion;
    this.visc = viscosity;

    const numCells = (size + 2) * (size + 2);
    this.s = new Float32Array(numCells);
    this.density = new Float32Array(numCells);

    this.u = new Float32Array(numCells);
    this.v = new Float32Array(numCells);

    this.u0 = new Float32Array(numCells);
    this.v0 = new Float32Array(numCells);
  }

  addDensity(x: number, y: number, amount: number) {
    const index = this.getIndex(x, y);
    this.density[index] += amount;
  }

  addVelocity(x: number, y: number, amountX: number, amountY: number) {
    const index = this.getIndex(x, y);
    this.u[index] += amountX;
    this.v[index] += amountY;
  }

  getIndex(x: number, y: number) {
    return x + (this.size + 2) * y;
  }

  step() {
    const { size, visc, diff, dt, u, v, u0, v0, s, density } = this;

    // Velocity step
    this.diffuse(1, u0, u, visc, dt);
    this.diffuse(2, v0, v, visc, dt);

    this.project(u0, v0, u, v);

    this.advect(1, u, u0, u0, v0, dt);
    this.advect(2, v, v0, u0, v0, dt);

    this.project(u, v, u0, v0);

    // Density step
    this.diffuse(0, s, density, diff, dt);
    this.advect(0, density, s, u, v, dt);
  }

  private diffuse(b: number, x: Float32Array, x0: Float32Array, diff: number, dt: number) {
    const a = dt * diff * this.size * this.size;
    this.lin_solve(b, x, x0, a, 1 + 4 * a);
  }

  private lin_solve(b: number, x: Float32Array, x0: Float32Array, a: number, c: number) {
    const iter = 20;
    for (let k = 0; k < iter; k++) {
      for (let j = 1; j <= this.size; j++) {
        for (let i = 1; i <= this.size; i++) {
          x[this.getIndex(i, j)] =
            (x0[this.getIndex(i, j)] +
              a *
                (x[this.getIndex(i + 1, j)] +
                  x[this.getIndex(i - 1, j)] +
                  x[this.getIndex(i, j + 1)] +
                  x[this.getIndex(i, j - 1)])) /
            c;
        }
      }
      this.set_bnd(b, x);
    }
  }

  private project(u: Float32Array, v: Float32Array, p: Float32Array, div: Float32Array) {
    for (let j = 1; j <= this.size; j++) {
      for (let i = 1; i <= this.size; i++) {
        div[this.getIndex(i, j)] =
          (-0.5 *
            (u[this.getIndex(i + 1, j)] -
              u[this.getIndex(i - 1, j)] +
              v[this.getIndex(i, j + 1)] -
              v[this.getIndex(i, j - 1)])) /
          this.size;
        p[this.getIndex(i, j)] = 0;
      }
    }
    this.set_bnd(0, div);
    this.set_bnd(0, p);
    this.lin_solve(0, p, div, 1, 4);

    for (let j = 1; j <= this.size; j++) {
      for (let i = 1; i <= this.size; i++) {
        u[this.getIndex(i, j)] -= 0.5 * (p[this.getIndex(i + 1, j)] - p[this.getIndex(i - 1, j)]) * this.size;
        v[this.getIndex(i, j)] -= 0.5 * (p[this.getIndex(i, j + 1)] - p[this.getIndex(i, j - 1)]) * this.size;
      }
    }
    this.set_bnd(1, u);
    this.set_bnd(2, v);
  }

  private advect(b: number, d: Float32Array, d0: Float32Array, u: Float32Array, v: Float32Array, dt: number) {
    let i0, j0, i1, j1;
    let x, y, s0, t0, s1, t1, dt0;

    dt0 = dt * this.size;
    for (let j = 1; j <= this.size; j++) {
      for (let i = 1; i <= this.size; i++) {
        x = i - dt0 * u[this.getIndex(i, j)];
        y = j - dt0 * v[this.getIndex(i, j)];

        if (x < 0.5) x = 0.5;
        if (x > this.size + 0.5) x = this.size + 0.5;
        i0 = Math.floor(x);
        i1 = i0 + 1;

        if (y < 0.5) y = 0.5;
        if (y > this.size + 0.5) y = this.size + 0.5;
        j0 = Math.floor(y);
        j1 = j0 + 1;

        s1 = x - i0;
        s0 = 1 - s1;
        t1 = y - j0;
        t0 = 1 - t1;

        d[this.getIndex(i, j)] =
          s0 * (t0 * d0[this.getIndex(i0, j0)] + t1 * d0[this.getIndex(i0, j1)]) +
          s1 * (t0 * d0[this.getIndex(i1, j0)] + t1 * d0[this.getIndex(i1, j1)]);
      }
    }
    this.set_bnd(b, d);
  }

  private set_bnd(b: number, x: Float32Array) {
    for (let i = 1; i <= this.size; i++) {
      x[this.getIndex(0, i)] = b === 1 ? -x[this.getIndex(1, i)] : x[this.getIndex(1, i)];
      x[this.getIndex(this.size + 1, i)] = b === 1 ? -x[this.getIndex(this.size, i)] : x[this.getIndex(this.size, i)];
      x[this.getIndex(i, 0)] = b === 2 ? -x[this.getIndex(i, 1)] : x[this.getIndex(i, 1)];
      x[this.getIndex(i, this.size + 1)] = b === 2 ? -x[this.getIndex(i, this.size)] : x[this.getIndex(i, this.size)];
    }

    x[this.getIndex(0, 0)] = 0.5 * (x[this.getIndex(1, 0)] + x[this.getIndex(0, 1)]);
    x[this.getIndex(0, this.size + 1)] = 0.5 * (x[this.getIndex(1, this.size + 1)] + x[this.getIndex(0, this.size)]);
    x[this.getIndex(this.size + 1, 0)] = 0.5 * (x[this.getIndex(this.size, 0)] + x[this.getIndex(this.size + 1, 1)]);
    x[this.getIndex(this.size + 1, this.size + 1)] =
      0.5 * (x[this.getIndex(this.size, this.size + 1)] + x[this.getIndex(this.size + 1, this.size)]);
  }

  reset() {
    this.density.fill(0);
    this.u.fill(0);
    this.v.fill(0);
    this.u0.fill(0);
    this.v0.fill(0);
    this.s.fill(0);
  }
}
