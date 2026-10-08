import { describe, it, expect } from 'vitest';
import { createFlight, stepFlight } from './simulation';
describe('flight rules', () => {
 it('steers right and up with keyboard-equivalent input', () => { const s = createFlight(); s.phase = 'playing'; stepFlight(s, {x:1,y:1,boost:false},.05); expect(s.x).toBeGreaterThan(0); expect(s.y).toBeGreaterThan(0); });
 it('freezes distance and obstacles while paused', () => { const s = createFlight(); s.phase='paused'; const z=s.entities[0].z; stepFlight(s,{x:1,y:1,boost:true},.05); expect(s.distance).toBe(0); expect(s.entities[0].z).toBe(z); });
 it('boost increases speed and consumes charge', () => { const s=createFlight(); s.phase='playing'; stepFlight(s,{x:0,y:0,boost:true},.05); expect(s.speed).toBeGreaterThan(24); expect(s.energy).toBeLessThan(100); });
 it('collects a gate at the flight plane', () => { const s=createFlight(); s.phase='playing'; s.entities=[{x:0,y:0,z:-1.5,radius:2.5,kind:'ring',collected:false}]; stepFlight(s,{x:0,y:0,boost:false},.05); expect(s.rings).toBe(1); expect(s.score).toBeGreaterThanOrEqual(250); });
 it('damages hull on impact and ends the run on the final hit', () => { const s=createFlight(); s.phase='playing'; s.health=1; s.entities=[{x:0,y:0,z:-1.5,radius:1,kind:'rock',collected:false}]; stepFlight(s,{x:0,y:0,boost:false},.05); expect(s.health).toBe(0); expect(s.phase).toBe('over'); expect(s.flash).toBe(1); });
 it('restart resets all round state', () => { const s=createFlight(); s.phase='playing'; stepFlight(s,{x:1,y:0,boost:true},.05); const fresh=createFlight(); expect(fresh.distance).toBe(0); expect(fresh.health).toBe(3); expect(fresh.energy).toBe(100); expect(fresh.x).toBe(0); });
});
