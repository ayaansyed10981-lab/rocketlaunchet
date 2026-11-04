// Mission specifications turn a natural-language challenge description into
// concrete flight rules. Pure and client-safe: validation clamps every value so
// model output (or anything else) can never push the sim out of balance.
export type MissionSpec = {
  name: string;        // short mission title shown in HUD and start screen
  brief: string;       // one-line flavor text
  objective: string;   // what the player should do, shown in the HUD
  gateCount: number;   // how many collectible gates per circuit (5–20)
  gatePoints: number;  // points per cleared gate (100–500)
  gateRadius: number;  // gate size (1.6–3.2)
  rockDensity: number; // multiplier on the default asteroid count (0.4–2.5)
  rockPoints: number;  // points per destroyed asteroid (50–250)
  speed: number;       // multiplier on cruise/thrust speeds (0.8–1.5)
  hull: number;        // hull segments before the run ends (1–5)
};

export const DEFAULT_MISSION: MissionSpec = {
  name: 'ORION DRIFT',
  brief: 'The standard patrol: steady gates, honest asteroids.',
  objective: 'Fly through gates. Shoot or dodge asteroids.',
  gateCount: 7, gatePoints: 250, gateRadius: 2.5,
  rockDensity: 1, rockPoints: 100, speed: 1, hull: 3,
};

const clampNumber = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const clampText = (v: unknown, max: number, fallback: string): string => {
  if (typeof v !== 'string') return fallback;
  const t = v.trim().replace(/\s+/g, ' ');
  return t.length === 0 ? fallback : t.slice(0, max);
};

export function validateMission(raw: unknown): MissionSpec | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  return {
    name: clampText(r['name'], 28, 'CUSTOM MISSION'),
    brief: clampText(r['brief'], 120, 'A hand-tuned corner of the drift.'),
    objective: clampText(r['objective'], 100, DEFAULT_MISSION.objective),
    gateCount: Math.round(clampNumber(r['gateCount'], 5, 20, DEFAULT_MISSION.gateCount)),
    gatePoints: Math.round(clampNumber(r['gatePoints'], 100, 500, DEFAULT_MISSION.gatePoints)),
    gateRadius: clampNumber(r['gateRadius'], 1.6, 3.2, DEFAULT_MISSION.gateRadius),
    rockDensity: clampNumber(r['rockDensity'], 0.4, 2.5, DEFAULT_MISSION.rockDensity),
    rockPoints: Math.round(clampNumber(r['rockPoints'], 50, 250, DEFAULT_MISSION.rockPoints)),
    speed: clampNumber(r['speed'], 0.8, 1.5, DEFAULT_MISSION.speed),
    hull: Math.round(clampNumber(r['hull'], 1, 5, DEFAULT_MISSION.hull)),
  };
}

export const isStandardMission = (m: MissionSpec): boolean => m === DEFAULT_MISSION;
