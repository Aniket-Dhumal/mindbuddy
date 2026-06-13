"use client";

import React, { useState } from "react";
import { useApp, ExamTarget } from "../context/AppContext";
import ThreeCanvas from "../components/ThreeCanvas";
import AudioAnalyzer from "../components/AudioAnalyzer";
import { 
  Heart, 
  Sparkles, 
  Send, 
  Compass, 
  ShieldCheck, 
  User, 
  Smile, 
  Zap, 
  BookOpen,
  ArrowRight,
  HelpCircle,
  Activity
} from "lucide-react";

export default function Home() {
  const {
    state,
    isLiveConnected,
    isLiveConnecting,
    triggerMockJournalAnalysis,
    triggerMockLiveResponse,
    screenReaderMessage,
  } = useApp();

  const [journalInput, setJournalInput] = useState("");
  const [examTarget, setExamTarget] = useState<ExamTarget>("JEE_ADVANCED");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalInput.trim()) return;
    
    setIsSubmitting(true);
    triggerMockJournalAnalysis(journalInput, examTarget);
    
    // Simulate natural response transition
    setTimeout(() => {
      setIsSubmitting(false);
    }, 1200);
  };

  // Convert exam target codes to friendly, student-facing titles
  const examPills: { value: ExamTarget; label: string }[] = [
    { value: "JEE_ADVANCED", label: "JEE Main & Advanced" },
    { value: "NEET_UG", label: "NEET UG Entrance" },
    { value: "CAT", label: "CAT Management" },
    { value: "UPSC", label: "UPSC Civil Services" }
  ];

  // Mind Peace / Calm calculation (100% is maximum peace, decreases as burnout risk increases)
  const mindPeacePercent = Math.max(0, Math.min(100, Math.round((1 - state.burnout_risk_index) * 100)));

  // Friendly feedback messages based on stress/burnout scores
  const getWellnessMessage = (index: number) => {
    if (index === 0) return "Write your first entry to calibrate your wellness companion.";
    if (index >= 0.6) return "You seem to be carrying a heavy academic load right now. Let's make time to rest.";
    if (index >= 0.35) return "Your stress level is elevated. Taking a short breathing break could help clear your mind.";
    return "You are maintaining a wonderful mental balance! Keep up this mindful routine.";
  };

  return (
    <div className="min-h-screen bg-[#EEF2FF] text-slate-800 font-sans flex flex-col selection:bg-[#9F9FFF]/30 selection:text-[#6366F1]">
      {/* Hidden ARIA Screen Reader Announcement Node */}
      <div 
        id="sr-announcement-utility"
        className="sr-only" 
        role="status" 
        aria-live="polite"
        aria-atomic="true"
      >
        {screenReaderMessage}
      </div>

      {/* Cozy, student-friendly Navigation Header */}
      <header className="px-6 py-4 bg-white/40 backdrop-blur-xl border-b border-white/60 sticky top-0 z-50 shadow-sm transition-all duration-300">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#9F9FFF] to-[#E8A5FF] flex items-center justify-center shadow-md shadow-[#9F9FFF]/20">
              <Smile className="h-5.5 w-5.5 text-white stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-[#6366F1] to-[#D946EF] bg-clip-text text-transparent">
                MindBuddy
              </h1>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase font-bold">
                My Student Wellness Space
              </p>
            </div>
          </div>

          {/* Secure and friendly privacy label */}
          <div className="flex items-center gap-2.5 bg-white/70 border border-white/90 rounded-full px-4 py-1.5 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-[#10B981]" />
            <span className="text-xs font-semibold text-slate-600">
              Your Safe & Secure Space
            </span>
          </div>
        </div>
      </header>

      {/* Main Student Portal Dashboard */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Check-In Card & Daily Boosters */}
        <section className="lg:col-span-7 flex flex-col space-y-6 w-full">
          
          {/* Wellness Check-In Card with Sunset Landscape Banner */}
          <div className="rounded-3xl border border-white/80 bg-white/60 backdrop-blur-xl overflow-hidden shadow-lg transition-all duration-300">
            
            {/* Sunset Header Backdrop */}
            <div className="relative h-44 w-full overflow-hidden bg-[#9F9FFF]">
              {/* Sunset Landscape Image overlay */}
              <img 
                src="/sunset_landscape.png" 
                alt="Beautiful, calming sunset over standard mountain range illustration" 
                className="absolute inset-0 h-full w-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
              
              {/* Interactive Student Welcome overlay */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 text-white">
                <div className="bg-black/25 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#E8A5FF]" />
                  <span>Check In Account</span>
                </div>
                <span className="text-[10px] font-bold bg-white/25 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                  Ready
                </span>
              </div>

              <div className="absolute bottom-4 left-4 z-10 text-white">
                <h2 className="text-xl font-black tracking-tight drop-shadow-sm">Good Morning, Student!</h2>
                <p className="text-xs font-medium text-slate-100/90 drop-shadow-xs">How is your preparation journey treating you today?</p>
              </div>
            </div>

            {/* Check-In Form Body */}
            <form onSubmit={handleSubmitJournal} className="p-6 space-y-5">
              
              {/* Exam Target Flat Pill Selectors */}
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Target Examination Focus:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {examPills.map((pill) => {
                    const isSelected = examTarget === pill.value;
                    return (
                      <button
                        key={pill.value}
                        type="button"
                        onClick={() => setExamTarget(pill.value)}
                        className={`px-3 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 border cursor-pointer text-center ${
                          isSelected
                            ? "bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white shadow-md shadow-[#6366F1]/15 border-transparent scale-98"
                            : "bg-white/80 hover:bg-white text-slate-600 border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        {pill.label.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Journal Textarea */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="journal-input" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    My Daily Reflections:
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                    {journalInput.length} chars
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    id="journal-input"
                    value={journalInput}
                    onChange={(e) => setJournalInput(e.target.value)}
                    placeholder="Pour your thoughts out here... Talk about test scores, study fatigue, backlog concerns, or whatever is on your mind today."
                    className="w-full h-36 rounded-2xl border border-slate-100 bg-white/70 p-4 text-sm text-slate-700 leading-relaxed placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9F9FFF]/80 focus:border-transparent transition-all resize-none shadow-inner"
                    required
                  />

                  {/* Submission Bubbly Action Button with plus/heart icon overlay */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !journalInput.trim()}
                    className={`absolute bottom-3 right-3 h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer ${
                      isSubmitting || !journalInput.trim()
                        ? "bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200/50 shadow-none"
                        : "bg-gradient-to-tr from-[#6366F1] to-[#D946EF] text-white hover:shadow-indigo-500/20 hover:scale-105 active:scale-95"
                    }`}
                    aria-label={isSubmitting ? "Deeply analyzing..." : "Analyze my feelings and update recommendations"}
                  >
                    {isSubmitting ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Send className="h-4.5 w-4.5 stroke-[2.5]" />
                    )}
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed flex items-center gap-1.5 pl-1">
                  <HelpCircle className="h-3.5 w-3.5 text-[#9F9FFF] shrink-0" />
                  Your notes are parsed in secure memory instantly to deliver supportive wellness boosters.
                </p>
              </div>

            </form>
          </div>

          {/* Daily Booster Cards - Cozy peach & teal gradients */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Mindfulness Booster - GIVE A BOOST */}
            <div className="rounded-3xl border border-white/80 bg-gradient-to-br from-[#FFF5F1] to-[#FFF0F3] p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center">
                    <Heart className="h-4 w-4 fill-current stroke-[2.5]" />
                  </div>
                  <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                    Mindfulness Booster
                  </h4>
                </div>
                <h3 className="text-sm font-bold text-slate-800 leading-tight">My Breathing Practice</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {state.mindfulness_exercise_assigned || "Let's check in! Share your thoughts in your journal above to unlock a custom breathing and relaxation guide."}
                </p>
              </div>
              {state.mindfulness_exercise_assigned && (
                <div className="inline-flex items-center text-[10px] font-bold text-orange-600 bg-orange-100/60 px-2.5 py-1 rounded-lg w-max">
                  Ready to practice
                </div>
              )}
            </div>

            {/* Coping Strategy Booster - GET A BOOST */}
            <div className="rounded-3xl border border-white/80 bg-gradient-to-br from-[#EBFDF9] to-[#F0FDF4] p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-xl bg-teal-100 text-[#0D9488] flex items-center justify-center">
                    <Compass className="h-4 w-4 stroke-[2.5]" />
                  </div>
                  <h4 className="text-xs font-bold text-[#0D9488] uppercase tracking-wider">
                    Coping Guide
                  </h4>
                </div>
                <h3 className="text-sm font-bold text-slate-800 leading-tight">My Action Strategy</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {state.coping_strategy_payload || "Your gentle custom coping strategy recommendations will display here to guide you through test anxiety."}
                </p>
              </div>
              {state.coping_strategy_payload && (
                <div className="inline-flex items-center text-[10px] font-bold text-teal-700 bg-teal-100/60 px-2.5 py-1 rounded-lg w-max">
                  Unlocked Strategy
                </div>
              )}
            </div>

          </div>

        </section>

        {/* RIGHT COLUMN: Digital Companion, Voice triggers & Stress indexes */}
        <section className="lg:col-span-5 flex flex-col space-y-6 w-full">
          
          {/* Animated 3D Companion Viewport Card */}
          <div className="w-full">
            <ThreeCanvas />
          </div>

          {/* Voice Activation Panel (Audio Analyzer and Real-Time controls) */}
          <div className="rounded-3xl border border-white/80 bg-white/60 backdrop-blur-xl p-5 shadow-lg flex flex-col space-y-4 transition-all duration-300">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4.5 w-4.5 text-[#D946EF]" />
                <h3 className="text-sm font-bold tracking-tight text-slate-800">
                  Instant Voice Support
                </h3>
              </div>
              
              <div className="flex items-center space-x-1.5 text-[9px] uppercase font-bold tracking-wider">
                {isLiveConnected ? (
                  <span className="text-[#10B981] flex items-center gap-1 bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/25">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    Companion Listening
                  </span>
                ) : isLiveConnecting ? (
                  <span className="text-[#6366F1] flex items-center gap-1 bg-[#6366F1]/10 px-2 py-0.5 rounded border border-[#6366F1]/25">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#6366F1] animate-ping" />
                    Answering...
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Standby
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Need a quick cognitive break or encouraging words? Trigger one of our mindful audio pathways with your companion:
            </p>

            {/* Quick Live presets styled beautifully */}
            <div className="grid grid-cols-3 gap-2">
              <button
                id="btn-voice-breathing"
                onClick={() => triggerMockLiveResponse("breathing")}
                disabled={isLiveConnecting}
                className="rounded-xl border border-purple-100 bg-purple-50/70 hover:bg-purple-100 px-2.5 py-3 text-center text-xs font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Simulate audio breathing support"
              >
                BREATHE
              </button>
              <button
                id="btn-voice-grounding"
                onClick={() => triggerMockLiveResponse("grounding")}
                disabled={isLiveConnecting}
                className="rounded-xl border border-blue-100 bg-blue-50/70 hover:bg-blue-100 px-2.5 py-3 text-center text-xs font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Simulate sensory grounding support"
              >
                GROUND
              </button>
              <button
                id="btn-voice-encouragement"
                onClick={() => triggerMockLiveResponse("encouragement")}
                disabled={isLiveConnecting}
                className="rounded-xl border border-rose-100 bg-rose-50/70 hover:bg-rose-100 px-2.5 py-3 text-center text-xs font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Simulate encouraging talk"
              >
                ENCOURAGE
              </button>
            </div>

            {/* Real-time Web Audio Microphone Analyzer Integration */}
            <div className="border-t border-slate-100/80 pt-3">
              <AudioAnalyzer />
            </div>

          </div>

          {/* Real-Time Stress Diagnostics & CalmMeter Progress Card */}
          <div className="rounded-3xl border border-white/80 bg-white/60 backdrop-blur-xl p-5 shadow-lg flex flex-col space-y-4.5 transition-all duration-300">
            
            <div className="flex items-center space-x-2.5 pb-2.5 border-b border-slate-100">
              <div className="h-8 w-8 rounded-xl bg-violet-100 flex items-center justify-center text-[#6366F1]">
                <Activity className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">My Mental Well-Being Metrics</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mind Balance Tracker</p>
              </div>
            </div>

            {/* Burnout/Stress Index Translated as "Calm Peace Meter" */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>MY CALM LEVEL (PEACE METER):</span>
                <span className={`text-[10px] tracking-wide bg-white px-2.5 py-0.5 rounded-full shadow-xs border ${
                  mindPeacePercent < 45 ? 'text-red-500 border-red-100' : mindPeacePercent < 70 ? 'text-orange-500 border-orange-100' : 'text-emerald-500 border-emerald-100'
                }`}>
                  {mindPeacePercent}% Peace
                </span>
              </div>

              {/* Progress bar container */}
              <div className="flex items-center space-x-3">
                <div 
                  id="burnout-progress-container"
                  className="relative h-4 flex-1 overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200/50 shadow-inner"
                  role="progressbar"
                  aria-valuenow={mindPeacePercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuetext={`My Calm Peace index is at ${mindPeacePercent}%`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r ${
                      mindPeacePercent < 45 
                        ? "from-red-400 to-rose-400" 
                        : mindPeacePercent < 70 
                        ? "from-amber-400 to-orange-400" 
                        : "from-teal-400 to-emerald-400"
                    }`}
                    style={{ width: `${mindPeacePercent}%` }}
                  />
                </div>
              </div>

              {/* Friendly advice label */}
              <p className="text-xs text-slate-500 italic leading-relaxed pt-1">
                "{getWellnessMessage(state.burnout_risk_index)}"
              </p>
            </div>

            {/* Student-Friendly "Areas of Concern" instead of raw technical triggers */}
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                My Active Focus Triggers:
              </h4>
              <div className="flex flex-wrap gap-2">
                {state.hidden_stress_triggers.length === 0 ? (
                  <span className="text-xs text-slate-400 italic bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100/80">
                    Your triggers are currently clear. Keep reflectively journaling!
                  </span>
                ) : (
                  state.hidden_stress_triggers.map((trigger, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-1.5 rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-1.5 text-xs text-rose-700 font-bold"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                      <span>{trigger}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </section>

      </main>

      {/* Simplified, warm, accessible footer */}
      <footer className="bg-white/40 border-t border-white/60 py-6 text-center text-xs text-slate-400 mt-8">
        <p className="font-semibold text-slate-500">
          © 2026 MindBuddy Platform • Safe, Encouraging, Protected Space.
        </p>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">
          Created with care for student wellness
        </p>
      </footer>
    </div>
  );
}
