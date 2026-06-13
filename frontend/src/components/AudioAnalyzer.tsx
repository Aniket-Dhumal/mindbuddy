"use client";

import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { Mic, MicOff, Settings, Volume2 } from "lucide-react";

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
        // Reference amplitude is 1.0 (max digital volume)
        const db = rms > 0 ? 20 * Math.log10(rms) : -100;

        setRmsLevel(rms);
        setDbLevel(Math.max(db, -100)); // Cap lower bound

        // Map RMS level directly onto mouth openness (e.g. scale Y)
        // Multiply by an appropriate gain factor for sensitive lip responsiveness
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
    <div className="flex flex-col space-y-4 rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
            <Volume2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-neutral-100">Web Audio Analyzer</h3>
            <p className="text-xs text-neutral-400">Lip-sync analysis state</p>
          </div>
        </div>

        {/* Toggle switch with curvy buttons */}
        <button
          onClick={isMicActive ? stopMicrophone : startMicrophone}
          className={`flex items-center space-x-2 rounded-full px-5 py-2 text-xs font-semibold tracking-wider transition-all duration-300 shadow-md ${
            isMicActive
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
              : "bg-cyan-500 text-neutral-950 hover:bg-cyan-400 font-bold hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          }`}
          aria-pressed={isMicActive}
          aria-label={isMicActive ? "Disable microphone" : "Enable microphone for live speech lip-sync"}
        >
          {isMicActive ? (
            <>
              <MicOff className="h-3.5 w-3.5" />
              <span>STOP ANALYZER</span>
            </>
          ) : (
            <>
              <Mic className="h-3.5 w-3.5 animate-pulse" />
              <span>TALK TO TWIN</span>
            </>
          )}
        </button>
      </div>

      {/* Visual meter bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-neutral-400">
          <span>Decibel Variance (Audio Input)</span>
          <span className="font-mono text-cyan-400 font-semibold">{dbLevel > -100 ? `${dbLevel.toFixed(1)} dB` : "MUTED"}</span>
        </div>
        
        {/* Modern multi-segment visual progress indicator bar */}
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-neutral-950 p-[2px] border border-neutral-800/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-rose-500 transition-all duration-75"
            style={{ width: `${isMicActive ? dbPercentage : mouthOpenness * 100}%` }}
          />
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-2 gap-3 text-[11px] font-medium text-neutral-400">
        <div className="rounded-lg bg-neutral-950/60 border border-neutral-800/40 p-2.5">
          <span className="block text-neutral-500 text-[10px] uppercase tracking-wider mb-0.5">Mouth Scaling Ratio</span>
          <span className="font-mono text-xs text-rose-400 font-semibold">
            Y-Scale: {((mouthOpenness * 12.0) + 0.15).toFixed(2)}x
          </span>
        </div>
        <div className="rounded-lg bg-neutral-950/60 border border-neutral-800/40 p-2.5">
          <span className="block text-neutral-500 text-[10px] uppercase tracking-wider mb-0.5">Input Amplitude (RMS)</span>
          <span className="font-mono text-xs text-emerald-400 font-semibold">
            {(rmsLevel * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Accessible landmark descriptor */}
      <span className="sr-only">
        {isMicActive 
          ? `Microphone is active. Your current speech decibel amplitude is ${dbLevel.toFixed(0)} decibels, and the 3D twin's mouth is opening at a ratio of ${mouthOpenness.toFixed(2)}.`
          : "Microphone analysis is currently disabled. Interactive lip-sync will react to artificial talking responses instead."}
      </span>
    </div>
  );
}
