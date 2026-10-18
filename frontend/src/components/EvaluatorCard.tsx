'use client';

import React from 'react';
import { CheckCircle2, RotateCcw, AlertCircle, HelpCircle } from 'lucide-react';
import { EvaluatorReview } from '@/types/agent';

interface EvaluatorCardProps {
  evaluator: EvaluatorReview;
}

export const EvaluatorCard: React.FC<EvaluatorCardProps> = ({ evaluator }) => {
  const isPassed = evaluator.success_criteria_met;
  const isQuestion = evaluator.user_input_needed;

  return (
    <div
      className={`flex flex-col p-4 rounded-xl border my-3 transition-all ${
        isPassed
          ? 'bg-emerald-50/70 border-emerald-300 text-slate-800'
          : isQuestion
          ? 'bg-sky-50/70 border-sky-300 text-slate-800'
          : 'bg-amber-50/70 border-amber-300 text-slate-800'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isPassed ? (
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : isQuestion ? (
            <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
              <HelpCircle className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <RotateCcw className="w-4 h-4" />
            </div>
          )}

          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Evaluator Critique</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-medium">
                Cycle {evaluator.cycle}
              </span>
            </h4>
          </div>
        </div>

        {/* Verdict Badge */}
        <div>
          {isPassed ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Criteria Met
            </span>
          ) : isQuestion ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              Clarification Needed
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" />
              Self-Correction Triggered
            </span>
          )}
        </div>
      </div>

      {/* Feedback Body */}
      <p className="text-xs text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-200/80 mt-1 whitespace-pre-wrap">
        {evaluator.feedback}
      </p>

      {/* Footer explanation */}
      {!isPassed && !isQuestion && (
        <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-amber-800 font-mono font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>Feedback injected into worker prompt. Running next cycle...</span>
        </div>
      )}
    </div>
  );
};
