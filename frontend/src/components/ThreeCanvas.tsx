"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import Image from "next/image";

export default function ThreeCanvas() {
  const { mouthOpenness, isMicActive, isLiveConnected, isLiveConnecting } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let active = true;
    setTimeout(() => {
      if (active) setMounted(true);
    }, 0);
    return () => {
      active = false;
    };
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-full min-h-[360px] w-full items-center justify-center rounded-3xl bg-neutral-900/50 backdrop-blur-2xl border border-neutral-800/80 shadow-2xl">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          <span className="text-sm font-medium text-neutral-400">Connecting companion...</span>
        </div>
      </div>
    );
  }

  // Determine active speech text status
  let statusText = "Ready to talk";
  let statusColor = "text-neutral-400";
  let pulseColor = "bg-neutral-500";

  if (isLiveConnecting) {
    statusText = "Warmly connecting...";
    statusColor = "text-indigo-400";
    pulseColor = "bg-indigo-400";
  } else if (mouthOpenness > 0.15) {
    statusText = "Speaking...";
    statusColor = "text-pink-400";
    pulseColor = "bg-pink-400";
  } else if (isMicActive) {
    statusText = "Listening to you...";
    statusColor = "text-cyan-400";
    pulseColor = "bg-cyan-400";
  } else if (isLiveConnected) {
    statusText = "Companion Online";
    statusColor = "text-emerald-400";
    pulseColor = "bg-emerald-400";
  }

  // Calculate dynamic scale for lip-sync concentric rings
  const haloScale1 = 1 + mouthOpenness * 0.45;
  const haloScale2 = 1 + mouthOpenness * 0.9;
  const haloOpacity1 = Math.min(0.2 + mouthOpenness * 0.4, 0.6);
  const haloOpacity2 = Math.min(0.1 + mouthOpenness * 0.3, 0.4);

  return (
    <div
      id="three-canvas-container"
      role="region"
      aria-label="3D Mental Wellness Twin Companion"
      className="relative flex h-[350px] w-full flex-col items-center justify-center rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900/40 backdrop-blur-2xl shadow-[0_24px_50px_-12px_rgba(99,102,241,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 transition-all duration-300"
      tabIndex={0}
    >
      {/* Curved background pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-purple-500/5 pointer-events-none" />

      {/* Decorative concentric background circle grids */}
      <div className="absolute h-96 w-96 rounded-full border border-indigo-500/5 pointer-events-none" />
      <div className="absolute h-[28rem] w-[28rem] rounded-full border border-purple-500/5 pointer-events-none" />

      {/* Glowing soundwave halos (lip sync animation) */}
      <div
        className="absolute rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 blur-[20px] pointer-events-none transition-transform duration-75 ease-out"
        style={{
          width: "200px",
          height: "200px",
          transform: `scale(${haloScale2})`,
          opacity: haloOpacity2,
        }}
      />
      <div
        className="absolute rounded-full bg-gradient-to-tr from-pink-500 to-indigo-400 blur-[12px] pointer-events-none transition-transform duration-75 ease-out"
        style={{
          width: "180px",
          height: "180px",
          transform: `scale(${haloScale1})`,
          opacity: haloOpacity1,
        }}
      />

      {/* Primary glassy circle container for avatar */}
      <div className="relative z-10 flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-tr from-neutral-800 to-neutral-950 p-1 shadow-[0_12px_32px_-4px_rgba(99,102,241,0.3)] border border-neutral-700/80">
        <div className="relative h-full w-full overflow-hidden rounded-full bg-neutral-900">
          <Image
            src="/women_wellness_coach.png"
            alt="Friendly Student Wellness Representative avatar"
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            priority
          />
        </div>

        {/* Small floating pulse dot representing status */}
        <div className="absolute bottom-1 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 border border-neutral-700 shadow-lg shadow-black/40">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${pulseColor}`} />
          </span>
        </div>
      </div>

      {/* Supportive Companion status label */}
      <div className="relative z-10 mt-5 text-center">
        <h3 className="text-base font-extrabold text-neutral-100 tracking-tight">Your Personal Twin</h3>
        <p className={`mt-1 text-xs font-bold tracking-widest ${statusColor} uppercase flex items-center justify-center gap-1.5`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
          <span>{statusText}</span>
        </p>
      </div>

      {/* Warm tagline indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none w-[90%]">
        <p className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase">
          &quot;We are in this journey together&quot;
        </p>
      </div>
    </div>
  );
}
