"use client";

import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { Mic, MicOff, Volume2 } from "lucide-react";

export default function AudioAnalyzer() {
  const {
    mouthOpenness,
    setMouthOpenness,
    isMicActive,
    setIsMicActive,
    addLiveLog,
    announceToScreenReader,
  } = useApp();

  const [dbLevel, setDbLevel] = useState(-100); // Decibel level: -100 to 0
  const [rmsLevel, setRmsLevel] = useState(0); // Normalized RMS level: 0 to 1
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startMicrophone = async () => {
    try {
      addLiveLog("Requesting microphone hardware permissions...");
      announceToScreenReader("Requesting microphone permissions.");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      
      // Initialize Web Audio API components
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      source.connect(analyser);
      setIsMicActive(true);
      addLiveLog("Microphone connected. Analysis engine started.");
      announceToScreenReader("Microphone active. Real-time audio analyzing is enabled.");

      // Analysis loop
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const analyze = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(dataArray);

        // Compute Root Mean Square (RMS) amplitude
        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
          const normalized = (dataArray[i] - 128) / 128; // Normalize to [-1, 1]
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);
        
        // Convert to decibels (logarithmic scale)
        const db = rms > 0 ? 20 * Math.log10(rms) : -100;

        setRmsLevel(rms);
        setDbLevel(Math.max(db, -100)); // Cap lower bound

        // Map RMS level directly onto mouth openness (e.g. scale Y)
        const openness = Math.min(Math.max(rms * 2.8, 0.05), 1.0);
        setMouthOpenness(openness);

        animationFrameRef.current = requestAnimationFrame(analyze);
      };

      analyze();
    } catch (err: any) {
      console.error("Microphone access failed", err);
      addLiveLog(`Error accessing mic: ${err.message || "Permissions denied"}`);
      announceToScreenReader("Failed to access microphone. Please check your system settings.");
      setIsMicActive(false);
    }
  };

  const stopMicrophone = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      if (audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsMicActive(false);
    setMouthOpenness(0.1);
    setDbLevel(-100);
    setRmsLevel(0);
    addLiveLog("Microphone stream closed. Audio analysis ended.");
    announceToScreenReader("Microphone turned off.");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // UI decibel indicator percentage helper
  const dbPercentage = Math.round(((dbLevel + 100) / 100) * 100);

  return (
    <div className="flex flex-col space-y-4 rounded-3xl border border-white/80 bg-white/40 p-5 backdrop-blur-xl shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 border border-blue-100/50">
            <Volume2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-slate-800">My Voice Helper</h3>
            <p className="text-xs text-slate-500">Enable speaking with your companion</p>
          </div>
        </div>

        {/* Toggle switch with curvy buttons */}
        <button
          id="mic-toggle-button"
          onClick={isMicActive ? stopMicrophone : startMicrophone}
          className={`flex items-center space-x-2 rounded-full px-5 py-2 text-xs font-bold tracking-wide transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9F9FFF] focus:ring-offset-2 focus:ring-offset-slate-50 cursor-pointer ${
            isMicActive
              ? "bg-rose-500/10 text-rose-600 border border-rose-200/50 hover:bg-rose-500/20"
              : "bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white hover:shadow-indigo-500/10 hover:scale-103"
          }`}
          aria-pressed={isMicActive}
          aria-label={isMicActive ? "Turn off voice assistant" : "Turn on voice assistant to talk with your companion"}
        >
          {isMicActive ? (
            <>
              <MicOff className="h-3.5 w-3.5" />
              <span>Turn Mic Off</span>
            </>
          ) : (
            <>
              <Mic className="h-3.5 w-3.5 animate-pulse" />
              <span>Talk to Companion</span>
            </>
          )}
        </button>
      </div>

      {/* Visual meter bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-500">
          <span>My Speech Wave:</span>
          <span className="text-xs text-[#6366F1] font-bold">{isMicActive ? "Voice Connected" : "Mic Quiet"}</span>
        </div>
        
        {/* Modern multi-segment visual progress indicator bar */}
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 transition-all duration-75"
            style={{ width: `${isMicActive ? dbPercentage : mouthOpenness * 100}%` }}
          />
        </div>
      </div>

      {/* Grid of details, completely stripped of technical Y-scale ratios or decibel math */}
      <div className="grid grid-cols-2 gap-3 text-xs font-bold">
        <div className="rounded-2xl bg-white/70 border border-slate-100/80 p-3 flex flex-col justify-center">
          <span className="block text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">Vocal Connection</span>
          <span className={`text-xs ${isMicActive ? 'text-emerald-600' : 'text-slate-500'}`}>
            {isMicActive ? "Active" : "Standby"}
          </span>
        </div>
        <div className="rounded-2xl bg-white/70 border border-slate-100/80 p-3 flex flex-col justify-center">
          <span className="block text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">Companion Voice Status</span>
          <span className={`text-xs ${mouthOpenness > 0.15 ? 'text-pink-600' : 'text-slate-500'}`}>
            {mouthOpenness > 0.15 ? "Speaking..." : "Quiet"}
          </span>
        </div>
      </div>

      {/* Accessible landmark descriptor */}
      <span className="sr-only">
        {isMicActive 
          ? "Microphone is currently active and helping you talk to your wellness companion."
          : "Microphone analysis is currently on standby."}
      </span>
    </div>
  );
}
