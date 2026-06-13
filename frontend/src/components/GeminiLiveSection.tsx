"use client";

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Wifi, WifiOff, Terminal, Sparkles, Brain, Wind, HeartHandshake, Eye } from "lucide-react";

export default function GeminiLiveSection() {
  const {
    isLiveConnected,
    isLiveConnecting,
    setIsLiveConnected,
    setIsLiveConnecting,
    liveLogs,
    addLiveLog,
    clearLiveLogs,
    triggerMockLiveResponse,
    announceToScreenReader,
  } = useApp();

  const [wsUrl, setWsUrl] = useState("wss://api.gemini.live/v1/stream?voice=puck");

  const toggleConnection = () => {
    if (isLiveConnected) {
      setIsLiveConnected(false);
      setIsLiveConnecting(false);
      addLiveLog("Closed Gemini Live WebSocket connection.");
      announceToScreenReader("Gemini Live stream disconnected.");
    } else {
      setIsLiveConnecting(true);
      addLiveLog(`Opening connection to: ${wsUrl}...`);
      announceToScreenReader("Connecting to Gemini Live WebSocket.");
      setTimeout(() => {
        setIsLiveConnecting(false);
        setIsLiveConnected(true);
        addLiveLog("Connection successfully established with Gemini Live WebSocket Server!");
        announceToScreenReader("Gemini Live stream connected and ready.");
      }, 1000);
    }
  };

  const handleSimulateType = (type: string) => {
    triggerMockLiveResponse(type);
  };

  return (
    <div className="flex flex-col space-y-5 rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-6 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between border-b border-neutral-800/50 pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
            <Wifi className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-wide text-neutral-100">Gemini Live Client</h2>
            <p className="text-xs text-neutral-400">Bidirectional stream channel</p>
          </div>
        </div>

        {/* Live indicator with pulsing neon dots */}
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            {isLiveConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isLiveConnected ? "bg-cyan-500" : isLiveConnecting ? "bg-amber-500" : "bg-neutral-600"
              }`}
            ></span>
          </span>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest ${
              isLiveConnected ? "text-cyan-400" : isLiveConnecting ? "text-amber-400" : "text-neutral-500"
            }`}
          >
            {isLiveConnected ? "Connected" : isLiveConnecting ? "Connecting" : "Offline"}
          </span>
        </div>
      </div>

      {/* WebSocket Endpoint configuration */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
          WebSocket API Endpoint (wss://)
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={wsUrl}
            onChange={(e) => setWsUrl(e.target.value)}
            disabled={isLiveConnected || isLiveConnecting}
            className="flex-1 rounded-full border border-neutral-800/80 bg-neutral-950/80 px-4 py-1.5 text-xs text-neutral-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/60 transition-all font-mono"
          />
          <button
            onClick={toggleConnection}
            disabled={isLiveConnecting}
            className={`rounded-full px-5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border cursor-pointer ${
              isLiveConnected
                ? "bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/35"
                : "bg-cyan-500 hover:bg-cyan-400 text-neutral-950 border-cyan-400 hover:shadow-[0_0_12px_rgba(6,182,212,0.4)]"
            }`}
          >
            {isLiveConnected ? "Disconnect" : isLiveConnecting ? "Connecting" : "Connect"}
          </button>
        </div>
      </div>

      {/* INTERACTIVE SIMULATION PANEL */}
      <div className="rounded-xl border border-neutral-800/60 bg-neutral-950/40 p-4 space-y-3.5 shadow-inner">
        <div className="flex items-center space-x-2 text-neutral-300 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>Interactive Therapy Simulation Panel</span>
        </div>
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          Trigger real-time speech responses representing the Gemini Live output payload. The twin's mouth open/close animations will sync precisely with the verbal pitch fluctuations!
        </p>

        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => handleSimulateType("breathing")}
            className="flex flex-col items-center justify-center rounded-xl border border-neutral-800/60 bg-neutral-950/60 hover:bg-neutral-900/60 hover:border-cyan-500/40 p-3 text-center transition-all duration-300 group cursor-pointer"
          >
            <Wind className="h-4 w-4 text-cyan-400 mb-1 animate-pulse" />
            <span className="text-[10px] font-bold text-neutral-200 group-hover:text-cyan-400 uppercase tracking-wider">
              Box Breathing
            </span>
            <span className="text-[8px] text-neutral-500 mt-0.5 leading-snug">Relax autonomics</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimulateType("grounding")}
            className="flex flex-col items-center justify-center rounded-xl border border-neutral-800/60 bg-neutral-950/60 hover:bg-neutral-900/60 hover:border-pink-500/40 p-3 text-center transition-all duration-300 group cursor-pointer"
          >
            <Eye className="h-4 w-4 text-pink-400 mb-1" />
            <span className="text-[10px] font-bold text-neutral-200 group-hover:text-pink-400 uppercase tracking-wider">
              Sensory 5-4-3-2-1
            </span>
            <span className="text-[8px] text-neutral-500 mt-0.5 leading-snug">Calm cognitive spiral</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimulateType("encouragement")}
            className="flex flex-col items-center justify-center rounded-xl border border-neutral-800/60 bg-neutral-950/60 hover:bg-neutral-900/60 hover:border-purple-500/40 p-3 text-center transition-all duration-300 group cursor-pointer"
          >
            <HeartHandshake className="h-4 w-4 text-purple-400 mb-1" />
            <span className="text-[10px] font-bold text-neutral-200 group-hover:text-purple-400 uppercase tracking-wider">
              Resilience affirmations
            </span>
            <span className="text-[8px] text-neutral-500 mt-0.5 leading-snug">Cure test anxieties</span>
          </button>
        </div>
      </div>

      {/* STREAM TRAFFIC LOGS (TERMINAL) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-neutral-400">
          <div className="flex items-center space-x-1.5">
            <Terminal className="h-3.5 w-3.5 text-neutral-500" />
            <span>WSS Data Traffic Logs</span>
          </div>
          <button
            onClick={clearLiveLogs}
            className="text-[10px] text-neutral-500 hover:text-neutral-300 uppercase tracking-widest bg-neutral-950/60 border border-neutral-800 px-2 py-0.5 rounded-md cursor-pointer"
          >
            Clear Terminal
          </button>
        </div>

        <div className="h-36 w-full overflow-y-auto rounded-xl border border-neutral-800/80 bg-neutral-950/90 p-3 font-mono text-[10px] leading-relaxed text-cyan-500/95 shadow-inner">
          {liveLogs.length > 0 ? (
            <div className="flex flex-col space-y-1.5">
              {liveLogs.map((log, idx) => (
                <div key={idx} className="whitespace-pre-wrap border-l border-neutral-800/60 pl-2">
                  <span className="text-neutral-500 font-sans pr-1">↳</span>
                  {log}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-600 italic">
              <span>Terminal idle. Activate WebSocket or click a Simulation therapy button above...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
