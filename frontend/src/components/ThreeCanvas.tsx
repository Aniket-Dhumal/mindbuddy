"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useApp } from "../context/AppContext";

// Floating holographic head component
function HologramHead() {
  const { mouthOpenness } = useApp();
  const groupRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const elapsedTime = state.clock.getElapsedTime();

    // 1. Gentle floating animation (bobbing up and down)
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(elapsedTime * 1.5) * 0.12;
      groupRef.current.rotation.y = Math.sin(elapsedTime * 0.5) * 0.15;
    }

    // 2. Smoothly animate mouth scaling based on Web Audio / Simulated decibels
    if (mouthRef.current) {
      // Lerp for organic, high-performance mouth response
      const targetScaleY = mouthOpenness * 12.0 + 0.15; // Map 0.1 -> 0.15, 1.0 -> 1.35
      mouthRef.current.scale.y = THREE.MathUtils.lerp(
        mouthRef.current.scale.y,
        targetScaleY,
        0.25
      );
      // Slightly scale X-axis as well to make it look like opening wide
      mouthRef.current.scale.x = THREE.MathUtils.lerp(
        mouthRef.current.scale.x,
        mouthOpenness * 1.5 + 1.0,
        0.25
      );
    }

    // 3. Eye blinking/pulsing animation
    if (leftEyeRef.current && rightEyeRef.current) {
      const pulse = Math.sin(elapsedTime * 5.0) * 0.1 + 0.9;
      // Periodically "blink" by dropping scale.y to 0.1 for a split second
      const isBlinking = Math.floor(elapsedTime % 6) === 0 && (elapsedTime % 6) % 1 < 0.15;
      const targetEyeScaleY = isBlinking ? 0.05 : pulse;
      
      leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, targetEyeScaleY, 0.3);
      rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, targetEyeScaleY, 0.3);
    }

    // 4. Spin the outer holographic ring
    if (ringRef.current) {
      ringRef.current.rotation.z = elapsedTime * 0.6;
      ringRef.current.rotation.x = Math.sin(elapsedTime * 0.3) * 0.2 + (Math.PI / 2.5);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outer Hologram wireframe skull to give cyberpunk scanned look */}
      <mesh>
        <sphereGeometry args={[1.2, 24, 24]} />
        <meshBasicMaterial
          color="#06b6d4" // Cyan-500
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Inner Distorted liquid-glass core representing floating thoughts/neural activity */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.95, 32, 32]} />
        <MeshDistortMaterial
          color="#ec4899" // Pink-500
          roughness={0.1}
          metalness={0.9}
          distort={0.3}
          speed={2}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Floating Holographic Ring (Orbit Saturn Ring) */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
        <torusGeometry args={[1.8, 0.04, 8, 64]} />
        <meshBasicMaterial
          color="#a855f7" // Purple-500
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Holographic glowing eyes */}
      {/* Left Eye */}
      <mesh ref={leftEyeRef} position={[-0.35, 0.2, 0.85]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color="#22d3ee" /> {/* Bright cyan */}
      </mesh>
      {/* Right Eye */}
      <mesh ref={rightEyeRef} position={[0.35, 0.2, 0.85]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>

      {/* Interactive Lip-Synced Mouth Bar */}
      <mesh ref={mouthRef} position={[0, -0.35, 0.85]} scale={[1, 0.15, 1]}>
        <boxGeometry args={[0.45, 0.1, 0.1]} />
        <meshBasicMaterial
          color="#f43f5e" // Rose-500 glowing mouth
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Scanning collar / neck ring base */}
      <mesh position={[0, -1.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.03, 8, 32]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// Sparkle/Holographic particle nodes
function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      pointsRef.current.rotation.x = state.clock.getElapsedTime() * 0.02;
    }
  });

  const count = 120;
  const positions = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6; // X
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6; // Y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6; // Z
    }
    return pos;
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#22d3ee"
        size={0.035}
        transparent
        opacity={0.65}
        sizeAttenuation
      />
    </points>
  );
}

export default function ThreeCanvas() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-950 text-neutral-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <span className="text-sm font-medium tracking-wide">Initializing Hologram...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Interactive 3D Holographic AI Twin Avatar Viewport"
      className="relative h-full w-full rounded-2xl overflow-hidden border border-neutral-800/80 bg-neutral-950/60 backdrop-blur-md shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)]"
    >
      {/* Glow gradient effects behind Canvas */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-44 w-44 rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-36 w-36 rounded-full bg-pink-500/10 blur-[70px] pointer-events-none" />

      {/* Real-time speech status pill */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 rounded-full border border-cyan-500/30 bg-neutral-900/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-400 backdrop-blur-md shadow-lg">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <span>HOLO-TWIN V1.0</span>
      </div>

      <Canvas camera={{ position: [0, 0, 3.8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#06b6d4" />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#ec4899" />
        <directionalLight position={[0, 5, 0]} intensity={1.0} color="#a855f7" />
        
        <HologramHead />
        <ParticleField />
        
        <OrbitControls
          enableZoom={true}
          maxDistance={6.0}
          minDistance={2.0}
          enablePan={false}
          autoRotate={false}
        />
      </Canvas>

      {/* Floating interactive hint overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <p className="text-[10px] text-neutral-400/80 uppercase tracking-widest bg-neutral-950/80 px-4 py-1.5 rounded-full border border-neutral-800/60 backdrop-blur-sm">
          Drag to rotate • Scroll to zoom
        </p>
      </div>
    </div>
  );
}
