"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export type ExamTarget = "JEE_ADVANCED" | "NEET_UG" | "CAT" | "UPSC";

let globalMessageCounter = 0;
const generateMessageId = () => {
  globalMessageCounter++;
  return `msg-${Date.now()}-${globalMessageCounter}`;
};

export interface SystemState {
  student_id: string;
  exam_target: ExamTarget;
  journal_entry_raw: string;
  hidden_stress_triggers: string[];
  burnout_risk_index: number; // Float 0.00 to 1.00
  coping_strategy_payload: string;
  mindfulness_exercise_assigned: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "companion";
  text: string;
  timestamp: string;
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
  
  // Chat Dialogue History
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  sendChatMessage: (text: string) => Promise<void>;
  isSpeaking: boolean;
  setIsSpeaking: (val: boolean) => void;
  
  // Gemini Live state
  isLiveConnected: boolean;
  isLiveConnecting: boolean;
  setIsLiveConnected: (val: boolean) => void;
  setIsLiveConnecting: (val: boolean) => void;
  liveLogs: string[];
  addLiveLog: (log: string) => void;
  clearLiveLogs: () => void;
  connectGeminiLive: (customUrl?: string) => void;
  disconnectGeminiLive: () => void;
  
  // Accessibility Live Announcer
  screenReaderMessage: string;
  announceToScreenReader: (msg: string) => void;
  
  // Custom Voice Selection
  companionVoiceURI: string;
  setCompanionVoiceURI: (uri: string) => void;
  availableVoices: SpeechSynthesisVoice[];
  
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
  
  // Chat dialogue conversation bubbles state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "companion",
      text: "Hello there! I am your personal MindBuddy Student Wellness Twin companion. I am here to listen, encourage, and guide you through your mock exams preparation, syllabus backlogs, or study fatigue. Let me know what you are feeling, or turn on 'Talk to Companion' to speak to me!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLiveConnecting, setIsLiveConnecting] = useState(false);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  
  const [screenReaderMessage, setScreenReaderMessage] = useState("");
  
  // Custom Voice states
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [companionVoiceURI, setCompanionVoiceURI] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const uniqueVoices = allVoices.filter((v, i, self) => 
        self.findIndex(t => t.voiceURI === v.voiceURI) === i
      );
      setAvailableVoices(uniqueVoices);
      
      const defaultVoice = uniqueVoices.find(v => 
        v.name.toLowerCase().includes("natural") ||
        v.lang.includes("en-IN") || 
        v.name.toLowerCase().includes("female") || 
        v.name.toLowerCase().includes("google") ||
        v.name.toLowerCase().includes("zira") ||
        v.lang.includes("en-US")
      );
      if (defaultVoice && !companionVoiceURI) {
        setCompanionVoiceURI(defaultVoice.voiceURI);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [companionVoiceURI]);

  // Mount effect moved to the bottom of the component to prevent accessed-before-declaration hoisting rules
  
  // Voice Synthesis and Speech recognition refs
  const mockAudioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const accumulatedResponseRef = useRef<string>("");

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

  const connectGeminiLive = (customUrl?: string) => {
    if (webSocketRef.current) {
      webSocketRef.current.close();
    }

    setIsLiveConnecting(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://mindbuddy-backend-106578204542.asia-east1.run.app";
    // Construct local or remote wss proxy url
    const defaultWsUrl = apiUrl.replace(/^http/, "ws") + "/api/ws";
    const finalUrl = customUrl || defaultWsUrl;

    addLiveLog(`Handshaking secure proxy: ${finalUrl}...`);
    announceToScreenReader("Connecting to student wellness companion voice stream...");

    try {
      const ws = new WebSocket(finalUrl);
      webSocketRef.current = ws;

      ws.onopen = () => {
        setIsLiveConnecting(false);
        setIsLiveConnected(true);
        addLiveLog("Secure connection established! Sending setup handshake...");
        announceToScreenReader("Companion online and ready.");

        // Send Gemini Live Setup Configuration
        const setupMessage = {
          setup: {
            model: "models/gemini-2.0-flash-exp",
            generationConfig: {
              responseModalities: ["TEXT"]
            },
            systemInstruction: {
              parts: [
                {
                  text: "You are MindBuddy, a warm, empathetic student mental wellness companion. Help students manage exam pressure, mock tests, sleep fatigue, backlogs, and performance anxiety with gentle encouragement. Keep answers concise (1-3 sentences) and highly reassuring."
                }
              ]
            }
          }
        };
        ws.send(JSON.stringify(setupMessage));
        addLiveLog("Handshake completed. MindBuddy system instructions pushed.");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle server content stream from Gemini Live
          if (data.serverContent?.modelTurn?.parts) {
            const parts = data.serverContent.modelTurn.parts;
            let chunkText = "";
            for (const part of parts) {
              if (part.text) {
                chunkText += part.text;
              }
            }

            if (chunkText) {
              accumulatedResponseRef.current += chunkText;
              addLiveLog(`Received stream chunk: "${chunkText}"`);

              // Update the last message in chat if it's from companion and we are streaming
              setChatMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.sender === "companion" && last.id.startsWith("stream-")) {
                  return [
                    ...prev.slice(0, -1),
                    { ...last, text: accumulatedResponseRef.current }
                  ];
                } else {
                  return [
                    ...prev,
                    {
                      id: "stream-" + Date.now(),
                      sender: "companion",
                      text: accumulatedResponseRef.current,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    }
                  ];
                }
              });
            }
          }

          // Check if Gemini Live has finished its turn
          if (data.serverContent?.turnComplete) {
            const fullReply = accumulatedResponseRef.current;
            addLiveLog(`Response fully streamed. Synthesizing spoken audio.`);
            speakAndAnimateMouth(fullReply);
            accumulatedResponseRef.current = ""; // Reset accumulator for next turn
          }

          // Error payload from backend or Gemini
          if (data.error) {
            addLiveLog(`[API ERROR] ${data.error}`);
            announceToScreenReader(`Companion error: ${data.error}`);
          }
        } catch (err) {
          console.warn("Error parsing websocket message data:", err);
        }
      };

      ws.onclose = (event) => {
        setIsLiveConnected(false);
        setIsLiveConnecting(false);
        webSocketRef.current = null;
        addLiveLog(`WebSocket closed (code: ${event.code}). Returning to standby.`);
        announceToScreenReader("Companion disconnected.");
      };

      ws.onerror = (err) => {
        console.error("WebSocket error observed:", err);
        addLiveLog("WebSocket stream error occurred. Return to standby.");
        setIsLiveConnecting(false);
        setIsLiveConnected(false);
      };

    } catch (err) {
      console.error("Failed to connect websocket:", err);
      const error = err as Error;
      addLiveLog(`Failed to connect: ${error.message || "Connection error"}`);
      setIsLiveConnecting(false);
      setIsLiveConnected(false);
    }
  };

  const disconnectGeminiLive = () => {
    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }
    setIsLiveConnected(false);
    setIsLiveConnecting(false);
    addLiveLog("Disengaged companion session. Return to standby.");
  };

  // SPEECH RECOGNITION (STT) CONTROL LOOP moved to bottom of component body

  // VOICE SYNTHESIS + LIP-SYNC (TTS) ANIMATOR
  const speakAndAnimateMouth = (text: string) => {
    if (mockAudioIntervalRef.current) {
      clearInterval(mockAudioIntervalRef.current);
      mockAudioIntervalRef.current = null;
    }

    announceToScreenReader(`Companion says: ${text}`);

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      
      // Target user-selected voice or fallback comfortingly
      const selectedVoice = voices.find(v => v.voiceURI === companionVoiceURI) || voices.find(v => 
        v.lang.includes("en-IN") || 
        v.name.toLowerCase().includes("female") || 
        v.name.toLowerCase().includes("google") ||
        v.name.toLowerCase().includes("zira")
      );
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = 0.98; // Speak slightly slower to soothe student anxiety
      utterance.pitch = 1.05;

      utterance.onstart = () => {
        setIsSpeaking(true);
        addLiveLog("Companion playing synthesized spoken audio...");

        let tick = 0;
        mockAudioIntervalRef.current = setInterval(() => {
          tick++;
          // Generate wave amplitude to open/close mouth
          const baseAmp = Math.sin(tick * 0.4) * 0.35 + 0.35;
          const noise = (Math.sin(tick * 1.5) + 1) * 0.125;
          const openness = Math.max(0.05, Math.min(1.0, baseAmp + noise));

          // Introduce pause slots for realistic word-gap emulation
          if (tick % 11 < 2) {
            setMouthOpenness(0.05);
          } else {
            setMouthOpenness(parseFloat(openness.toFixed(3)));
          }
        }, 80);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setMouthOpenness(0.1);
        if (mockAudioIntervalRef.current) {
          clearInterval(mockAudioIntervalRef.current);
          mockAudioIntervalRef.current = null;
        }
        addLiveLog("Companion complete spoken response.");
      };

      utterance.onerror = (e) => {
        console.warn("Speech Synthesis error:", e);
        setIsSpeaking(false);
        setMouthOpenness(0.1);
        if (mockAudioIntervalRef.current) {
          clearInterval(mockAudioIntervalRef.current);
          mockAudioIntervalRef.current = null;
        }
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // Local fallback speech animator
      setIsSpeaking(true);
      let tick = 0;
      mockAudioIntervalRef.current = setInterval(() => {
        tick++;
        const openness = Math.sin(tick * 0.4) * 0.35 + 0.35 + ((tick % 5) / 25);
        if (tick % 10 < 2) {
          setMouthOpenness(0.05);
        } else {
          setMouthOpenness(parseFloat(openness.toFixed(3)));
        }

        if (tick > 55) {
          setIsSpeaking(false);
          setMouthOpenness(0.1);
          if (mockAudioIntervalRef.current) {
            clearInterval(mockAudioIntervalRef.current);
            mockAudioIntervalRef.current = null;
          }
        }
      }, 80);
    }
  };

  // SEND CHAT MESSAGE TO BACKEND API
  const sendChatMessage = async (text: string) => {
    if (!text.trim()) return;

    // Post User Bubble
    const userMsg: ChatMessage = {
      id: generateMessageId(),
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    announceToScreenReader(`You typed: ${text}`);

    // If WebSocket is active, send through WebSocket turn-based system
    if (isLiveConnected && webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      addLiveLog(`Piping client turn to Gemini Live WebSocket: "${text.trim()}"`);
      accumulatedResponseRef.current = ""; // Reset prior turn response

      const clientTurn = {
        clientContent: {
          turns: [
            {
              role: "user",
              parts: [
                {
                  text: text.trim()
                }
              ]
            }
          ],
          turnComplete: true
        }
      };
      webSocketRef.current.send(JSON.stringify(clientTurn));
      return;
    }

    setIsLiveConnecting(true);
    addLiveLog(`Querying chat companion for: "${text}"`);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://mindbuddy-backend-106578204542.asia-east1.run.app";
    try {
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: state.student_id,
          message: text.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP status code error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.message;

      setIsLiveConnecting(false);

      // Add Companion bubble
      const companionMsg: ChatMessage = {
        id: generateMessageId(),
        sender: "companion",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, companionMsg]);
      addLiveLog(`Companion responded: "${reply}"`);

      // Trigger spoken synthesis & synchronized lip sync
      speakAndAnimateMouth(reply);

    } catch (err) {
      console.error("API Chat call failed, falling back locally:", err);
      addLiveLog("Gemini Chat API unreachable, activating local rule-based response twin.");
      setIsLiveConnecting(false);

      const reply = GenerateChatResponseFallbackNLP(text);
      
      const companionMsg: ChatMessage = {
        id: generateMessageId(),
        sender: "companion",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, companionMsg]);
      speakAndAnimateMouth(reply);
    }
  };

  // Local fallback response generator
  const GenerateChatResponseFallbackNLP = (userMsg: string): string => {
    const msg = userMsg.toLowerCase();
    if (msg.includes("mock") || msg.includes("test") || msg.includes("score") || msg.includes("marks")) {
      return "Mock test scores are just indicators of areas to review, not a final verdict on your intelligence. Let's focus on analyzing the wrong questions calmly, without letting the numbers define your worth. You are building resilience with every try.";
    }
    if (msg.includes("sleep") || msg.includes("tired") || msg.includes("fatigue") || msg.includes("exhaust")) {
      return "Your brain consolidates all your hard study during sleep. Deferring sleep to study more is actually counterproductive. Try to wind down, turn off screens, and secure a solid sleep cycle tonight.";
    }
    if (msg.includes("backlog") || msg.includes("syllabus") || msg.includes("behind")) {
      return "A backlog can feel like a heavy mountain, but we can climb it one step at a time. Let's focus on dedicating just 30 minutes of focused effort to a single backlog topic today. Small, consistent steps build huge momentum.";
    }
    if (msg.includes("family") || msg.includes("parent") || msg.includes("pressure")) {
      return "It is tough to balance your parents' hopes with your own exam pressures. Remember that they care about your future, but your mental peace is what truly matters. We can navigate this together.";
    }
    if (msg.includes("breathe") || msg.includes("breathing") || msg.includes("anxious") || msg.includes("panic")) {
      return "Let's take a pause. Inhale deeply through your nose for a count of four... hold it... and slowly sigh it out through your mouth. You are safe, you are here, and we can handle this.";
    }
    return "I am right here with you. Your preparation journey has ups and downs, but please be gentle with yourself. What is one small, manageable thing we can focus on next?";
  };

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

      const finalRisk = Math.min(Math.max(baseRisk, 0.0), 1.0);

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
        mindfulness = "Anxiety Release: Inhale deeply and exhale with a loud sigh to physically release tension.";
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

  // Mock Preset triggers (Box Breathing, Grounding, Affirmations) mapped onto our chat logs directly
  const triggerMockLiveResponse = (presetType: string) => {
    let presetText = "Let's work together to release stress.";
    if (presetType === "breathing") {
      presetText = "Please guide me on doing some quick box breathing exercises.";
    } else if (presetType === "grounding") {
      presetText = "I need help with a grounding sensory session to stop my cognitive overthinking.";
    } else if (presetType === "encouragement") {
      presetText = "Give me some words of resilience and encouragement for my mock exams.";
    }
    
    sendChatMessage(presetText);
  };

  // Cleanup synthesis on unmount
  useEffect(() => {
    return () => {
      if (mockAudioIntervalRef.current) {
        clearInterval(mockAudioIntervalRef.current);
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // SPEECH RECOGNITION (STT) CONTROL LOOP
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as typeof window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition || (window as typeof window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (isMicActive) {
        setTimeout(() => {
          addLiveLog("Speech Recognition API is not supported on this browser fallback.");
          announceToScreenReader("Voice input is not fully supported in this browser. Please type to chat.");
          setIsMicActive(false);
        }, 0);
      }
      return;
    }

    if (isMicActive) {
      // Silence companion before speaking to prevent echoing
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setTimeout(() => {
        setIsSpeaking(false);
        setMouthOpenness(0.1);
      }, 0);

      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = "en-IN"; // Tailored for Indian English accents

      recog.onstart = () => {
        addLiveLog("Microphone is now transcribing speech...");
        announceToScreenReader("Microphone active. Speak now.");
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        addLiveLog(`Heard from user voice: "${transcript}"`);
        if (transcript.trim()) {
          sendChatMessage(transcript);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recog.onerror = (err: any) => {
        console.warn("Speech Recognition error:", err);
        addLiveLog(`Voice input standby or error: ${err.error || "no speech detected"}`);
        setIsMicActive(false);
      };

      recog.onend = () => {
        addLiveLog("Voice recognition connection closed.");
        setIsMicActive(false);
      };

      recognitionRef.current = recog;
      try {
        recog.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMicActive]);

  useEffect(() => {
    // Automatically establish the secure companion voice connection on mount
    const timer = setTimeout(() => {
      connectGeminiLive();
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        chatMessages,
        setChatMessages,
        sendChatMessage,
        isSpeaking,
        setIsSpeaking,
        isLiveConnected,
        isLiveConnecting,
        setIsLiveConnected,
        setIsLiveConnecting,
        liveLogs,
        addLiveLog,
        clearLiveLogs,
        connectGeminiLive,
        disconnectGeminiLive,
        screenReaderMessage,
        announceToScreenReader,
        companionVoiceURI,
        setCompanionVoiceURI,
        availableVoices,
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
