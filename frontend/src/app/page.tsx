"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Activity,
  MessageSquare,
  Terminal,
  Wifi,
  AlertTriangle,
  ListChecks,
  Lock,
  RefreshCw,
  Award
} from "lucide-react";

export default function Home() {
  const {
    state,
    isLiveConnected,
    isLiveConnecting,
    triggerMockJournalAnalysis,
    triggerMockLiveResponse,
    screenReaderMessage,
    chatMessages,
    sendChatMessage,
    isSpeaking,
    connectGeminiLive,
    disconnectGeminiLive
  } = useApp();

  const [activeTab, setActiveTab] = useState<"chat" | "reflect" | "guidance">("chat");
  const [journalInput, setJournalInput] = useState("");
  const [examTarget, setExamTarget] = useState<ExamTarget>("JEE_ADVANCED");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatInput, setChatInput] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat history to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleSubmitJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalInput.trim()) return;
    
    setIsSubmitting(true);
    await triggerMockJournalAnalysis(journalInput, examTarget);
    setIsSubmitting(false);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput("");
  };

  const handleToggleVoiceSession = () => {
    if (isLiveConnected) {
      disconnectGeminiLive();
    } else {
      connectGeminiLive();
    }
  };

  // Convert exam target codes to friendly student titles
  const examPills: { value: ExamTarget; label: string }[] = [
    { value: "JEE_ADVANCED", label: "JEE Advanced" },
    { value: "NEET_UG", label: "NEET UG" },
    { value: "CAT", label: "CAT Exam" },
    { value: "UPSC", label: "UPSC Civil" }
  ];

  // Mind Peace Level / Calm meter calculation (decreases as stress burnout risk increases)
  const mindPeacePercent = Math.max(0, Math.min(100, Math.round((1 - state.burnout_risk_index) * 100)));

  // Friendly feedback suggestions based on stress index
  const getWellnessMessage = (index: number) => {
    if (index === 0) return "Write your first entry in the Reflective Vault to nurture your Calm Meter.";
    if (index >= 0.6) return "You seem to be carrying a heavy academic load right now. Let's make time to rest.";
    if (index >= 0.35) return "Your stress level is elevated. Taking a short breathing break could help clear your mind.";
    return "You are maintaining a wonderful mental balance! Keep up this mindful routine.";
  };

  // Status style helpers
  const getStatusText = () => {
    if (isLiveConnecting) return "Connecting...";
    if (isLiveConnected) return "Companion Online";
    return "Offline";
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/15 via-neutral-950 to-neutral-950 text-neutral-100 font-sans flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-hidden">
      {/* Calm ambient background glowing elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-pink-500/5 blur-[120px] pointer-events-none" />
      {/* Dynamic WAI-ARIA Screen Reader Announcements */}
      <div 
        id="sr-announcement-utility"
        className="sr-only" 
        role="status" 
        aria-live="polite"
        aria-atomic="true"
      >
        {screenReaderMessage}
      </div>

      {/* Top Glassmorphic Premium Navbar */}
      <header className="px-6 py-4 bg-neutral-900/40 backdrop-blur-2xl border-b border-neutral-900 sticky top-0 z-50 shadow-2xl transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Smile className="h-5.5 w-5.5 text-neutral-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                MindBuddy
              </h1>
              <p className="text-[10px] text-neutral-400 tracking-wider uppercase font-bold">
                Student Wellness Companion
              </p>
            </div>
          </div>

          {/* Secure privacy tag & Live status pill */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-neutral-900/60 border border-neutral-800 rounded-full px-4 py-1.5 shadow-inner">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-neutral-300">
                Your Safe & Secure Space
              </span>
            </div>

            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
              isLiveConnected 
                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" 
                : isLiveConnecting 
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse" 
                : "bg-neutral-900 text-neutral-400 border-neutral-800"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                isLiveConnected ? "bg-cyan-400 animate-ping" : isLiveConnecting ? "bg-amber-400 animate-ping" : "bg-neutral-500"
              }`} />
              <span>{getStatusText()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Single-Screen Responsive Layout Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* LEFT COLUMN: Holographic Digital Companion Hub (Floating controls) */}
        <section aria-label="Digital Companion Hub" className="lg:col-span-5 flex flex-col space-y-6 justify-between">
          <div className="space-y-6">
            {/* Holographic 3D Avatar Viewport */}
            <ThreeCanvas />

            {/* Live Audio Calibration & Microphone Waveform Panel */}
            <AudioAnalyzer />
          </div>

          <div className="hidden lg:block text-center text-xs text-neutral-400 px-4">
            <Lock className="h-3.5 w-3.5 inline mr-1.5 text-neutral-600 align-text-bottom" />
            Empathetic encryption active. All session variables reside in secure system memory.
          </div>
        </section>

        {/* RIGHT COLUMN: Interactive Tabbed Workspace Panel */}
        <section aria-label="Interactive Tabbed Workspace Panel" className="lg:col-span-7 flex flex-col space-y-4 rounded-3xl border border-neutral-800/80 bg-neutral-900/20 backdrop-blur-2xl p-4 sm:p-6 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)]">
          <h2 className="sr-only">Workspace Panels</h2>
          
          {/* Stunning Tab Selector Navbar */}
          <div className="flex border-b border-neutral-800/60 pb-3 justify-between items-center gap-2 overflow-x-auto scrollbar-none">
            <div role="tablist" aria-label="Workspace tabs" className="flex space-x-1.5 font-sans">
              <button
                id="tab-selector-chat"
                role="tab"
                aria-selected={activeTab === "chat"}
                onClick={() => setActiveTab("chat")}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-extrabold tracking-wide uppercase transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
                  activeTab === "chat"
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 shadow-lg shadow-indigo-500/5"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat Companion</span>
              </button>

              <button
                id="tab-selector-reflect"
                role="tab"
                aria-selected={activeTab === "reflect"}
                onClick={() => setActiveTab("reflect")}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-extrabold tracking-wide uppercase transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 ${
                  activeTab === "reflect"
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/25 shadow-lg shadow-purple-500/5"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Reflective Vault</span>
              </button>

              <button
                id="tab-selector-guidance"
                role="tab"
                aria-selected={activeTab === "guidance"}
                onClick={() => setActiveTab("guidance")}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-extrabold tracking-wide uppercase transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                  activeTab === "guidance"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-lg shadow-emerald-500/5"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
                }`}
              >
                <Compass className="h-4 w-4" />
                <span>Clinical Guidance</span>
              </button>
            </div>

            {/* Premium, Friendly Voice Session Connection Pill */}
            <button
              id="toggle-voice-session-button"
              onClick={handleToggleVoiceSession}
              disabled={isLiveConnecting}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
                isLiveConnected
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20"
                  : isLiveConnecting
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                  : "bg-neutral-950 text-neutral-400 border-neutral-900 hover:text-neutral-200 hover:bg-neutral-900"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${
                isLiveConnected ? "bg-cyan-400 animate-ping" : isLiveConnecting ? "bg-amber-400 animate-ping" : "bg-neutral-500"
              }`} />
              <span>
                {isLiveConnected ? "Voice Companion Connected" : isLiveConnecting ? "Connecting..." : "Enable Voice Session"}
              </span>
            </button>
          </div>

          {/* TAB CONTENT: Chat Companion Viewport */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col justify-between h-[450px] min-h-[400px]">
              
              {/* Message Dialogue logs list */}
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col space-y-4 scrollbar-thin max-h-[350px]">
                {chatMessages.map((msg) => {
                  const isUser = msg.sender === "user";
                  const isStreaming = msg.id.startsWith("stream-");
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && (
                        <div className="h-7 w-7 rounded-full overflow-hidden bg-neutral-900 shrink-0 border border-neutral-800">
                          <img
                            src="/women_wellness_coach.png"
                            alt="Companion Representative Avatar"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-md ${
                          isUser
                            ? "bg-gradient-to-tr from-indigo-600 to-purple-600 text-neutral-100 rounded-br-none border border-indigo-500/20 shadow-indigo-650/5"
                            : "bg-neutral-900/60 border border-neutral-800/80 text-neutral-200 rounded-bl-none shadow-black/20"
                        }`}
                      >
                        <p className="whitespace-pre-line select-text">{msg.text}</p>
                        
                        <div className="flex items-center justify-end gap-1.5 mt-1.5">
                          {isStreaming && (
                            <span className="flex h-1.5 w-1.5 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
                            </span>
                          )}
                          <span className={`block text-[8px] font-semibold uppercase tracking-wider text-neutral-400`}>
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Presets and Chat Inputs Box */}
              <div className="border-t border-neutral-900 pt-3.5 space-y-4">
                
                {/* Instant supportive presets chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mr-1">Presets:</span>
                  <button
                    id="preset-breathe-button"
                    onClick={() => triggerMockLiveResponse("breathing")}
                    disabled={isLiveConnecting}
                    className="rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/30 px-3 py-1.5 text-center text-[10px] font-bold tracking-wide uppercase transition-all duration-200 hover:scale-102 active:scale-95 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                  >
                    Breathe Guide
                  </button>
                  <button
                    id="preset-grounding-button"
                    onClick={() => triggerMockLiveResponse("grounding")}
                    disabled={isLiveConnecting}
                    className="rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 hover:border-purple-500/30 px-3 py-1.5 text-center text-[10px] font-bold tracking-wide uppercase transition-all duration-200 hover:scale-102 active:scale-95 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
                  >
                    Grounding Sensory
                  </button>
                  <button
                    id="preset-encouragement-button"
                    onClick={() => triggerMockLiveResponse("encouragement")}
                    disabled={isLiveConnecting}
                    className="rounded-full bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/20 hover:border-pink-500/30 px-3 py-1.5 text-center text-[10px] font-bold tracking-wide uppercase transition-all duration-200 hover:scale-102 active:scale-95 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50"
                  >
                    Encourage Talk
                  </button>
                </div>

                {/* Input messaging field */}
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <label htmlFor="chat-input" className="sr-only">Type message to Wellness Twin</label>
                  <input
                    id="chat-input"
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your worries, backlogs, or mock exam stress..."
                    disabled={isLiveConnecting}
                    className="flex-1 rounded-2xl border border-neutral-800 bg-neutral-950/80 px-4 py-3 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-sans leading-relaxed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                    required
                  />
                  <button
                    id="chat-send-button"
                    type="submit"
                    disabled={isLiveConnecting || !chatInput.trim()}
                    className={`h-10 w-11 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
                      isLiveConnecting || !chatInput.trim()
                        ? "bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-neutral-950 hover:shadow-indigo-500/10 hover:scale-105 active:scale-95 cursor-pointer font-bold"
                    }`}
                    aria-label="Send message to Wellness Twin"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB CONTENT: Reflective Journal Vault */}
          {activeTab === "reflect" && (
            <div className="flex-1 flex flex-col justify-between h-[450px] min-h-[400px]">
              <form onSubmit={handleSubmitJournal} className="space-y-4 flex-1 overflow-y-auto pr-1">
                
                {/* Flat Pill Selector */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                    Target Examination Focus
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {examPills.map((pill) => {
                      const isSelected = examTarget === pill.value;
                      return (
                        <button
                          key={pill.value}
                          id={`exam-target-pill-${pill.value.toLowerCase().replace('_', '-')}`}
                          type="button"
                          onClick={() => setExamTarget(pill.value)}
                          className={`rounded-2xl py-2.5 text-[10px] font-extrabold uppercase tracking-wider transition-all border duration-300 text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 ${
                            isSelected
                              ? "bg-purple-500 text-neutral-950 border-purple-400 shadow-md shadow-purple-500/15 scale-98 font-black"
                              : "bg-neutral-950/80 text-neutral-400 border-neutral-800/80 hover:text-neutral-200 hover:bg-neutral-900"
                          }`}
                        >
                          {pill.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Journal entry area */}
                <div className="flex flex-col space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="journal-input" className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                      My Expressive Reflection Diary
                    </label>
                    <span className="text-[9px] text-purple-400 font-bold bg-purple-500/10 border border-purple-500/15 px-2.5 py-0.5 rounded-full">
                      {journalInput.length} characters
                    </span>
                  </div>

                  <div className="relative">
                    <textarea
                      id="journal-input"
                      value={journalInput}
                      onChange={(e) => setJournalInput(e.target.value)}
                      placeholder="Write freely. E.g., 'I failed my JEE mock test today and scored only 40%. The backlog of organic chemistry is mounting, I feel completely overwhelmed and unable to fall asleep. My parents have huge hopes and the pressure is paralyzing...'"
                      className="w-full h-32 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 text-xs text-neutral-200 leading-relaxed placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all resize-none shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
                      required
                    />

                    {/* Subtle submit indicator inside textarea */}
                    <button
                      id="journal-submit-button"
                      type="submit"
                      disabled={isSubmitting || !journalInput.trim()}
                      className={`absolute bottom-3 right-3 h-10 w-10 rounded-xl flex items-center justify-center shadow-md transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 ${
                        isSubmitting || !journalInput.trim()
                          ? "bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed shadow-none"
                          : "bg-gradient-to-tr from-purple-500 to-pink-500 text-neutral-950 hover:shadow-purple-500/10 hover:scale-105 active:scale-95"
                      }`}
                      aria-label={isSubmitting ? "Running clinical stress parse..." : "Submit to emotion index"}
                    >
                      {isSubmitting ? (
                        <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
 
                  <p className="text-[9px] text-neutral-400 pl-1 leading-relaxed flex items-center gap-1">
                    <HelpCircle className="h-3 w-3 inline text-purple-500 shrink-0" />
                    Unstructured text is parsed immediately to isolate academic stress triggers. No records are compiled on external caches.
                  </p>
                </div>

              </form>

              {/* Stress Diagnostics Progress Output */}
              <div className="border-t border-neutral-900 pt-3.5 space-y-4">
                
                {/* Burnout risk index as beautiful Peace meter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-extrabold text-neutral-400">
                    <span>YOUR INNER PEACE METER:</span>
                    <span className={`text-[10px] font-extrabold tracking-wide px-2.5 py-0.5 rounded-full border ${
                      mindPeacePercent < 45 
                        ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' 
                        : mindPeacePercent < 70 
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
                        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    }`}>
                      {mindPeacePercent}% Tranquil
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div 
                      className="relative h-4 flex-1 overflow-hidden rounded-full bg-neutral-950 p-[3px] border border-neutral-900 shadow-inner"
                      role="progressbar"
                      aria-valuenow={mindPeacePercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${
                          mindPeacePercent < 45 
                            ? "from-rose-500 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" 
                            : mindPeacePercent < 70 
                            ? "from-amber-500 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]" 
                            : "from-emerald-500 to-teal-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                        }`}
                        style={{ width: `${mindPeacePercent}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-400 italic font-medium leading-relaxed pt-0.5">
                    "{getWellnessMessage(state.burnout_risk_index)}"
                  </p>
                </div>

                {/* Academic triggers isolated badges */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    Focus Areas of Care:
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {state.hidden_stress_triggers.length === 0 ? (
                      <span className="text-[10px] text-neutral-400 italic bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-900">
                        No active stress triggers isolated. Complete a journal entry above to calibrate!
                      </span>
                    ) : (
                      state.hidden_stress_triggers.map((trigger, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-1.5 rounded-full border border-rose-500/20 bg-rose-500/5 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-rose-300"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                          <span>{trigger}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB CONTENT: Clinical Guidance */}
          {activeTab === "guidance" && (
            <div className="flex-1 flex flex-col justify-between h-[450px] min-h-[400px]">
              
              {/* Coping & Mindfulness payload blocks */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                
                {/* Coping Strategy Box */}
                <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/40 p-4 space-y-2 transition-all hover:border-emerald-500/30 duration-300 shadow-lg">
                  <div className="flex items-center space-x-2 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                    <Compass className="h-4 w-4" />
                    <span>Your Calming Strategy</span>
                  </div>
                  <p className="text-xs text-neutral-200 leading-relaxed font-medium min-h-[45px]">
                    {state.coping_strategy_payload || (
                      <span className="text-neutral-500 italic font-normal">
                        Your personalized calming tips and cozy study reminders will appear here once you write in your journal.
                      </span>
                    )}
                  </p>
                </div>

                {/* Mindfulness assigned Box */}
                <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/40 p-4 space-y-2 transition-all hover:border-indigo-500/30 duration-300 shadow-lg">
                  <div className="flex items-center space-x-2 text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
                    <Heart className="h-4 w-4" />
                    <span>Recommended Mindfulness Reflection</span>
                  </div>
                  <p className="text-xs text-neutral-200 leading-relaxed font-medium min-h-[45px]">
                    {state.mindfulness_exercise_assigned || (
                      <span className="text-neutral-500 italic font-normal">
                        A cozy mindfulness relaxation practice will be selected for you once your stress triggers are understood.
                      </span>
                    )}
                  </p>
                </div>

              </div>

              {/* Tactical Study Decompressors footer grid */}
              <div className="border-t border-neutral-900 pt-3.5 space-y-2.5">
                <div className="flex items-center space-x-2 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                  <ListChecks className="h-4 w-4 text-purple-400" />
                  <span>Mindful Study Tips:</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-400">
                  <div className="flex items-start space-x-2 bg-neutral-950/40 p-2 rounded-xl border border-neutral-900">
                    <span className="text-purple-400 font-bold shrink-0">•</span>
                    <span><strong>Hydration Cycles:</strong> Keep water on your desk. Proper hydration helps maintain strong focus.</span>
                  </div>
                  <div className="flex items-start space-x-2 bg-neutral-950/40 p-2 rounded-xl border border-neutral-900">
                    <span className="text-purple-400 font-bold shrink-0">•</span>
                    <span><strong>Ease Study Load:</strong> Divide complex topics into cozy 20-minute daily review sessions.</span>
                  </div>
                  <div className="flex items-start space-x-2 bg-neutral-950/40 p-2 rounded-xl border border-neutral-900">
                    <span className="text-purple-400 font-bold shrink-0">•</span>
                    <span><strong>Restful Sleep:</strong> Getting regular, restful sleep helps your brain process and remember what you learned.</span>
                  </div>
                  <div className="flex items-start space-x-2 bg-neutral-950/40 p-2 rounded-xl border border-neutral-900">
                    <span className="text-purple-400 font-bold shrink-0">•</span>
                    <span><strong>Mindful Breaks:</strong> Take a few minutes every hour to completely relax and step away from your books.</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </section>

      </main>

      {/* Simplified, Warm, Accessible Dark Footer */}
      <footer className="bg-neutral-950/40 border-t border-neutral-900 py-6 text-center text-xs text-neutral-400 mt-8">
        <p className="font-semibold text-neutral-400">
          © 2026 MindBuddy Platform • Safe, Encouraging, Protected Space.
        </p>
        <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-widest">
          Created with care for student wellness
        </p>
      </footer>
    </div>
  );
}
