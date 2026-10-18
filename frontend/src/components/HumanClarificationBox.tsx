'use client';

import React, { useState } from 'react';
import { HelpCircle, Send } from 'lucide-react';

interface HumanClarificationBoxProps {
  questionText: string;
  onSendClarification: (answer: string) => void;
  isSubmitting: boolean;
}

export const HumanClarificationBox: React.FC<HumanClarificationBoxProps> = ({
  questionText,
  onSendClarification,
  isSubmitting,
}) => {
  const [answer, setAnswer] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting) return;
    onSendClarification(answer.trim());
    setAnswer('');
  };

  return (
    <div className="flex flex-col p-4 rounded-xl bg-sky-50 border border-sky-200 my-3 shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-sky-800">
        <HelpCircle className="w-5 h-5 text-sky-600" />
        <h4 className="text-sm font-bold text-slate-900">Sidekick Needs Your Clarification</h4>
      </div>

      <div className="p-3 bg-white rounded-lg border border-sky-200/80 text-xs text-slate-800 mb-3 leading-relaxed">
        {questionText}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your clarification or instructions..."
          disabled={isSubmitting}
          className="flex-1 bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        />

        <button
          type="submit"
          disabled={!answer.trim() || isSubmitting}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isSubmitting ? 'Resuming...' : 'Reply'}</span>
        </button>
      </form>
    </div>
  );
};
