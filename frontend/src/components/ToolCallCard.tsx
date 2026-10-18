'use client';

import React, { useState } from 'react';
import { Globe, Search, Terminal, FileText, Bell, BookOpen, ChevronDown, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { ToolCallItem } from '@/types/agent';

interface ToolCallCardProps {
  tool: ToolCallItem;
}

export const ToolCallCard: React.FC<ToolCallCardProps> = ({ tool }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const getToolMeta = (name: string) => {
    switch (name) {
      case 'search':
        return {
          icon: <Search className="w-4 h-4 text-amber-600" />,
          label: 'Google Serper Search',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'navigate_browser':
      case 'click_element':
      case 'get_elements':
      case 'extract_text':
      case 'current_page':
        return {
          icon: <Globe className="w-4 h-4 text-sky-600" />,
          label: `Playwright Browser (${name.replace('_', ' ')})`,
          badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
        };
      case 'python_repl':
        return {
          icon: <Terminal className="w-4 h-4 text-emerald-600" />,
          label: 'Python REPL Execution',
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'send_push_notification':
        return {
          icon: <Bell className="w-4 h-4 text-rose-600" />,
          label: 'Pushover Notification',
          badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
        };
      case 'wikipedia':
        return {
          icon: <BookOpen className="w-4 h-4 text-blue-600" />,
          label: 'Wikipedia Query',
          badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
        };
      default:
        if (name.includes('file') || name.includes('write') || name.includes('read') || name.includes('directory')) {
          return {
            icon: <FileText className="w-4 h-4 text-purple-600" />,
            label: `File Tool (${name.replace('_', ' ')})`,
            badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
          };
        }
        return {
          icon: <Terminal className="w-4 h-4 text-slate-600" />,
          label: name,
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
        };
    }
  };

  const meta = getToolMeta(tool.name);

  return (
    <div className="flex flex-col bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden text-xs my-2 transition-all">
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-xs shrink-0">
            {meta.icon}
          </div>
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-slate-900">{meta.label}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${meta.badgeColor}`}>
              Cycle {tool.cycle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {tool.output ? (
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-mono font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Done
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-amber-700 font-mono font-medium animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Running...
            </span>
          )}
          <button className="text-slate-400 hover:text-slate-700 transition-colors">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Primary snippet */}
      <div className="px-3.5 py-2 font-mono text-[11px] text-slate-600 bg-white border-t border-slate-200 truncate">
        {tool.args.query ? <span>Query: &quot;{String(tool.args.query)}&quot;</span> : null}
        {tool.args.url ? <span>URL: {String(tool.args.url)}</span> : null}
        {tool.args.command ? <span>Python: {String(tool.args.command)}</span> : null}
        {tool.args.file_path ? <span>Path: {String(tool.args.file_path)}</span> : null}
        {tool.args.text ? <span>Push: {String(tool.args.text)}</span> : null}
        {!tool.args.query && !tool.args.url && !tool.args.command && !tool.args.file_path && !tool.args.text ? (
          <span>Args: {JSON.stringify(tool.args)}</span>
        ) : null}
      </div>

      {/* Expanded full details */}
      {isExpanded && (
        <div className="flex flex-col gap-2 p-3.5 bg-slate-50 border-t border-slate-200 font-mono">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
              Parameters
            </span>
            <pre className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(tool.args, null, 2)}
            </pre>
          </div>

          {tool.output && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold block mb-1">
                Output Result
              </span>
              <pre className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] max-h-48 overflow-y-auto whitespace-pre-wrap">
                {tool.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
