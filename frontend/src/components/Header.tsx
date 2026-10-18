'use client';

import React from 'react';
import { Bot, Sparkles, Activity, ShieldCheck, Cpu, RefreshCw, Folder } from 'lucide-react';
import { SystemHealth } from '@/types/agent';

interface HeaderProps {
  health: SystemHealth | null;
  isRunning: boolean;
  activeCycle: number;
  sandboxCount: number;
  onRefreshHealth: () => void;
  activeTab: 'mission' | 'sandbox' | 'graph';
  setActiveTab: (tab: 'mission' | 'sandbox' | 'graph') => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  isRunning,
  activeCycle,
  sandboxCount,
  onRefreshHealth,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 border-b border-slate-200 px-4 lg:px-8 py-3 backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Brand identity */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white shadow-sm">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRunning ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRunning ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                Sidekick
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Agentic AI
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Evaluator-Optimizer Loop with Playwright, Serper & Sandbox
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium w-full md:w-auto justify-center">
          <button
            onClick={() => setActiveTab('mission')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'mission'
                ? 'bg-white text-indigo-700 font-semibold shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            Mission Control
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'graph'
                ? 'bg-white text-indigo-700 font-semibold shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            LangGraph Map
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer relative ${
              activeTab === 'sandbox'
                ? 'bg-white text-indigo-700 font-semibold shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Folder className="w-3.5 h-3.5 text-indigo-600" />
            Sandbox Files
            {sandboxCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold">
                {sandboxCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Status Indicators */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Active cycle indicator */}
          {isRunning && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>Evaluating Cycle {activeCycle}</span>
            </div>
          )}

          {/* Health indicator */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${
                health?.agent_ready ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span className="hidden sm:inline font-medium">
              {health?.agent_ready ? `${health.tools_count} Tools Ready` : 'Connecting...'}
            </span>
            <button
              onClick={onRefreshHealth}
              title="Refresh Agent Connection"
              className="text-slate-400 hover:text-slate-700 transition-colors ml-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
