'use client';

import React, { useState } from 'react';
import { Folder, FileText, FileCode, FileSpreadsheet, RefreshCw, Copy, Check, Eye, X } from 'lucide-react';
import { SandboxFileItem } from '@/types/agent';

interface SandboxExplorerProps {
  files: SandboxFileItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const SandboxExplorer: React.FC<SandboxExplorerProps> = ({
  files,
  isLoading,
  onRefresh,
}) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const getFileIcon = (ext: string) => {
    switch (ext) {
      case '.py':
      case '.js':
      case '.ts':
      case '.json':
      case '.html':
        return <FileCode className="w-4 h-4 text-sky-600" />;
      case '.csv':
      case '.tsv':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const fetchContent = async (path: string) => {
    setSelectedFile(path);
    setLoadingContent(true);
    try {
      const res = await fetch(`/api/py/sandbox/file?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content || '');
      } else {
        setFileContent('Error loading file content');
      }
    } catch {
      setFileContent('Failed to connect to backend server');
    } finally {
      setLoadingContent(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-800">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Folder className="w-5 h-5 text-indigo-600" />
            <span>Sandbox File Explorer</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono border border-slate-200">
              sandbox/
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Files created, read, or modified by Sidekick during task execution.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs text-slate-700 shadow-sm transition-all cursor-pointer font-medium"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main split content: File list and File Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[450px]">
        {/* Left Column: File List */}
        <div className="lg:col-span-5 flex flex-col gap-2 overflow-y-auto max-h-[550px] pr-1">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <Folder className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No files in sandbox yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Ask Sidekick to research a topic and save the summary to a file (e.g. &quot;save to sandbox/news.txt&quot;).
              </p>
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.path}
                onClick={() => fetchContent(file.path)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedFile === file.path
                    ? 'bg-indigo-50/80 border-indigo-300 shadow-sm'
                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-100 shrink-0">
                    {getFileIcon(file.extension)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {formatFileSize(file.size)} • {formatDate(file.modified)}
                    </p>
                  </div>
                </div>

                <Eye className="w-4 h-4 text-slate-400 hover:text-slate-700 transition-colors shrink-0 ml-2" />
              </div>
            ))
          )}
        </div>

        {/* Right Column: File Previewer */}
        <div className="lg:col-span-7 flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden min-h-[350px]">
          {selectedFile ? (
            <div className="flex flex-col h-full">
              {/* Preview Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200 font-semibold">
                    {selectedFile}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 transition-all cursor-pointer font-medium"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preview Body */}
              <div className="p-4 flex-1 overflow-auto font-mono text-xs text-slate-800 leading-relaxed max-h-[480px] bg-white">
                {loadingContent ? (
                  <div className="flex items-center justify-center h-48 text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    <span>Loading file content...</span>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap break-words">{fileContent}</pre>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
              <Eye className="w-8 h-8 mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Select a file to preview its contents</p>
              <p className="text-xs text-slate-500 mt-1">
                View generated research, markdown notes, or code directly in this workspace.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
