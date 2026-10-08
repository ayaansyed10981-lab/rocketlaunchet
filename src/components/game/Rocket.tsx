import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as T from 'three';
import type { Palette } from '@/lib/game/palette';

export function Rocket({ palette: p, boost = false }: { palette: Palette; boost?: boolean }) {
 const exhaust = useRef<T.Group>(null);
 const geometry = useMemo(() => {
  const profile = [[0,-2.2],[.62,-2.1],[.91,-1.7],[1.12,-.9],[1.17,0],[1.08,.9],[.85,1.6],[.72,1.9]].map(([x,y])=>new T.Vector2(x,y));
  const nose = [[.72,1.9],[.59,2.25],[.43,2.58],[.25,2.92],[.08,3.2],[0,3.28]].map(([x,y])=>new T.Vector2(x,y));
  const shape = new T.Shape(); shape.moveTo(.65,-.6); shape.bezierCurveTo(1.2,-.7,1.8,-1.45,1.95,-2.4); shape.bezierCurveTo(1.92,-2.6,1.1,-2.18,.7,-2.05); shape.lineTo(.65,-.6);
  const fin = new T.ExtrudeGeometry(shape,{depth:.14,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.12,bevelThickness:.1,curveSegments:18});
  return { body:new T.LatheGeometry(profile,64),nose:new T.LatheGeometry(nose,64),fin };
 },[]);
 useFrame(({clock},dt)=>{if(exhaust.current){exhaust.current.scale.y += ((boost?1.9:1) + Math.sin(clock.elapsedTime*31)*.12-exhaust.current.scale.y)*(1-Math.exp(-18*Math.min(dt,.05)));}});
 return <group>
  <mesh geometry={geometry.body}><meshPhysicalMaterial color={p.ivory} metalness={.28} roughness={.3} clearcoat={.8}/></mesh>
  <mesh geometry={geometry.nose}><meshPhysicalMaterial color={p.red} metalness={.25} roughness={.22} clearcoat={1}/></mesh>
  {[0,Math.PI,-Math.PI/2].map((a,i)=><mesh key={i} geometry={geometry.fin} rotation-y={a}><meshPhysicalMaterial color={p.red} metalness={.3} roughness={.25} clearcoat={1}/></mesh>)}
  <group position={[0,.55,1.045]} rotation-x={-.11}>
   <mesh><torusGeometry args={[.59,.13,16,64]}/><meshStandardMaterial color={p.metal} metalness={.85} roughness={.25}/></mesh>
   <mesh position-z={.09} scale={[.51,.51,.2]}><sphereGeometry args={[1,48,32]}/><meshPhysicalMaterial color={p.glass} emissive={p.glass} emissiveIntensity={.22} metalness={.4} roughness={.08} clearcoat={1}/></mesh>
   <mesh position-z={.1}><torusGeometry args={[.51,.025,8,64]}/><meshStandardMaterial color={p.ivory} metalness={.8} roughness={.18}/></mesh>
   {Array.from({length:8},(_,i)=><mesh key={i} position={[Math.sin(i*Math.PI/4)*.59,Math.cos(i*Math.PI/4)*.59,.12]}><sphereGeometry args={[.035,8,6]}/><meshStandardMaterial color={p.ivory} metalness={.9} roughness={.3}/></mesh>)}
  </group>
  <mesh position-y={-2.12}><cylinderGeometry args={[.64,.52,.45,48]}/><meshStandardMaterial color={p.metal} metalness={.9} roughness={.3}/></mesh>
  <mesh position-y={-2.32} rotation-x={Math.PI/2}><torusGeometry args={[.46,.075,12,48]}/><meshStandardMaterial color={p.metal} metalness={.8} roughness={.2}/></mesh>
  <group ref={exhaust} position-y={-2.36}>
   <mesh position-y={-.92} rotation-z={Math.PI}><coneGeometry args={[.42,1.85,32]}/><meshBasicMaterial color={p.gold} transparent opacity={.75}/></mesh>
   <mesh position-y={-.65} rotation-z={Math.PI}><coneGeometry args={[.28,1.4,32]}/><meshBasicMaterial color={p.light}/></mesh>
   <mesh position-y={-1.5} rotation-z={Math.PI}><coneGeometry args={[.23,2.9,24]}/><meshBasicMaterial color={p.red} transparent opacity={.23} depthWrite={false}/></mesh>
   <pointLight color={p.gold} intensity={boost?12:5} distance={8}/>
  </group>
 </group>;
}
