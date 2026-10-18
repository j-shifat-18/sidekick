'use client';

import React from 'react';
import { ArrowRight, Bot, Wrench, CheckCircle2, RotateCcw, AlertTriangle, ArrowDown, Play } from 'lucide-react';

interface GraphVisualizerProps {
  activeNode: 'idle' | 'worker' | 'tools' | 'evaluator' | 'done';
  cycle: number;
  lastFeedback?: string;
  successCriteria?: string;
}

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  activeNode,
  cycle,
  lastFeedback,
  successCriteria,
}) => {
  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-800">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>LangGraph Cyclic Architecture</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono border border-indigo-200 font-semibold">
              Evaluator-Optimizer Loop
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Self-correcting state graph with tool execution, reflection, and human-in-the-loop triggers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono">
            <span className="text-slate-600">Current Cycle:</span>
            <span className="text-amber-700 font-bold">{cycle}</span>
          </div>
        </div>
      </div>

      {/* Visual Workflow Canvas */}
      <div className="relative flex flex-col items-center justify-center py-8 px-4 bg-slate-50/70 rounded-xl border border-slate-200">
        <div className="w-full max-w-2xl flex flex-col gap-7 relative z-10">
          {/* Level 1: START */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-300 text-xs font-semibold text-slate-700 shadow-sm">
              <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span>START / USER PROMPT</span>
            </div>
          </div>

          <div className="flex justify-center -my-3">
            <ArrowDown className="w-4 h-4 text-slate-400" />
          </div>

          {/* Level 2: WORKER NODE */}
          <div className="flex justify-center">
            <div
              className={`w-80 p-4 rounded-xl transition-all duration-200 ${
                activeNode === 'worker'
                  ? 'bg-indigo-50 border-2 border-indigo-600 shadow-md'
                  : 'bg-white border border-slate-200 shadow-sm text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${activeNode === 'worker' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-indigo-600'}`}>
                    <Bot className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-slate-900">Worker Node</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">gpt-4o-mini</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Interprets goal, synthesizes thoughts, plans actions, and decides whether to invoke tools or finalize response.
              </p>
            </div>
          </div>

          {/* Branch Router */}
          <div className="grid grid-cols-2 gap-8 items-center text-center">
            {/* Left Branch: Tools */}
            <div className="flex flex-col items-center gap-3">
              <div className="text-[11px] font-mono text-slate-600 flex items-center gap-1 bg-white px-2.5 py-0.5 rounded border border-slate-200 shadow-sm">
                <span>has tool_calls?</span>
                <span className="text-emerald-700 font-bold">YES</span>
              </div>

              <div
                className={`w-full p-4 rounded-xl transition-all duration-200 ${
                  activeNode === 'tools'
                    ? 'bg-sky-50 border-2 border-sky-600 shadow-md'
                    : 'bg-white border border-slate-200 shadow-sm text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${activeNode === 'tools' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-sky-600'}`}>
                      <Wrench className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-900">ToolNode</span>
                  </div>
                  <span className="text-[10px] font-mono text-sky-700 font-semibold">Tool Suite</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['Playwright', 'Google Serper', 'Python REPL', 'File Sandbox', 'Wikipedia', 'Pushover'].map((tool) => (
                    <span key={tool} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-xs text-indigo-700 flex items-center gap-1 font-medium">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Feeds tool observations back to Worker</span>
              </div>
            </div>

            {/* Right Branch: Evaluator */}
            <div className="flex flex-col items-center gap-3">
              <div className="text-[11px] font-mono text-slate-600 flex items-center gap-1 bg-white px-2.5 py-0.5 rounded border border-slate-200 shadow-sm">
                <span>has tool_calls?</span>
                <span className="text-purple-700 font-bold">NO (Drafted)</span>
              </div>

              <div
                className={`w-full p-4 rounded-xl transition-all duration-200 ${
                  activeNode === 'evaluator'
                    ? 'bg-purple-50 border-2 border-purple-600 shadow-md'
                    : 'bg-white border border-slate-200 shadow-sm text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${activeNode === 'evaluator' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-purple-600'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-900">Evaluator Node</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-700 font-semibold">Structured Output</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed text-left">
                  Critiques the answer against success criteria. Emits structured verdict: criteria met or user input needed.
                </p>
              </div>

              <div className="text-xs text-purple-700 flex items-center gap-1 font-medium">
                <span>Criteria met? ➜ END | Rejection ➜ Worker loop</span>
              </div>
            </div>
          </div>

          {/* Level 3: Evaluator Decision Outcomes */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-left">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 mb-1">
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Rejection Feedback Loop</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Evaluator feedback is injected into Worker prompt. Worker initiates Cycle {cycle + 1} to self-correct.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-left">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Pass / Human-in-the-Loop</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Terminates at END node if criteria pass or if agent explicitly pauses to request human clarification.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Success Criteria & Feedback Cards */}
      {(successCriteria || lastFeedback) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {successCriteria && (
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-700 font-semibold block mb-1">
                Target Success Criteria
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">{successCriteria}</p>
            </div>
          )}

          {lastFeedback && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-900 font-semibold block mb-1">
                Latest Evaluator Critique
              </span>
              <p className="text-xs text-amber-800 leading-relaxed">{lastFeedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
