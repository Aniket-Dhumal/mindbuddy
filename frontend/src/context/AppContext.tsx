"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export type ExamTarget = "JEE_ADVANCED" | "NEET_UG" | "CAT" | "UPSC";

export interface SystemState {
  student_id: string;
  exam_target: ExamTarget;
  journal_entry_raw: string;
  hidden_stress_triggers: string[];
  burnout_risk_index: number; // Float 0.00 to 1.00
  coping_strategy_payload: string;
  mindfulness_exercise_assigned: string;
}

interface AppContextType {
  // MindBuddy State
  state: SystemState;
  setState: React.Dispatch<React.SetStateAction<SystemState>>;
  
  // Real-time Audio
  mouthOpenness: number;
  setMouthOpenness: (val: number) => void;
  isMicActive: boolean;
  setIsMicActive: (val: boolean) => void;
  
  // Gemini Live state
  isLiveConnected: boolean;
  isLiveConnecting: boolean;
  setIsLiveConnected: (val: boolean) => void;
  setIsLiveConnecting: (val: boolean) => void;
  liveLogs: string[];
  addLiveLog: (log: string) => void;
  clearLiveLogs: () => void;
  
  // Accessibility Live Announcer
  screenReaderMessage: string;
  announceToScreenReader: (msg: string) => void;
  
  // Simulation Helpers
  triggerMockJournalAnalysis: (journalText: string, exam: ExamTarget) => Promise<void>;
  triggerMockLiveResponse: (presetType: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SystemState>({
    student_id: "STU-9824-MIND",
    exam_target: "JEE_ADVANCED",
    journal_entry_raw: "",
    hidden_stress_triggers: [],
    burnout_risk_index: 0.0,
    coping_strategy_payload: "",
    mindfulness_exercise_assigned: "",
  });

  const [mouthOpenness, setMouthOpenness] = useState(0.1);
  const [isMicActive, setIsMicActive] = useState(false);
  
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLiveConnecting, setIsLiveConnecting] = useState(false);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  
  const [screenReaderMessage, setScreenReaderMessage] = useState("");
  
  // Audio playback and synthesis variables for mock talking
  const mockAudioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const announceToScreenReader = (msg: string) => {
    setScreenReaderMessage(msg);
    // Clear after a short delay so the same message can be read again if needed
    setTimeout(() => {
      setScreenReaderMessage("");
    }, 3000);
  };

  const addLiveLog = (log: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLiveLogs((prev) => [`[${timestamp}] ${log}`, ...prev.slice(0, 49)]);
  };

  const clearLiveLogs = () => setLiveLogs([]);

  // Mock/Actual Journal Analyzer
  const triggerMockJournalAnalysis = async (journalText: string, exam: ExamTarget): Promise<void> => {
    addLiveLog(`Parsing journal entry for ${exam}...`);
    announceToScreenReader(`Parsing journal entry. Please wait.`);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://mindbuddy-backend-106578204542.asia-east1.run.app";
    try {
      const response = await fetch(`${apiUrl}/api/journal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: state.student_id,
          exam_target: exam,
          journal_entry_raw: journalText,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setState((prev) => ({
        ...prev,
        journal_entry_raw: data.journal_entry_raw || journalText,
        exam_target: data.exam_target || exam,
        hidden_stress_triggers: data.hidden_stress_triggers || [],
        burnout_risk_index: typeof data.burnout_risk_index === "number" ? data.burnout_risk_index : 0.0,
        coping_strategy_payload: data.coping_strategy_payload || "",
        mindfulness_exercise_assigned: data.mindfulness_exercise_assigned || "",
      }));

      const finalRisk = typeof data.burnout_risk_index === "number" ? data.burnout_risk_index : 0.0;
      const triggers = data.hidden_stress_triggers || [];
      addLiveLog(`Analysis complete. Risk Index: ${finalRisk.toFixed(2)}. Triggers: ${triggers.join(", ")}`);
      announceToScreenReader(
        `Analysis complete. Burnout risk is ${(finalRisk * 100).toFixed(0)} percent. Found ${triggers.length} stress triggers.`
      );
    } catch (err) {
      console.error("Failed to fetch from backend API, falling back to local edge analyzer:", err);
      addLiveLog(`Backend API unreachable. Running local edge fallback...`);

      // Simple keyword extraction for realistic mock triggers and stress index
      const lowerText = journalText.toLowerCase();
      const triggers: string[] = [];
      let baseRisk = 0.15;

      if (lowerText.includes("mock test") || lowerText.includes("exam") || lowerText.includes("test")) {
        triggers.push("Mock Test Score Volatility");
        baseRisk += 0.20;
      }
      if (lowerText.includes("sleep") || lowerText.includes("tired") || lowerText.includes("exhausted")) {
        triggers.push("Sleep Deprivation Fatigue");
        baseRisk += 0.25;
      }
      if (lowerText.includes("family") || lowerText.includes("parent") || lowerText.includes("pressure")) {
        triggers.push("Interpersonal Performance Pressure");
        baseRisk += 0.15;
      }
      if (lowerText.includes("forget") || lowerText.includes("remember") || lowerText.includes("syllabus")) {
        triggers.push("Syllabus Overwhelm & Cognitive Overload");
        baseRisk += 0.20;
      }
      if (lowerText.includes("backlog") || lowerText.includes("behind") || lowerText.includes("time")) {
        triggers.push("Backlog Accumulation Anxiety");
        baseRisk += 0.15;
      }

      if (triggers.length === 0 && journalText.trim().length > 0) {
        triggers.push("General Academic Apprehension");
        baseRisk += 0.10;
      }

      // Ensure the index stays within [0.0, 1.0]
      const finalRisk = Math.min(Math.max(baseRisk, 0.0), 1.0);

      // Determine strategy & mindfulness exercise based on triggers
      let strategy = "Take small structured 5-minute Pomodoro breaks every 45 minutes to refresh cognitive focus.";
      let mindfulness = "Box Breathing Exercise: Inhale 4s, Hold 4s, Exhale 4s, Hold 4s. Repeat 5 times.";

      if (finalRisk > 0.6) {
        strategy = "High Burnout Risk Detected. Prioritize an immediate 8-hour sleep cycle, defer minor tasks, and practice grounding.";
        mindfulness = "5-4-3-2-1 Grounding Technique: Identify 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.";
      } else if (triggers.includes("Sleep Deprivation Fatigue")) {
        strategy = "Incorporate a 20-minute power nap before 4 PM. Avoid caffeine after 2 PM to reset circadian rhythms.";
        mindfulness = "Body Scan Meditation: Focus awareness on releasing tension starting from toes up to the scalp.";
      } else if (triggers.includes("Mock Test Score Volatility")) {
        strategy = "Review only the wrong answers today. Avoid taking another full-length test within the next 36 hours.";
        mindfulness = "Anxiety Release: Inhale deeply and exhale with a loud sigh to physically release neck and shoulder tension.";
      }

      setState((prev) => ({
        ...prev,
        journal_entry_raw: journalText,
        exam_target: exam,
        hidden_stress_triggers: triggers,
        burnout_risk_index: parseFloat(finalRisk.toFixed(2)),
        coping_strategy_payload: strategy,
        mindfulness_exercise_assigned: mindfulness,
      }));

      addLiveLog(`Edge analysis complete. Risk Index: ${finalRisk.toFixed(2)}. Triggers: ${triggers.join(", ")}`);
      announceToScreenReader(
        `Edge analysis complete. Burnout risk is ${(finalRisk * 100).toFixed(0)} percent. Found ${triggers.length} stress triggers.`
      );
    }
  };

  // Mock Avatar Lip-Sync speech player
  const triggerMockLiveResponse = (presetType: string) => {
    // Clear any existing intervals
    if (mockAudioIntervalRef.current) {
      clearInterval(mockAudioIntervalRef.current);
    }

    setIsLiveConnecting(true);
    addLiveLog(`Establishing WebSocket connection to Gemini Live...`);
    announceToScreenReader(`Connecting to Gemini Live...`);

    setTimeout(() => {
      setIsLiveConnecting(false);
      setIsLiveConnected(true);
      addLiveLog(`Connected to Gemini Live WebSocket endpoint (wss://api.gemini.live/v1)`);
      announceToScreenReader(`Connected to Gemini Live. Digital Companion is listening.`);

      // Send therapeutic response payload after connection
      setTimeout(() => {
        let textResponse = "";
        let strategy = "";
        let exercise = "";

        switch (presetType) {
          case "breathing":
            textResponse = "Hello. Let's practice box breathing together. Inhale deeply, count to four... hold... and gently exhale.";
            strategy = "Calm autonomic nervous system through active parasympathetic activation.";
            exercise = "Box Breathing (4-4-4-4 Technique)";
            break;
          case "grounding":
            textResponse = "I hear your stress. Look around you right now. Can you name three physical objects you can touch? Focus on their texture.";
            strategy = "Interrupt spiraling anxiety by anchoring cognitive focus into physical space.";
            exercise = "5-4-3-2-1 Sensory Grounding";
            break;
          case "encouragement":
            textResponse = "You have prepared intensely for this exam. One single test does not define your capabilities. You are resilient, and we will take this step by step.";
            strategy = "Reduce cognitive distortions and imposter syndrome using affirming self-compassion.";
            exercise = "Affirmative Self-Compassion Mindset Practice";
            break;
          default:
            textResponse = "I am your digital companion. I am here to help you navigate through academic stress. Let me know what you are feeling.";
            strategy = "Build cognitive awareness of current academic stressors.";
            exercise = "Open Expressive Reflection Session";
            break;
        }

        setState((prev) => ({
          ...prev,
          coping_strategy_payload: strategy,
          mindfulness_exercise_assigned: exercise,
        }));

        addLiveLog(`Received Gemini Live response: "${textResponse}"`);
        announceToScreenReader(`Companion replies: ${textResponse}`);

        // Animate mouth with simulated speech decibel fluctuation
        let tick = 0;
        mockAudioIntervalRef.current = setInterval(() => {
          tick++;
          // Generate realistic speech amplitude variance
          const baseAmp = Math.sin(tick * 0.5) * 0.5 + 0.5;
          const noise = Math.random() * 0.4;
          const spokenVal = baseAmp * 0.6 + noise * 0.4;
          
          // Add some pauses in speech
          if (tick % 12 < 3) {
            setMouthOpenness(0.05); // Quiet/closed mouth
          } else {
            setMouthOpenness(parseFloat(spokenVal.toFixed(3)));
          }

          if (tick > 60) {
            // Speech finishes
            if (mockAudioIntervalRef.current) {
              clearInterval(mockAudioIntervalRef.current);
            }
            setMouthOpenness(0.1);
            addLiveLog(`Finished playing Gemini Live audio stream`);
          }
        }, 80);

      }, 1500);

    }, 1000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mockAudioIntervalRef.current) {
        clearInterval(mockAudioIntervalRef.current);
      }
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        setState,
        mouthOpenness,
        setMouthOpenness,
        isMicActive,
        setIsMicActive,
        isLiveConnected,
        isLiveConnecting,
        setIsLiveConnected,
        setIsLiveConnecting,
        liveLogs,
        addLiveLog,
        clearLiveLogs,
        screenReaderMessage,
        announceToScreenReader,
        triggerMockJournalAnalysis,
        triggerMockLiveResponse,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
