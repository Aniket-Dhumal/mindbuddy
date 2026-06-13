"use client";

import React from "react";
import { useApp } from "../context/AppContext";
import ThreeCanvas from "../components/ThreeCanvas";
import JournalSection from "../components/JournalSection";
import AudioAnalyzer from "../components/AudioAnalyzer";
import { Sparkles, MessageSquare, Shield, Activity } from "lucide-react";

export default function Home() {
  const { state, isLiveConnected, isLiveConnecting, liveLogs, triggerMockLiveResponse, screenReaderMessage } = useApp();

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-100 selection:bg-cyan-500/30">
      {/* Dynamic Screen Reader Live Announcer (NFR-1.2) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {screenReaderMessage}
      </div>

      {/* Header Banner */}
      <header className="border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-500 text-neutral-950 font-black shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              MB
            </div>
            <div>
              <h1 className="text-base font-bold tracking-wider uppercase text-neutral-100">MindBuddy</h1>
              <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-widest">
                Student Mental Wellness Twin Portal
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1.5 rounded-full bg-neutral-900 px-3 py-1 border border-neutral-800 text-neutral-300">
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
              <span>AES-256 Protected</span>
            </span>
            <span className="flex items-center space-x-1.5 rounded-full bg-neutral-900 px-3 py-1 border border-neutral-800 text-neutral-300">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>GCP KMS CMEK</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Hand: Interactive Viewports & Mic Inputs */}
        <section className="lg:col-span-5 flex flex-col space-y-6">
          <div className="h-[360px] w-full relative">
            <ThreeCanvas />
          </div>

          <AudioAnalyzer />

          {/* Quick-test talking presets */}
          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 backdrop-blur-md shadow-xl space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>Interactive Lip-Sync Speech Presets</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Synthesize and stream simulated real-time audio amplitudes from Gemini Live to animate the 3D twin's blend-shapes dynamically.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => triggerMockLiveResponse("breathing")}
                disabled={isLiveConnecting}
                className="rounded-full bg-neutral-950/80 hover:bg-neutral-900 text-[10px] font-bold uppercase tracking-wider text-purple-400 border border-purple-500/20 py-2 hover:border-purple-500/40 transition duration-200 cursor-pointer"
              >
                Breathing
              </button>
              <button
                onClick={() => triggerMockLiveResponse("grounding")}
                disabled={isLiveConnecting}
                className="rounded-full bg-neutral-950/80 hover:bg-neutral-900 text-[10px] font-bold uppercase tracking-wider text-pink-400 border border-pink-500/20 py-2 hover:border-pink-500/40 transition duration-200 cursor-pointer"
              >
                Grounding
              </button>
              <button
                onClick={() => triggerMockLiveResponse("encouragement")}
                disabled={isLiveConnecting}
                className="rounded-full bg-neutral-950/80 hover:bg-neutral-900 text-[10px] font-bold uppercase tracking-wider text-cyan-400 border border-cyan-500/20 py-2 hover:border-cyan-500/40 transition duration-200 cursor-pointer"
              >
                Encourage
              </button>
            </div>
          </div>
        </section>

        {/* Right Hand: Structured Journal Inputs & Dynamic Analytics */}
        <section className="lg:col-span-7 flex flex-col space-y-6">
          <JournalSection />

          {/* Real-time telemetry connection logger */}
          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 backdrop-blur-md shadow-xl flex-1 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between border-b border-neutral-800/40 pb-3 mb-3">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                <MessageSquare className="h-4 w-4 text-cyan-400" />
                <span>Gemini Live Connection Telemetry</span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                isLiveConnected 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : isLiveConnecting 
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse" 
                  : "bg-neutral-950 text-neutral-500 border-neutral-800"
              }`}>
                {isLiveConnected ? "Connected" : isLiveConnecting ? "Connecting" : "Disconnected"}
              </span>
            </div>

            <div className="flex-1 bg-neutral-950/80 border border-neutral-800/50 rounded-xl p-3 font-mono text-[10px] leading-relaxed text-neutral-400 overflow-y-auto max-h-[160px] shadow-inner">
              {liveLogs.length > 0 ? (
                <div className="space-y-1">
                  {liveLogs.map((log, index) => (
                    <div key={index} className="border-l border-cyan-500/20 pl-2">
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-600 italic">
                  No active logs. Trigger presets or activate the microphone to stream payloads.
                </div>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* Footer bar */}
      <footer className="border-t border-neutral-800/50 bg-neutral-950/40 py-4 px-6 text-center text-[10px] text-neutral-500 uppercase tracking-widest">
        MindBuddy Project • Strict Compliance Review Version • Target Accessibility 100/100
      </footer>
    </div>
  );
}
