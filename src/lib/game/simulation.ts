export type Phase = 'ready' | 'playing' | 'paused' | 'over';
export type Entity = { x: number; y: number; z: number; radius: number; kind: 'rock' | 'ring'; collected: boolean };
export type Flight = { phase: Phase; x: number; y: number; vx: number; vy: number; distance: number; score: number; health: number; energy: number; speed: number; time: number; invincible: number; flash: number; rings: number; boost: boolean; entities: Entity[]; notice: string };
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
export function createFlight(): Flight {
  return { phase: 'ready', x: 0, y: 0, vx: 0, vy: 0, distance: 0, score: 0, health: 3, energy: 100, speed: 24, time: 0, invincible: 0, flash: 0, rings: 0, boost: false, notice: '', entities: Array.from({ length: 28 }, (_, i) => ({ x: i === 0 ? 0 : Math.sin(i * 12.7) * 9, y: i === 0 ? 0 : Math.cos(i * 7.3) * 5, z: -32 - i * 13, radius: i % 4 === 0 ? 2.5 : 0.8 + (i % 3) * 0.45, kind: i % 4 === 0 ? 'ring' : 'rock', collected: false })) };
}
export function stepFlight(s: Flight, input: { x: number; y: number; boost: boolean }, rawDt: number) {
  if (s.phase !== 'playing') return;
  const dt = Math.min(rawDt, 0.05);
  s.time += dt;
  s.invincible = Math.max(0, s.invincible - dt);
  s.flash = Math.max(0, s.flash - dt * 2);
  s.boost = input.boost && s.energy > 1;
  s.energy = clamp(s.energy + (s.boost ? -24 : 13) * dt, 0, 100);
  const speedTarget = (s.boost ? 49 : 24) + Math.min(16, s.distance / 500);
  s.speed += (speedTarget - s.speed) * (1 - Math.exp(-3 * dt));
  const len = Math.max(1, Math.hypot(input.x, input.y));
  s.vx += (input.x / len * 14 - s.vx) * (1 - Math.exp(-5 * dt));
  s.vy += (input.y / len * 10 - s.vy) * (1 - Math.exp(-5 * dt));
  s.x = clamp(s.x + s.vx * dt, -10, 10);
  s.y = clamp(s.y + s.vy * dt, -5.8, 5.8);
  s.distance += s.speed * dt;
  s.score += s.speed * dt * (s.boost ? 1.5 : 1);
  for (const e of s.entities) {
    const previous = e.z;
    e.z += s.speed * dt;
    if (!e.collected && previous <= 1.3 && e.z >= -1.3) {
      const d = Math.hypot(s.x - e.x, s.y - e.y);
      if (e.kind === 'ring' && d < e.radius - 0.45) {
        e.collected = true; s.rings++; s.score += 250; s.energy = Math.min(100, s.energy + 20); s.notice = '+250 · GATE CLEARED';
      } else if (e.kind === 'rock' && d < e.radius + 0.6 && s.invincible === 0) {
        s.health--; s.invincible = 2; s.flash = 1; s.notice = 'HULL IMPACT'; e.collected = true;
        if (s.health <= 0) s.phase = 'over';
      }
    }
    if (e.z > 18) {
      e.z -= 364; e.x = Math.sin(s.time * 2.7 + s.entities.indexOf(e) * 3.3) * 8; e.y = Math.cos(s.time * 1.4 + s.entities.indexOf(e)) * 4.6; e.collected = false;
    }
  }
}
