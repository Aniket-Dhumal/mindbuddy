"use client";

import React from "react";
import { useApp } from "../context/AppContext";
import { Award, Compass, Heart, HelpCircle, Lightbulb, ListChecks } from "lucide-react";

export default function CopingStrategiesSection() {
  const { state } = useApp();

  return (
    <div className="flex flex-col space-y-5 rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-6 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between border-b border-neutral-800/50 pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-wide text-neutral-100">Coping Strategies</h2>
            <p className="text-xs text-neutral-400">Therapeutic Assigned Workload</p>
          </div>
        </div>
        <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
          Clinical Guidance
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Coping Strategy Box */}
        <div className="rounded-xl border border-neutral-800/60 bg-neutral-950/50 p-4.5 space-y-2.5 transition-all hover:border-emerald-500/20 duration-300">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Lightbulb className="h-4 w-4" />
            <span>coping_strategy_payload</span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed font-sans min-h-[50px]">
            {state.coping_strategy_payload || (
              <span className="text-neutral-500 italic">
                Active clinical-grade coping instructions will display here once academic journals are parsed or Live simulation answers are triggered.
              </span>
            )}
          </p>
        </div>

        {/* Mindfulness assigned exercise Box */}
        <div className="rounded-xl border border-neutral-800/60 bg-neutral-950/50 p-4.5 space-y-2.5 transition-all hover:border-indigo-500/20 duration-300">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <Heart className="h-4 w-4" />
            <span>mindfulness_exercise_assigned</span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed font-sans min-h-[50px]">
            {state.mindfulness_exercise_assigned || (
              <span className="text-neutral-500 italic">
                A custom mindfulness decompression sequence will be generated and assigned here based on emotional burnout scores.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Quick advice tips for students */}
      <div className="rounded-xl border border-neutral-800/40 bg-neutral-950/20 p-4 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-neutral-300">
          <ListChecks className="h-4 w-4 text-purple-400" />
          <span>Tactical Examination Wellness Decompressors</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-400">
          <div className="flex items-start space-x-2">
            <span className="text-purple-400 font-bold">•</span>
            <span><strong>Hydration Cycles:</strong> Keep water on your desk. Dehydration drops focus levels by up to 15%.</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-400 font-bold">•</span>
            <span><strong>Defeat Backlogs:</strong> Isolate backlogs into atomic 20-minute daily review micro-sessions.</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-400 font-bold">•</span>
            <span><strong>Sleep Hygiene:</strong> 7.5 hours of sleep optimizes memory consolidation for exam syllabus retrieval.</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-400 font-bold">•</span>
            <span><strong>Active Recall Rest:</strong> Never study longer than 110 minutes without complete cognitive disengagement.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
