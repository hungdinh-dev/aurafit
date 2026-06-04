import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function SpinningBox() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh
      ref={meshRef}
      scale={active ? 1.5 : 1}
      onClick={() => setActive(!active)}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial 
        color={hovered ? '#ec4899' : '#6366f1'} 
        roughness={0.2} 
        metalness={0.8} 
      />
    </mesh>
  );
}

export default function App() {
  return (
    <div className="relative w-full h-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      {/* 3D Canvas */}
      <div className="absolute inset-0 w-full h-full">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <directionalLight position={[-5, 5, -5]} intensity={0.8} />
          <SpinningBox />
          <OrbitControls enableZoom={true} />
        </Canvas>
      </div>

      {/* Tailwind Overlay UI */}
      <div className="pointer-events-none absolute top-8 left-8 right-8 flex justify-between items-start z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-wider text-indigo-400 uppercase">AuraFit 3D Engine</h1>
          <p className="text-[10px] text-emerald-400 mt-1 font-mono uppercase tracking-widest">● WebGL Renderer Status: Active</p>
        </div>
        <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-300 shadow-lg select-none">
          Click cube to resize • Drag to rotate
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 left-8 right-8 flex justify-between items-end z-10">
        <span className="text-[10px] text-slate-600 font-mono">AURAFIT v1.0.0-ALPHA</span>
        <span className="text-[10px] text-slate-600 font-mono">React Three Fiber • Tailwind CSS</span>
      </div>
    </div>
  );
}
