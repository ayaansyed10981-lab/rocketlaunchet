import { useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as T from 'three';
import { Rocket } from './Rocket';
import type { Palette } from '@/lib/game/palette';
import { stepFlight, type Flight } from '@/lib/game/simulation';
export type FlightInput = { x: number; y: number; boost: boolean; keys: Set<string>; pointer: boolean; aim: {x:number;y:number}|null; fire: boolean; fireQueued: boolean };
export function SpaceScene({flight,input,palette:p,onTick}: { flight: MutableRefObject<Flight>; input: MutableRefObject<FlightInput>; palette: Palette; onTick: () => void }) {
 const ship = useRef<T.Group>(null); const rocks = useRef<T.InstancedMesh>(null); const ringRefs = useRef<(T.Mesh|null)[]>([]); const stars = useRef<T.Points>(null); const timer=useRef(0);
 const shotMesh=useRef<T.InstancedMesh>(null); const burstMesh=useRef<T.InstancedMesh>(null);
 const dummy=useMemo(()=>new T.Object3D(),[]); const target=useMemo(()=>new T.Vector3(),[]);
 const rockGeo=useMemo(()=>{const g=new T.IcosahedronGeometry(1,2);const a=g.getAttribute('position');for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i);const n=1+.18*Math.sin(x*16+y*13+z*19);a.setXYZ(i,x*n,y*n,z*n);}g.computeVertexNormals();return g;},[]);
 const starPositions=useMemo(()=>{const a=new Float32Array(1500*3);for(let i=0;i<1500;i++){a[i*3]=Math.sin(i*127.1)*100;a[i*3+1]=Math.sin(i*311.7)*65;a[i*3+2]=-5-(i/1500)*240;}return a;},[]);
 const texture=useMemo(()=>{const a=new Uint8Array(128*64*4);for(let y=0;y<64;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;const n=100+Math.sin(y*.5+Math.sin(x*.08)*2)*28+Math.sin(x*2+y*7)*8;a[i]=n;a[i+1]=n;a[i+2]=n;a[i+3]=255;}const t=new T.DataTexture(a,128,64);t.needsUpdate=true;return t;},[]);
 useFrame(({camera,clock,size},raw)=>{
  const dt=Math.min(raw,.05),s=flight.current,k=input.current.keys;
  const dx=(k.has('KeyD')||k.has('ArrowRight')?1:0)-(k.has('KeyA')||k.has('ArrowLeft')?1:0);
  const throttle=(k.has('KeyW')||k.has('ArrowUp')?1:0)-(k.has('KeyS')||k.has('ArrowDown')?1:0);
  const inp=input.current;
  stepFlight(s,{x:dx||(inp.aim?0:inp.x),y:inp.aim?0:inp.y,throttle,aim:inp.aim,boost:inp.boost||k.has('Space'),fire:inp.fire||inp.fireQueued},dt);
  inp.fireQueued=false;
  if(shotMesh.current){for(let i=0;i<24;i++){const sh=s.shots[i];if(sh){dummy.position.set(sh.x,sh.y,sh.z);dummy.rotation.set(Math.PI/2,0,0);dummy.scale.setScalar(1);}else dummy.scale.setScalar(0);dummy.updateMatrix();shotMesh.current.setMatrixAt(i,dummy.matrix);}shotMesh.current.instanceMatrix.needsUpdate=true;}
  if(burstMesh.current){for(let i=0;i<12;i++){const b=s.bursts[i];if(b){dummy.position.set(b.x,b.y,b.z);dummy.rotation.set(0,0,0);dummy.scale.setScalar(b.size*(.6+b.t*3.2));}else dummy.scale.setScalar(0);dummy.updateMatrix();burstMesh.current.setMatrixAt(i,dummy.matrix);}burstMesh.current.instanceMatrix.needsUpdate=true;const m=burstMesh.current.material as T.MeshBasicMaterial;const oldest=s.bursts[0];m.opacity=oldest?Math.max(0,.9-oldest.t*1.3):0;}
  if(ship.current){
   if(s.phase==='ready'){const mobile=size.width<700;const narrow=size.width/size.height<1;ship.current.position.set(mobile?1:narrow?2.6:4,(mobile?6.1:0)+Math.sin(clock.elapsedTime*.6)*.2,0);ship.current.rotation.set(.15,-.4,-.55);ship.current.scale.setScalar(mobile?.42:narrow?.88:1.32);target.set(0,1,17);}
   else {ship.current.position.set(s.x,s.y,0);ship.current.rotation.set(-Math.PI/2+s.vy*.015,-s.vx*.015,-s.vx*.035);ship.current.scale.setScalar(.55);target.set(s.x*.28,s.y*.25+6,13);}
   ship.current.visible=s.invincible===0||Math.floor(s.time*12)%2===0;
   camera.position.lerp(target,1-Math.exp(-3*dt));
   camera.lookAt((s.phase==='ready'?0:s.x*.15)+Math.sin(s.time*77)*s.flash*.16,(s.phase==='ready'?0:s.y*.15)+Math.cos(s.time*63)*s.flash*.12,-7);
   if(camera instanceof T.PerspectiveCamera){camera.fov+=((s.boost?66:52)-camera.fov)*(1-Math.exp(-2*dt));camera.updateProjectionMatrix();}
  }
  let rockIndex=0;
  s.entities.forEach((e,i)=>{
   if(e.kind==='rock' && rocks.current){dummy.position.set(e.x,e.y,e.z);dummy.rotation.set(i+s.time*.1,i*.7+s.time*.14,i*.5);dummy.scale.setScalar(e.collected?0:e.radius);dummy.updateMatrix();rocks.current.setMatrixAt(rockIndex++,dummy.matrix);}
   else if(ringRefs.current[i]){const m=ringRefs.current[i];if(m){m.position.set(e.x,e.y,e.z);m.visible=!e.collected&&s.phase!=='ready';}}
  });
  if(rocks.current){rocks.current.instanceMatrix.needsUpdate=true;rocks.current.visible=s.phase!=='ready';}
  if(stars.current && s.phase==='playing') { stars.current.position.z=(s.distance*.35)%30; }
  timer.current+=dt;if(timer.current>.1){timer.current=0;onTick();}
 });
 return <>
  <ambientLight intensity={.65}/><directionalLight position={[-6,8,10]} intensity={3.5} color={p.light}/><directionalLight position={[8,3,-6]} intensity={3} color={p.cyan}/>
  <Environment resolution={64}><Lightformer intensity={3} position={[0,5,5]} scale={[10,8,1]}/><Lightformer intensity={2} color={p.cyan} position={[-5,0,0]} rotation-y={Math.PI/2} scale={[8,8,1]}/></Environment>
  <points ref={stars}><bufferGeometry><bufferAttribute attach="attributes-position" args={[starPositions,3]}/></bufferGeometry><pointsMaterial color={p.light} size={.11} transparent opacity={.7} sizeAttenuation depthWrite={false}/></points>
  <group position={[23,14,-70]} rotation={[.3,0,.25]}>
   <mesh><sphereGeometry args={[13,64,48]}/><meshStandardMaterial color={p.planet} map={texture} roughness={.9} metalness={.05}/></mesh>
   <mesh rotation-x={1.2}><ringGeometry args={[16,24,100]}/><meshStandardMaterial color={p.ivory} side={T.DoubleSide} transparent opacity={.28} roughness={.9}/></mesh>
  </group>
  <group ref={ship}><Rocket palette={p} boost={flight.current.boost}/></group>
  <instancedMesh ref={rocks} args={[rockGeo,undefined,64]} frustumCulled={false}><meshStandardMaterial color={p.rock} roughness={.95} metalness={.15} map={texture}/></instancedMesh>
  <instancedMesh ref={shotMesh} args={[undefined,undefined,24]} frustumCulled={false}><capsuleGeometry args={[.09,1.4,4,8]}/><meshBasicMaterial color={p.gold} toneMapped={false}/></instancedMesh>
  <instancedMesh ref={burstMesh} args={[undefined,undefined,12]} frustumCulled={false}><icosahedronGeometry args={[1,1]}/><meshBasicMaterial color={p.gold} transparent opacity={.8} depthWrite={false} blending={T.AdditiveBlending} toneMapped={false}/></instancedMesh>
  {flight.current.entities.map((e,i)=>e.kind==='ring'?<mesh key={i} ref={m=>{ringRefs.current[i]=m;}} position={[e.x,e.y,e.z]}><torusGeometry args={[e.radius,.08,8,48]}/><meshStandardMaterial color={p.cyan} emissive={p.cyan} emissiveIntensity={.7} roughness={.2}/></mesh>:null)}
 </>;
}
