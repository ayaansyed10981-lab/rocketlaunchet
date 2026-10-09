export type Phase = 'ready' | 'playing' | 'paused' | 'over';
export type Entity = { x: number; y: number; z: number; radius: number; kind: 'rock' | 'ring'; collected: boolean };
export type Shot = { x: number; y: number; z: number; life: number };
export type Burst = { x: number; y: number; z: number; t: number; size: number };
export type Flight = { phase: Phase; x: number; y: number; vx: number; vy: number; distance: number; score: number; health: number; energy: number; speed: number; time: number; invincible: number; flash: number; rings: number; hits: number; boost: boolean; entities: Entity[]; shots: Shot[]; bursts: Burst[]; cooldown: number; notice: string };
export type StepInput = { x: number; y: number; boost: boolean; throttle?: number; aim?: { x: number; y: number } | null; fire?: boolean };
export const BOUNDS = { x: 10, y: 5.8 };
export const SHOT_SPEED = 110, FIRE_COOLDOWN = 0.16, ROCK_POINTS = 100;
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
export function createFlight(): Flight {
  return { phase: 'ready', x: 0, y: 0, vx: 0, vy: 0, distance: 0, score: 0, health: 3, energy: 100, speed: 24, time: 0, invincible: 0, flash: 0, rings: 0, hits: 0, boost: false, notice: '', shots: [], bursts: [], cooldown: 0, entities: Array.from({ length: 28 }, (_, i) => ({ x: i === 0 ? 0 : Math.sin(i * 12.7) * 9, y: i === 0 ? 0 : Math.cos(i * 7.3) * 5, z: -32 - i * 13, radius: i % 4 === 0 ? 2.5 : 0.8 + (i % 3) * 0.45, kind: i % 4 === 0 ? 'ring' : 'rock', collected: false })) };
}
export function stepFlight(s: Flight, input: StepInput, rawDt: number) {
  if (s.phase !== 'playing') return;
  const dt = Math.min(rawDt, 0.05);
  s.time += dt;
  s.invincible = Math.max(0, s.invincible - dt);
  s.flash = Math.max(0, s.flash - dt * 2);
  s.cooldown = Math.max(0, s.cooldown - dt);
  s.boost = input.boost && s.energy > 1;
  s.energy = clamp(s.energy + (s.boost ? -24 : 13) * dt, 0, 100);
  const throttle = clamp(input.throttle ?? 0, -1, 1);
  const speedTarget = Math.max(10, (s.boost ? 49 : 24) + Math.min(16, s.distance / 500) + throttle * (throttle > 0 ? 10 : 12));
  s.speed += (speedTarget - s.speed) * (1 - Math.exp(-3 * dt));
  let tx: number, ty: number;
  if (input.aim) {
    // Pointer aim: steer toward the pointed position, with keyboard horizontal input overriding.
    tx = input.x ? input.x * 14 : clamp((input.aim.x * BOUNDS.x - s.x) * 4, -14, 14);
    ty = clamp((input.aim.y * BOUNDS.y - s.y) * 4, -10, 10);
  } else {
    const len = Math.max(1, Math.hypot(input.x, input.y));
    tx = input.x / len * 14; ty = input.y / len * 10;
  }
  s.vx += (tx - s.vx) * (1 - Math.exp(-5 * dt));
  s.vy += (ty - s.vy) * (1 - Math.exp(-5 * dt));
  s.x = clamp(s.x + s.vx * dt, -BOUNDS.x, BOUNDS.x);
  s.y = clamp(s.y + s.vy * dt, -BOUNDS.y, BOUNDS.y);
  s.distance += s.speed * dt;
  s.score += s.speed * dt * (s.boost ? 1.5 : 1);
  if (input.fire && s.cooldown === 0 && s.shots.length < 24) {
    s.shots.push({ x: s.x, y: s.y, z: -1.5, life: 1.3 }); s.cooldown = FIRE_COOLDOWN;
  }
  for (const b of s.bursts) { b.t += dt; b.z += s.speed * dt; }
  s.bursts = s.bursts.filter(b => b.t < 0.7);
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
  for (const shot of s.shots) {
    const from = shot.z; shot.z -= SHOT_SPEED * dt; shot.life -= dt;
    for (const e of s.entities) {
      if (e.kind !== 'rock' || e.collected) continue;
      const reach = e.radius + 0.4;
      if (e.z + reach >= shot.z && e.z - reach <= from && Math.hypot(shot.x - e.x, shot.y - e.y) < reach) {
        e.collected = true; shot.life = 0; s.hits++; s.score += ROCK_POINTS; s.notice = `+${ROCK_POINTS} · ASTEROID DESTROYED`;
        s.bursts.push({ x: e.x, y: e.y, z: e.z, t: 0, size: e.radius });
        break;
      }
    }
  }
  s.shots = s.shots.filter(sh => sh.life > 0);
}
