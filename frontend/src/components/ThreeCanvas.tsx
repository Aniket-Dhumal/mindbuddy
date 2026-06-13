"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import Image from "next/image";

export default function ThreeCanvas() {
  const { mouthOpenness, isMicActive, isLiveConnected, isLiveConnecting } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-3xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#9F9FFF] border-t-transparent" />
          <span className="text-sm font-medium text-slate-500">Connecting companion...</span>
        </div>
      </div>
    );
  }

  // Determine active speech text status
  let statusText = "Ready to talk";
  let statusColor = "text-[#6B7280]";
  let pulseColor = "bg-[#9CA3AF]";

  if (isLiveConnecting) {
    statusText = "Warmly connecting...";
    statusColor = "text-[#6366F1]";
    pulseColor = "bg-[#6366F1]";
  } else if (mouthOpenness > 0.15) {
    statusText = "Speaking...";
    statusColor = "text-[#EC4899]";
    pulseColor = "bg-[#EC4899]";
  } else if (isMicActive) {
    statusText = "Listening to you...";
    statusColor = "text-[#3B82F6]";
    pulseColor = "bg-[#3B82F6]";
  } else if (isLiveConnected) {
    statusText = "Companion Online";
    statusColor = "text-[#10B981]";
    pulseColor = "bg-[#10B981]";
  }

  // Calculate dynamic scale for lip-sync concentric rings
  const haloScale1 = 1 + mouthOpenness * 0.4;
  const haloScale2 = 1 + mouthOpenness * 0.8;
  const haloOpacity1 = Math.min(0.15 + mouthOpenness * 0.35, 0.5);
  const haloOpacity2 = Math.min(0.08 + mouthOpenness * 0.25, 0.3);

  return (
    <div
      id="three-canvas-container"
      role="region"
      aria-label="Student Wellness Companion Portal"
      className="relative flex h-[360px] w-full flex-col items-center justify-center rounded-3xl overflow-hidden border border-white/80 bg-white/50 backdrop-blur-xl shadow-[0_24px_50px_-12px_rgba(159,159,255,0.18)] focus:outline-none focus:ring-2 focus:ring-[#9F9FFF] focus:ring-offset-2 focus:ring-offset-slate-50 transition-all duration-300"
      tabIndex={0}
    >
      {/* Curved background pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#EEF2FF]/40 to-[#F5F3FF]/40 pointer-events-none" />

      {/* Decorative concentric background circle grids */}
      <div className="absolute h-96 w-96 rounded-full border border-[#9F9FFF]/10 pointer-events-none" />
      <div className="absolute h-[28rem] w-[28rem] rounded-full border border-[#9F9FFF]/5 pointer-events-none" />

      {/* Glowing soundwave halos (lip sync animation) */}
      <div
        className="absolute rounded-full bg-gradient-to-tr from-[#9F9FFF] to-[#E8A5FF] blur-[15px] pointer-events-none transition-transform duration-75 ease-out"
        style={{
          width: "200px",
          height: "200px",
          transform: `scale(${haloScale2})`,
          opacity: haloOpacity2,
        }}
      />
      <div
        className="absolute rounded-full bg-gradient-to-tr from-[#E8A5FF] to-[#FFADC6] blur-[8px] pointer-events-none transition-transform duration-75 ease-out"
        style={{
          width: "180px",
          height: "180px",
          transform: `scale(${haloScale1})`,
          opacity: haloOpacity1,
        }}
      />

      {/* Primary glassy circle container for avatar */}
      <div className="relative z-10 flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-tr from-white to-[#EEF2FF] p-1.5 shadow-[0_12px_32px_-4px_rgba(159,159,255,0.25)] border border-white">
        <div className="relative h-full w-full overflow-hidden rounded-full bg-[#E5E9FF]">
          <Image
            src="/women_wellness_coach.png"
            alt="Friendly Student Wellness Representative avatar"
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            priority
          />
        </div>

        {/* Small floating pulse dot representing status */}
        <div className="absolute bottom-1 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md border border-slate-100">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${pulseColor}`} />
          </span>
        </div>
      </div>

      {/* Supportive Companion status label */}
      <div className="relative z-10 mt-5 text-center">
        <h3 className="text-base font-bold text-slate-800 tracking-tight">Your Personal Companion</h3>
        <p className={`mt-0.5 text-xs font-semibold tracking-wide ${statusColor} uppercase flex items-center justify-center gap-1.5`}>
          <span>{statusText}</span>
        </p>
      </div>

      {/* Warm tagline indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none w-[90%]">
        <p className="text-[10px] text-slate-400 font-medium tracking-wide">
          "We are in this journey together" • Click microphone below to chat anytime
        </p>
      </div>
    </div>
  );
}
