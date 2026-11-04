import { describe, it, expect } from 'vitest';
import { DEFAULT_MISSION, validateMission } from './mission';

describe('mission spec validation', () => {
  it('clamps wildly out-of-range model output into safe ranges', () => {
    const m = validateMission({ name: 'x'.repeat(80), brief: 'ok', objective: 'fly', gateCount: 999, gatePoints: -50, gateRadius: 99, rockDensity: 12, rockPoints: 1, speed: 9, hull: 100 });
    expect(m).not.toBeNull();
    expect(m!.gateCount).toBe(20);
    expect(m!.gatePoints).toBe(100);
    expect(m!.gateRadius).toBe(3.2);
    expect(m!.rockDensity).toBe(2.5);
    expect(m!.rockPoints).toBe(50);
    expect(m!.speed).toBe(1.5);
    expect(m!.hull).toBe(5);
    expect(m!.name.length).toBeLessThanOrEqual(28);
  });

  it('falls back to defaults for garbage input instead of throwing', () => {
    expect(validateMission(null)).toBeNull();
    expect(validateMission('mission')).toBeNull();
    expect(validateMission({ speed: 'fast', hull: 'five', name: 42 })).toEqual(expect.objectContaining({ speed: 1, hull: 3, name: 'CUSTOM MISSION' }));
  });

  it('keeps a well-formed mission untouched and never mutates the default', () => {
    const m = validateMission({ ...DEFAULT_MISSION, gateCount: 12, rockDensity: 1.6 });
    expect(m).toEqual(expect.objectContaining({ gateCount: 12, rockDensity: 1.6, hull: 3 }));
  });
});
