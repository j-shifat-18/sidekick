'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  StopCircle,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Globe,
  Terminal,
  FileText,
  Search,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

import { Header } from '@/components/Header';
import { GraphVisualizer } from '@/components/GraphVisualizer';
import { SandboxExplorer } from '@/components/SandboxExplorer';
import { ToolCallCard } from '@/components/ToolCallCard';
import { EvaluatorCard } from '@/components/EvaluatorCard';
import { HumanClarificationBox } from '@/components/HumanClarificationBox';
import { TimelineEntry, SandboxFileItem, SystemHealth } from '@/types/agent';

const PRESETS = [
  {
    title: '🌐 Web Research & File Save',
    task: 'Search for recent advances in autonomous agent architectures and save a structured 3-point summary to sandbox/agent_report.md.',
    criteria: 'The file sandbox/agent_report.md must exist and contain at least 3 distinct architectural advances.',
  },
  {
    title: '🐍 Python Math & Computation',
    task: 'Calculate compound interest on a $15,000 principal at 8.5% annual return compounded monthly over 12 years using Python.',
    criteria: 'The exact final amount and total interest earned must be computed and stated clearly.',
  },
  {
    title: '📚 Wikipedia Deep Dive',
    task: 'Look up the history of the Apollo 11 moon landing and identify the key astronauts and landing coordinates.',
    criteria: 'Identify Neil Armstrong, Buzz Aldrin, Michael Collins, and the Sea of Tranquility landing site.',
  },
  {
    title: '📁 Multi-Tool Code Generation',
    task: 'Write a Python utility script to calculate SHA-256 hashes of strings and save it to sandbox/hasher.py.',
    criteria: 'File sandbox/hasher.py must exist, contain a working hash function with comments, and be validated with Python.',
  },
];

export default function Home() {
  const [taskInput, setTaskInput] = useState<string>('');
  const [criteriaInput, setCriteriaInput] = useState<string>('');
  const [showCriteriaField, setShowCriteriaField] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'mission' | 'graph' | 'sandbox'>('mission');
  const [activeNode, setActiveNode] = useState<'idle' | 'worker' | 'tools' | 'evaluator' | 'done'>('idle');
  const [activeCycle, setActiveCycle] = useState<number>(1);
  const [threadId, setThreadId] = useState<string | null>(null);

  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [sandboxFiles, setSandboxFiles] = useState<SandboxFileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [health, setHealth] = useState<SystemHealth | null>(null);

  const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);
  const [isSubmittingClarification, setIsSubmittingClarification] = useState<boolean>(false);

  const timelineEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll timeline to bottom
  const scrollToBottom = () => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [timeline, activeNode]);

  // Fetch system health
  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/py/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch {
      setHealth(null);
    }
  };

  // Fetch sandbox files
  const fetchSandboxFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch('/api/py/sandbox/files');
      if (res.ok) {
        const data = await res.json();
        setSandboxFiles(data.files || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchSandboxFiles();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle task submission
  const handleStartTask = async (taskText?: string, criteriaText?: string) => {
    const task = taskText || taskInput.trim();
    if (!task || isRunning) return;

    const criteria = criteriaText || criteriaInput.trim();

    setClarificationQuestion(null);
    setIsRunning(true);
    setActiveNode('worker');
    setActiveCycle(1);

    const userEntry: TimelineEntry = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: task,
      metadata: {
        success_criteria: criteria || 'Clear, accurate, and directly address the user prompt.',
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTimeline((prev) => [...prev, userEntry]);
    setTaskInput('');

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch('/api/py/agent/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: task,
          success_criteria: criteria || null,
          thread_id: threadId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to start agent task');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Response body stream not available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const eventBlock of events) {
          if (!eventBlock.trim()) continue;

          let eventType = 'message';
          let dataStr = '';

          const lines = eventBlock.split('\n');
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.replace('event: ', '').trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.replace('data: ', '').trim();
            }
          }

          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);

            switch (eventType) {
              case 'start':
                setThreadId(data.thread_id);
                break;

              case 'worker_thought':
                setActiveNode('worker');
                setActiveCycle(data.cycle || 1);
                setTimeline((prev) => [
                  ...prev,
                  {
                    id: `thought-${Date.now()}-${Math.random()}`,
                    type: 'thought',
                    content: data.content,
                    metadata: {
                      cycle: data.cycle,
                      is_question: data.is_question,
                    },
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ]);
                break;

              case 'tool_call':
                setActiveNode('tools');
                setActiveCycle(data.cycle || 1);
                setTimeline((prev) => [
                  ...prev,
                  {
                    id: data.call_id || `tool-${Date.now()}-${Math.random()}`,
                    type: 'tool',
                    toolData: {
                      id: data.call_id || `call-${Date.now()}`,
                      name: data.name,
                      args: data.args || {},
                      cycle: data.cycle || 1,
                      status: 'running',
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    },
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ]);
                break;

              case 'tool_result':
                setTimeline((prev) =>
                  prev.map((item) => {
                    if (item.type === 'tool' && item.toolData && item.toolData.name === data.name && !item.toolData.output) {
                      return {
                        ...item,
                        toolData: {
                          ...item.toolData,
                          output: data.output,
                          status: 'completed',
                        },
                      };
                    }
                    return item;
                  })
                );
                if (data.name.includes('file') || data.name.includes('write')) {
                  fetchSandboxFiles();
                }
                break;

              case 'evaluator':
                setActiveNode('evaluator');
                setActiveCycle(data.cycle || 1);
                setTimeline((prev) => [
                  ...prev,
                  {
                    id: `eval-${Date.now()}-${Math.random()}`,
                    type: 'evaluator',
                    evaluatorData: {
                      feedback: data.feedback,
                      success_criteria_met: data.success_criteria_met,
                      user_input_needed: data.user_input_needed,
                      cycle: data.cycle || 1,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    },
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ]);

                if (data.user_input_needed) {
                  setClarificationQuestion(data.feedback);
                }
                break;

              case 'done':
                setActiveNode('done');
                setTimeline((prev) => [
                  ...prev,
                  {
                    id: `done-${Date.now()}`,
                    type: 'done',
                    content: data.reply,
                    metadata: {
                      cycle: data.cycles,
                    },
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ]);
                fetchSandboxFiles();
                break;

              case 'error':
                setActiveNode('idle');
                setTimeline((prev) => [
                  ...prev,
                  {
                    id: `err-${Date.now()}`,
                    type: 'error',
                    content: data.error,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ]);
                break;
            }
          } catch (e) {
            console.error('Error parsing SSE event:', e);
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setTimeline((prev) => [
          ...prev,
          {
            id: `aborted-${Date.now()}`,
            type: 'error',
            content: 'Agent execution was stopped by user.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setTimeline((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            type: 'error',
            content: err instanceof Error ? err.message : 'Unknown execution failure',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } finally {
      setIsRunning(false);
      setActiveNode('idle');
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
    setActiveNode('idle');
  };

  const handleSendClarification = async (answer: string) => {
    setIsSubmittingClarification(true);
    setClarificationQuestion(null);
    await handleStartTask(answer);
    setIsSubmittingClarification(false);
  };

  const handleReset = () => {
    handleStop();
    setTimeline([]);
    setThreadId(null);
    setActiveCycle(1);
    setClarificationQuestion(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] text-slate-800">
      {/* Top Header */}
      <Header
        health={health}
        isRunning={isRunning}
        activeCycle={activeCycle}
        sandboxCount={sandboxFiles.length}
        onRefreshHealth={fetchHealth}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-8 py-6 flex flex-col gap-6">
        {/* Render Tab Views */}
        {activeTab === 'graph' ? (
          <GraphVisualizer
            activeNode={activeNode}
            cycle={activeCycle}
            successCriteria={criteriaInput}
          />
        ) : activeTab === 'sandbox' ? (
          <SandboxExplorer
            files={sandboxFiles}
            isLoading={loadingFiles}
            onRefresh={fetchSandboxFiles}
          />
        ) : (
          /* Mission Control Workspace */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
            {/* Left 8 Cols: Mission Execution Feed & Input */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Timeline Feed Card */}
              <div className="flex-1 flex flex-col bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden min-h-[500px] max-h-[680px]">
                {/* Feed Header */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                    <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                      Execution Timeline
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {timeline.length > 0 && (
                      <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs text-slate-700 shadow-2xs transition-colors cursor-pointer font-medium"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-500" />
                        <span>Clear History</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Feed Body */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5 bg-white">
                  {timeline.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-500">
                      <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 mb-4 shadow-sm">
                        <Bot className="w-10 h-10" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mb-1">
                        Sidekick Agent Ready
                      </h4>
                      <p className="text-xs text-slate-600 max-w-md leading-relaxed">
                        Enter a mission below or select a preset. Sidekick will run its tools, evaluate its output against your criteria, and self-correct until the goal is achieved.
                      </p>

                      {/* Quick Presets Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-6 w-full max-w-lg text-left">
                        {PRESETS.map((preset) => (
                          <div
                            key={preset.title}
                            onClick={() => {
                              setTaskInput(preset.task);
                              setCriteriaInput(preset.criteria);
                              setShowCriteriaField(true);
                            }}
                            className="p-3.5 rounded-xl bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 shadow-sm cursor-pointer transition-all group"
                          >
                            <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-700 flex items-center justify-between">
                              {preset.title}
                              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
                            </span>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {preset.task}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    timeline.map((entry) => {
                      if (entry.type === 'user') {
                        return (
                          <div key={entry.id} className="flex flex-col gap-1 items-end my-2">
                            <div className="max-w-[85%] p-4 rounded-2xl bg-indigo-600 text-white shadow-sm">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200 mb-1">
                                Goal Prompt
                              </p>
                              <p className="text-sm leading-relaxed">{entry.content}</p>
                              {entry.metadata?.success_criteria && (
                                <div className="mt-2.5 pt-2.5 border-t border-indigo-400/30 text-xs text-indigo-100 flex items-start gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-300 mt-0.5" />
                                  <span>
                                    <strong>Criteria:</strong> {entry.metadata.success_criteria}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 px-1 font-mono">
                              {entry.timestamp}
                            </span>
                          </div>
                        );
                      }

                      if (entry.type === 'thought') {
                        return (
                          <div key={entry.id} className="flex gap-3 my-1 items-start">
                            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 shrink-0 mt-0.5">
                              <Bot className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                              {entry.content}
                            </div>
                          </div>
                        );
                      }

                      if (entry.type === 'tool' && entry.toolData) {
                        return <ToolCallCard key={entry.id} tool={entry.toolData} />;
                      }

                      if (entry.type === 'evaluator' && entry.evaluatorData) {
                        return <EvaluatorCard key={entry.id} evaluator={entry.evaluatorData} />;
                      }

                      if (entry.type === 'done') {
                        return (
                          <div
                            key={entry.id}
                            className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-300 my-3 shadow-sm"
                          >
                            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              <span>Mission Completed (Finished in {entry.metadata?.cycle || 1} cycles)</span>
                            </div>
                            <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap bg-white p-3.5 rounded-xl border border-emerald-200">
                              {entry.content}
                            </div>
                          </div>
                        );
                      }

                      if (entry.type === 'error') {
                        return (
                          <div
                            key={entry.id}
                            className="flex items-start gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs my-2"
                          >
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                            <div>
                              <strong className="block text-rose-900 font-semibold mb-0.5">Execution Alert</strong>
                              <span>{entry.content}</span>
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })
                  )}

                  {/* Clarification prompt box */}
                  {clarificationQuestion && (
                    <HumanClarificationBox
                      questionText={clarificationQuestion}
                      onSendClarification={handleSendClarification}
                      isSubmitting={isSubmittingClarification}
                    />
                  )}

                  {/* Running animation indicator */}
                  {isRunning && (
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 my-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                      </div>
                      <span className="font-mono text-indigo-700 font-medium">
                        {activeNode === 'worker'
                          ? 'Worker is planning and reasoning...'
                          : activeNode === 'tools'
                          ? 'Executing tool action...'
                          : activeNode === 'evaluator'
                          ? 'Evaluator is auditing output against success criteria...'
                          : 'Agent is active...'}
                      </span>
                    </div>
                  )}

                  <div ref={timelineEndRef} />
                </div>
              </div>

              {/* Task Input Box */}
              <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Instruct Sidekick
                  </span>

                  <button
                    onClick={() => setShowCriteriaField(!showCriteriaField)}
                    className="text-xs text-indigo-700 hover:text-indigo-900 font-medium transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>{showCriteriaField ? 'Hide Success Criteria' : '+ Add Explicit Success Criteria'}</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <textarea
                    rows={2}
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleStartTask();
                      }
                    }}
                    placeholder="Enter what you want Sidekick to accomplish (e.g. Research, Web browsing, Script execution, File save)..."
                    disabled={isRunning}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all"
                  />

                  {showCriteriaField && (
                    <div className="flex flex-col gap-1 p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-200">
                      <span className="text-[11px] font-mono text-indigo-800 font-semibold">
                        🎯 Specific Success Criteria (Evaluator will reject if not met):
                      </span>
                      <input
                        type="text"
                        value={criteriaInput}
                        onChange={(e) => setCriteriaInput(e.target.value)}
                        placeholder="e.g. File sandbox/summary.txt must exist with 3 distinct citations."
                        disabled={isRunning}
                        className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <span className="text-slate-500">Press</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px]">
                      Enter
                    </kbd>
                    <span className="text-slate-500">to send</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isRunning ? (
                      <button
                        onClick={handleStop}
                        className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                      >
                        <StopCircle className="w-4 h-4" />
                        <span>Stop Agent</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartTask()}
                        disabled={!taskInput.trim()}
                        className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Run Sidekick</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Live State & Tool Diagnostics */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Active Node State Card */}
              <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Agent State Machine
                  </span>
                  <span className="text-[11px] font-mono text-amber-700 font-semibold">
                    Cycle {activeCycle}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <div
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                      activeNode === 'worker'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-semibold shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Bot className="w-3.5 h-3.5 text-indigo-600" />
                      1. Worker (Reason & Tool Calling)
                    </span>
                    {activeNode === 'worker' && <span className="text-[10px] text-amber-700 font-mono font-semibold animate-pulse">Active</span>}
                  </div>

                  <div
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                      activeNode === 'tools'
                        ? 'bg-sky-50 border-sky-400 text-sky-900 font-semibold shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-sky-600" />
                      2. Tool Execution (Browser/Search/REPL)
                    </span>
                    {activeNode === 'tools' && <span className="text-[10px] text-sky-700 font-mono font-semibold animate-pulse">Running</span>}
                  </div>

                  <div
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                      activeNode === 'evaluator'
                        ? 'bg-purple-50 border-purple-400 text-purple-900 font-semibold shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                      3. Evaluator (Audit & Refine)
                    </span>
                    {activeNode === 'evaluator' && <span className="text-[10px] text-purple-700 font-mono font-semibold animate-pulse">Auditing</span>}
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('graph')}
                  className="w-full py-1 text-center text-xs text-indigo-700 hover:text-indigo-900 font-medium transition-colors cursor-pointer"
                >
                  View Full Graph Diagram →
                </button>
              </div>

              {/* Tool Matrix & Environment Checklist */}
              <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Equipped Tool Suite
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                    {health?.tools_count || 6} Loaded
                  </span>
                </div>

                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="flex items-center gap-2 text-slate-700 font-medium">
                      <Globe className="w-3.5 h-3.5 text-sky-600" />
                      Playwright Browser (Chromium)
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono font-semibold">Active</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="flex items-center gap-2 text-slate-700 font-medium">
                      <Search className="w-3.5 h-3.5 text-amber-600" />
                      Google Serper Search
                    </span>
                    <span className={`text-[10px] font-mono font-semibold ${health?.env.serper ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {health?.env.serper ? 'Enabled' : 'No Key'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="flex items-center gap-2 text-slate-700 font-medium">
                      <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                      Python REPL Tool
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono font-semibold">Active</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="flex items-center gap-2 text-slate-700 font-medium">
                      <FileText className="w-3.5 h-3.5 text-purple-600" />
                      File System Sandbox
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono font-semibold">{sandboxFiles.length} files</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="flex items-center gap-2 text-slate-700 font-medium">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      Wikipedia API
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono font-semibold">Active</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('sandbox')}
                  className="w-full mt-1 py-1 text-center text-xs text-indigo-700 hover:text-indigo-900 font-medium transition-colors cursor-pointer"
                >
                  Browse Sandbox Files ({sandboxFiles.length}) →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
