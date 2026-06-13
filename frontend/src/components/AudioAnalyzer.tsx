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
    availableVoices,
    companionVoiceURI,
    setCompanionVoiceURI,
  } = useApp();

  const [dbLevel, setDbLevel] = useState(-100); // Decibel level: -100 to 0
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
      
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const analyze = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(dataArray);

        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);
        const db = rms > 0 ? 20 * Math.log10(rms) : -100;

        setDbLevel(Math.max(db, -100));

        const openness = Math.min(Math.max(rms * 2.8, 0.05), 1.0);
        setMouthOpenness(openness);

        animationFrameRef.current = requestAnimationFrame(analyze);
      };

      analyze();
    } catch (err) {
      console.error("Microphone access failed", err);
      const error = err as Error;
      addLiveLog(`Error accessing mic: ${error.message || "Permissions denied"}`);
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
    addLiveLog("Microphone stream closed. Audio analysis ended.");
    announceToScreenReader("Microphone turned off.");
  };

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

  const dbPercentage = Math.round(((dbLevel + 100) / 100) * 100);

  return (
    <div className="flex flex-col space-y-4 rounded-3xl border border-neutral-800/80 bg-neutral-900/40 p-5 backdrop-blur-xl shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Volume2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-neutral-100">Live Companion Voice Selection</h3>
            <p className="text-[11px] text-neutral-400">Choose your perfect comforting presence</p>
          </div>
        </div>

        {/* Dynamic SpeechSynthesis Voice picker */}
        {availableVoices.length > 0 && (
          <div className="relative">
            <label htmlFor="companion-voice-select" className="sr-only">Choose companion voice</label>
            <select
              id="companion-voice-select"
              value={companionVoiceURI}
              onChange={(e) => setCompanionVoiceURI(e.target.value)}
              className="w-full sm:w-48 text-[11px] bg-neutral-950/80 border border-neutral-800 text-neutral-200 rounded-xl px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 cursor-pointer"
            >
              {availableVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name.replace("Microsoft", "").replace("Google", "").trim()} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Mic toggle and speechwave meter */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-t border-neutral-850 pt-3">
        {/* Toggle switch with curvy buttons */}
        <button
          id="mic-toggle-button"
          onClick={isMicActive ? stopMicrophone : startMicrophone}
          className={`flex items-center space-x-2 rounded-full px-5 py-2 text-xs font-bold tracking-wide transition-all duration-300 shadow-sm cursor-pointer ${
            isMicActive
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
              : "bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md shadow-indigo-500/10 hover:scale-102"
          }`}
          aria-pressed={isMicActive}
          aria-label={isMicActive ? "Turn off voice assistant" : "Turn on voice assistant to talk with your companion"}
        >
          {isMicActive ? (
            <>
              <MicOff className="h-3.5 w-3.5" />
              <span>Disable Live Talk</span>
            </>
          ) : (
            <>
              <Mic className="h-3.5 w-3.5 animate-pulse" />
              <span>Talk to Companion</span>
            </>
          )}
        </button>

        {/* Visual meter bar */}
        <div className="flex-1 w-full space-y-1">
          <div className="flex justify-between text-[11px] font-bold text-neutral-400">
            <span>LIVE AUDIO WAVEFORM:</span>
            <span className={`text-[11px] font-bold ${isMicActive ? "text-cyan-400" : "text-neutral-400"}`}>
              {isMicActive ? "Active Decibels" : "Silent standby"}
            </span>
          </div>
          
          {/* Modern multi-segment visual progress indicator bar */}
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-neutral-950 p-0.5 border border-neutral-850">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 transition-all duration-75"
              style={{ width: `${isMicActive ? dbPercentage : mouthOpenness * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-2 gap-3 text-xs font-bold border-t border-neutral-850 pt-3">
        <div className="rounded-2xl bg-neutral-950/40 border border-neutral-850 p-3 flex flex-col justify-center">
          <span className="block text-neutral-400 text-[9px] uppercase tracking-widest mb-0.5">Vocal Connection</span>
          <span className={`text-xs ${isMicActive ? 'text-cyan-400' : 'text-neutral-400'}`}>
            {isMicActive ? "Streaming" : "Standby"}
          </span>
        </div>
        <div className="rounded-2xl bg-neutral-950/40 border border-neutral-850 p-3 flex flex-col justify-center">
          <span className="block text-neutral-400 text-[9px] uppercase tracking-widest mb-0.5">Twin Voice Status</span>
          <span className={`text-xs ${mouthOpenness > 0.15 ? 'text-pink-400' : 'text-neutral-400'}`}>
            {mouthOpenness > 0.15 ? "Speaking..." : "Quiet"}
          </span>
        </div>
      </div>
    </div>
  );
}
