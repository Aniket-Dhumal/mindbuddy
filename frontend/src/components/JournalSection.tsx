"use client";

import React, { useState } from "react";
import { useApp, ExamTarget } from "../context/AppContext";
import { BookOpen, AlertTriangle, ShieldCheck, Sparkles, Send } from "lucide-react";

export default function JournalSection() {
  const { state, triggerMockJournalAnalysis } = useApp();
  const [journalInput, setJournalText] = useState("");
  const [examTarget, setExamTarget] = useState<ExamTarget>("JEE_ADVANCED");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalInput.trim()) return;

    setIsSubmitting(true);
    triggerMockJournalAnalysis(journalInput, examTarget);

    setTimeout(() => {
      setIsSubmitting(false);
    }, 1200);
  };

  // Helper to get burnout threat levels
  const getRiskColor = (risk: number) => {
    if (risk >= 0.7) return { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", bar: "bg-rose-500", glow: "shadow-[0_0_15px_rgba(239,68,68,0.5)]" };
    if (risk >= 0.4) return { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", bar: "bg-amber-500", glow: "shadow-[0_0_15px_rgba(245,158,11,0.4)]" };
    return { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", bar: "bg-emerald-500", glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]" };
  };

  const riskMeta = getRiskColor(state.burnout_risk_index);

  return (
    <div className="flex flex-col space-y-6 rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-6 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between border-b border-neutral-800/50 pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-wide text-neutral-100">Coping & Journaling Vault</h2>
            <p className="text-xs text-neutral-400">Student ID: {state.student_id}</p>
          </div>
        </div>
        <div className="rounded-full bg-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-400 border border-indigo-500/20">
          Unstructured Parsing
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Exam selection with curved buttons */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
            Target Examination Scope
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(["JEE_ADVANCED", "NEET_UG", "CAT", "UPSC"] as ExamTarget[]).map((exam) => (
              <button
                key={exam}
                type="button"
                onClick={() => setExamTarget(exam)}
                className={`rounded-full py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border duration-200 ${
                  examTarget === exam
                    ? "bg-indigo-500 text-neutral-950 border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                    : "bg-neutral-950/80 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:bg-neutral-900"
                }`}
              >
                {exam.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-2">
          <label htmlFor="journal_entry_raw" className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
            Expressive Mind Journal (journal_entry_raw)
          </label>
          <textarea
            id="journal_entry_raw"
            name="journal_entry_raw"
            rows={4}
            value={journalInput}
            onChange={(e) => setJournalText(e.target.value)}
            placeholder="Write freely. E.g., 'I failed my mock test today. I feel so overwhelmed by the UPSC syllabus, backlogs are accumulating and I can't sleep...'"
            className="w-full rounded-xl border border-neutral-800/80 bg-neutral-950/70 p-3.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/60 transition-all font-sans leading-relaxed resize-none"
            required
          />
        </div>

        {/* Submit with curved glassy button */}
        <button
          type="submit"
          disabled={isSubmitting || !journalInput.trim()}
          className="w-full flex items-center justify-center space-x-2 rounded-full bg-indigo-500 hover:bg-indigo-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-bold py-2.5 text-xs uppercase tracking-widest transition-all duration-300 disabled:shadow-none hover:shadow-[0_0_20px_rgba(99,102,241,0.45)] cursor-pointer"
        >
          {isSubmitting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent" />
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              <span>Analyze Stress Trajectory</span>
            </>
          )}
        </button>
      </form>

      {/* Burnout Risk Index (FR-2.1/FR-2.2) */}
      <div className="border-t border-neutral-800/50 pt-5 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              burnout_risk_index (Emotional Fatigue Score)
            </span>
            <span className={`font-mono text-sm font-bold tracking-tight ${riskMeta.text}`}>
              {state.burnout_risk_index.toFixed(2)} / 1.00 ({Math.round(state.burnout_risk_index * 100)}%)
            </span>
          </div>

          {/* High-contrast ProgressBar */}
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-neutral-950 p-[3px] border border-neutral-800/60 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${riskMeta.bar} ${riskMeta.glow}`}
              style={{ width: `${state.burnout_risk_index * 100}%` }}
            />
          </div>
        </div>

        {/* Hidden Stress Triggers Badges (FR-1.3) */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2">
            Isolated Hidden Stress Triggers
          </span>

          {state.hidden_stress_triggers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {state.hidden_stress_triggers.map((trigger, idx) => (
                <div
                  key={idx}
                  className={`flex items-center space-x-1 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-300 bg-neutral-950/80 ${riskMeta.border}`}
                >
                  <AlertTriangle className={`h-3 w-3 ${riskMeta.text}`} />
                  <span>{trigger}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center space-x-2 rounded-xl border border-dashed border-neutral-800/60 bg-neutral-950/20 p-4 text-xs text-neutral-500">
              <ShieldCheck className="h-4.5 w-4.5 text-neutral-600" />
              <span>No active stress triggers isolated. Input journal entry above to parse risk variables.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
