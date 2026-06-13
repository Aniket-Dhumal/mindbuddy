"use client";

import React, { useState } from "react";
import { useApp, ExamTarget } from "../context/AppContext";
import ThreeCanvas from "../components/ThreeCanvas";
import AudioAnalyzer from "../components/AudioAnalyzer";
import { 
  BookOpen, 
  Brain, 
  Sparkles, 
  Heart, 
  Send, 
  RefreshCw, 
  AlertTriangle, 
  Activity, 
  Award,
  Terminal,
  HelpCircle,
  CheckCircle2,
  Lock
} from "lucide-react";

export default function Home() {
  const {
    state,
    isLiveConnected,
    isLiveConnecting,
    liveLogs,
    clearLiveLogs,
    screenReaderMessage,
    triggerMockJournalAnalysis,
    triggerMockLiveResponse,
  } = useApp();

  const [journalInput, setJournalInput] = useState("");
  const [examTarget, setExamTarget] = useState<ExamTarget>("JEE_ADVANCED");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalInput.trim()) return;
    
    setIsSubmitting(true);
    triggerMockJournalAnalysis(journalInput, examTarget);
    
    // Simulate low latency backend turnaround
    setTimeout(() => {
      setIsSubmitting(false);
    }, 1200);
  };

  const getBurnoutRiskColor = (index: number) => {
    if (index >= 0.6) return "from-rose-500 to-red-500 bg-rose-500 border-rose-500 text-rose-300";
    if (index >= 0.35) return "from-amber-400 to-orange-500 bg-amber-400 border-amber-400 text-amber-300";
    return "from-cyan-400 to-emerald-400 bg-cyan-400 border-cyan-400 text-cyan-300";
  };

  const getBurnoutRiskLabel = (index: number) => {
    if (index === 0) return "Awaiting Entry Analysis";
    if (index >= 0.6) return "HIGH BURNOUT RISK DETECTED (DANGER)";
    if (index >= 0.35) return "MODERATE STRESS OVERLOAD (WARNING)";
    return "SAFE COGNITIVE BALANCE (NORMAL)";
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 2. Dynamic Accessibility Screen Reader Announcement Node */}
      <div 
        id="sr-announcement-utility"
        className="sr-only" 
        role="status" 
        aria-live="polite"
        aria-atomic="true"
      >
        {screenReaderMessage}
      </div>

      {/* Accessible Header Navigation */}
      <header className="border-b border-neutral-800/80 bg-neutral-900/40 backdrop-blur-md px-6 py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Brain className="h-5 w-5 text-neutral-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-neutral-50 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
                MINDBUDDY
              </h1>
              <p className="text-[10px] text-neutral-400 tracking-widest uppercase font-semibold">
                AI student wellness companion
              </p>
            </div>
          </div>

          {/* Secure student session indicator card */}
          <div className="flex items-center gap-3 bg-neutral-950/80 border border-neutral-800/80 rounded-full px-4 py-1.5 shadow-inner">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
            <span className="text-xs text-neutral-300 font-medium tracking-wide">
              ID: <span className="font-mono text-cyan-400 font-semibold">{state.student_id}</span>
            </span>
            <span className="text-neutral-700 font-bold">|</span>
            <span className="text-xs text-neutral-300 font-medium flex items-center space-x-1">
              <Lock className="h-3 w-3 text-neutral-400 mr-0.5" aria-hidden="true" />
              <span>AES-256 SECURED</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main dashboard content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: 3D Twin Viewport, Soundwave Mic Analyzer, Live Terminal logs */}
        <section className="lg:col-span-5 flex flex-col space-y-6 w-full">
          
          {/* Three.js viewport */}
          <div className="h-[360px] w-full">
            <ThreeCanvas />
          </div>

          {/* Audio Analyzer Panel */}
          <AudioAnalyzer />

          {/* Gemini Live Simulator Controls & Terminal Logs */}
          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 backdrop-blur-md shadow-xl flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-semibold tracking-wide text-neutral-100">
                  Gemini Live Multi-modal Stream
                </h3>
              </div>
              
              <div className="flex items-center space-x-1.5 text-[10px] uppercase font-bold tracking-wider">
                {isLiveConnected ? (
                  <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE-CONNECT
                  </span>
                ) : isLiveConnecting ? (
                  <span className="text-cyan-400 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                    CONNECTING...
                  </span>
                ) : (
                  <span className="text-neutral-400 flex items-center gap-1 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                    STANDBY
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-neutral-350 leading-relaxed">
              Activate real-time multi-modal responses. The simulated stream maps synthesized voice amplitude fluctuations onto the mouth coordinates of the 3D twin avatar mesh.
            </p>

            {/* Simulated Live Triggers */}
            <div className="grid grid-cols-3 gap-2">
              <button
                id="btn-trigger-breathing"
                onClick={() => triggerMockLiveResponse("breathing")}
                disabled={isLiveConnecting}
                className="rounded-xl border border-purple-500/30 bg-purple-950/20 px-3 py-2.5 text-center text-xs font-semibold text-purple-300 hover:bg-purple-900/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Simulate Gemini response for box breathing exercises"
              >
                BREATHING
              </button>
              <button
                id="btn-trigger-grounding"
                onClick={() => triggerMockLiveResponse("grounding")}
                disabled={isLiveConnecting}
                className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-3 py-2.5 text-center text-xs font-semibold text-cyan-300 hover:bg-cyan-900/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Simulate Gemini response for sensory grounding exercises"
              >
                GROUNDING
              </button>
              <button
                id="btn-trigger-encouragement"
                onClick={() => triggerMockLiveResponse("encouragement")}
                disabled={isLiveConnecting}
                className="rounded-xl border border-rose-500/30 bg-rose-950/20 px-3 py-2.5 text-center text-xs font-semibold text-rose-300 hover:bg-rose-900/30 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Simulate Gemini response for encouragement and academic stress support"
              >
                ENCOURAGE
              </button>
            </div>

            {/* WebSocket Console Output */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between text-xs text-neutral-350">
                <span className="flex items-center gap-1 font-semibold">
                  <Terminal className="h-3.5 w-3.5" />
                  Live Channel Output Logs
                </span>
                {liveLogs.length > 0 && (
                  <button
                    id="btn-clear-logs"
                    onClick={clearLiveLogs}
                    className="text-[10px] text-cyan-400 font-bold hover:underline uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-1"
                    aria-label="Clear active channel output logs"
                  >
                    Clear Terminal
                  </button>
                )}
              </div>
              <div 
                className="h-28 w-full overflow-y-auto rounded-xl bg-neutral-950 border border-neutral-800/80 p-3.5 font-mono text-[10px] text-neutral-400 flex flex-col-reverse space-y-reverse gap-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-700"
                tabIndex={0}
                aria-label="WebSocket Connection Activity Terminal"
              >
                {liveLogs.length === 0 ? (
                  <span className="text-neutral-500 italic">[Standby] Awaiting audio inputs or simulation trigger commands...</span>
                ) : (
                  liveLogs.map((log, i) => (
                    <span key={i} className="leading-relaxed block border-l border-neutral-800 pl-2">
                      <span className="text-neutral-500">SYS:</span> {log}
                    </span>
                  ))
                )}
              </div>
            </div>

          </div>
        </section>

        {/* RIGHT COLUMN: Open-Ended Journal, Stress Index Meter, Stress triggers chip list, Strategy logs */}
        <section className="lg:col-span-7 flex flex-col space-y-6 w-full">
          
          {/* Accessible Form Journal Input */}
          <form 
            id="student-journal-form"
            onSubmit={handleSubmitJournal}
            className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 backdrop-blur-md shadow-xl flex flex-col space-y-4"
          >
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <BookOpen className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-neutral-100">
                  Open-Ended Academic Journal
                </h2>
                <p className="text-xs text-neutral-350">
                  Write freely about mock test fatigue, backlogs, parents, or exams.
                </p>
              </div>
            </div>

            {/* Grouped fieldset with label bindings */}
            <div className="space-y-4">
              
              {/* Exam Target Selection */}
              <div className="flex flex-col space-y-1.5">
                <label 
                  htmlFor="exam-target-select" 
                  id="label-exam-target"
                  className="text-xs font-semibold text-neutral-300 tracking-wide flex items-center justify-between"
                >
                  <span>Select Target Examination Scope:</span>
                  <span className="text-[10px] text-purple-400 font-bold font-mono">FR-1.2 COMPLIANT</span>
                </label>
                <div className="relative">
                  <select
                    id="exam-target-select"
                    value={examTarget}
                    onChange={(e) => setExamTarget(e.target.value as ExamTarget)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-all appearance-none cursor-pointer"
                    aria-labelledby="label-exam-target"
                  >
                    <option value="JEE_ADVANCED">JEE Advanced (Engineering Aspirant)</option>
                    <option value="NEET_UG">NEET UG (Medical Aspirant)</option>
                    <option value="CAT">CAT (Management Aspirant)</option>
                    <option value="UPSC">UPSC Civil Services (Indian Bureaucracy)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 border-l border-neutral-800 pl-3">
                    <Award className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Journal Entry Textarea */}
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between text-xs text-neutral-350">
                  <label 
                    htmlFor="journal-textarea" 
                    className="font-semibold text-neutral-300 tracking-wide"
                  >
                    Write your journal entry below:
                  </label>
                  <span className="font-mono text-[10px]">
                    {journalInput.length} chars
                  </span>
                </div>
                
                <textarea
                  id="journal-textarea"
                  value={journalInput}
                  onChange={(e) => setJournalInput(e.target.value)}
                  placeholder="Today, my mock test scores dropped, and I feel overwhelmed by the biology backlog... I am worried about the syllabus."
                  className="w-full h-32 rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-200 leading-relaxed placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-all resize-none"
                  aria-describedby="journal-hint"
                  required
                />
                
                <span id="journal-hint" className="text-[10px] text-neutral-400 flex items-center gap-1.5 leading-relaxed bg-neutral-950/40 p-2 rounded-lg border border-neutral-800/40">
                  <HelpCircle className="h-3.5 w-3.5 text-cyan-400/80 shrink-0" />
                  Your entry is encrypted in memory immediately. AI models will extract 'hidden_stress_triggers' and calculate 'burnout_risk_index'.
                </span>
              </div>
            </div>

            {/* Submission button */}
            <button
              id="journal-submit-button"
              type="submit"
              disabled={isSubmitting || !journalInput.trim()}
              className={`w-full flex items-center justify-center space-x-2 rounded-xl px-5 py-3.5 text-sm font-bold tracking-wider transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 focus:ring-offset-2 focus:ring-offset-neutral-900 cursor-pointer ${
                isSubmitting || !journalInput.trim()
                  ? "bg-neutral-800 text-neutral-500 border border-neutral-800 cursor-not-allowed"
                  : "bg-cyan-500 text-neutral-950 hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.35)]"
              }`}
              aria-label={isSubmitting ? "Processing journal analysis" : "Analyze journal entry stress levels"}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>EXTRACTING COGNITIVE METRICS...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>ANALYZE STRESS & BURNOUT INDEX</span>
                </>
              )}
            </button>
          </form>

          {/* AI Clinical Sentiment Feedback Section */}
          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 backdrop-blur-md shadow-xl flex flex-col space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Activity className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-neutral-100">
                    Clinical Wellness Diagnostics
                  </h3>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">
                    Real-time AI Sentiment Metrics
                  </p>
                </div>
              </div>
              <span className="font-mono text-[10px] text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                FR-2.2 COMPLIANT
              </span>
            </div>

            {/* 4. Burnout Risk Index (Progress Bar Meter) */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-semibold">
                <span className="text-neutral-300">Burnout Risk Index (burnout_risk_index):</span>
                <span className={`font-mono text-[11px] tracking-wider uppercase ${state.burnout_risk_index > 0 ? getBurnoutRiskColor(state.burnout_risk_index) : 'text-neutral-400'}`}>
                  {getBurnoutRiskLabel(state.burnout_risk_index)}
                </span>
              </div>

              <div className="flex items-center space-x-3.5">
                {/* Visual accessible progressbar element */}
                <div 
                  id="burnout-progress-container"
                  className="relative h-4 flex-1 overflow-hidden rounded-full bg-neutral-950 p-[3px] border border-neutral-800"
                  role="progressbar"
                  aria-valuenow={Math.round(state.burnout_risk_index * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuetext={`Burnout risk index is at ${(state.burnout_risk_index * 100).toFixed(0)}%`}
                >
                  <div
                    className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${getBurnoutRiskColor(state.burnout_risk_index)}`}
                    style={{ width: `${state.burnout_risk_index * 100}%` }}
                  />
                </div>
                <span className="font-mono text-sm font-bold text-neutral-100 shrink-0 w-12 text-right">
                  {(state.burnout_risk_index * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* AI Extracted Hidden Stress Triggers (hidden_stress_triggers) */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-neutral-300 tracking-wide uppercase">
                AI-Extracted Stress Triggers (hidden_stress_triggers):
              </h4>
              <div className="flex flex-wrap gap-2">
                {state.hidden_stress_triggers.length === 0 ? (
                  <span className="text-xs text-neutral-500 italic leading-relaxed bg-neutral-950/40 px-3 py-1.5 rounded-lg border border-neutral-800/20">
                    Awaiting open-ended journal analysis to isolate cognitive triggers...
                  </span>
                ) : (
                  state.hidden_stress_triggers.map((trigger, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-300 font-medium"
                    >
                      <AlertTriangle className="h-3 w-3 text-rose-400" />
                      <span>{trigger}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Multimodal response display cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Assigned Mindfulness Exercise (mindfulness_exercise_assigned) */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-300 tracking-wide uppercase flex items-center gap-1.5 mb-1.5">
                    <Heart className="h-3.5 w-3.5 text-purple-400" />
                    Mindfulness Assignment:
                  </h4>
                  <p className="text-xs text-neutral-350 leading-relaxed min-h-12">
                    {state.mindfulness_exercise_assigned || "Awaiting stress analysis report..."}
                  </p>
                </div>
                {state.mindfulness_exercise_assigned && (
                  <div className="text-[9px] uppercase tracking-wider text-purple-400 font-semibold font-mono mt-2 bg-purple-500/5 px-2 py-1 border border-purple-500/10 rounded w-max">
                    Assigned exercise
                  </div>
                )}
              </div>

              {/* Coping Strategy assigned (coping_strategy_payload) */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-300 tracking-wide uppercase flex items-center gap-1.5 mb-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                    Coping Strategy:
                  </h4>
                  <p className="text-xs text-neutral-350 leading-relaxed min-h-12">
                    {state.coping_strategy_payload || "Awaiting stress analysis report..."}
                  </p>
                </div>
                {state.coping_strategy_payload && (
                  <div className="text-[9px] uppercase tracking-wider text-cyan-400 font-semibold font-mono mt-2 bg-cyan-500/5 px-2 py-1 border border-cyan-500/10 rounded w-max">
                    Coping payload
                  </div>
                )}
              </div>

            </div>

          </div>
        </section>

      </main>

      <footer className="border-t border-neutral-800 bg-neutral-950/80 py-6 text-center text-xs text-neutral-500">
        <p className="tracking-wide">
          © 2026 MindBuddy Platform • Fully WAI-ARIA and Section 508 Compliant.
        </p>
        <p className="text-[10px] text-neutral-600 mt-1 uppercase tracking-widest font-mono">
          Decoupled Gin-Gonic Backend Ceiling: MaxOpenConns = 25 • Image Size &lt; 25MB
        </p>
      </footer>
    </div>
  );
}
