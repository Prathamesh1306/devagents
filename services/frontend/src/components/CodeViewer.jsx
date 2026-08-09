import React, { useState } from 'react';
import { FileCode, Copy, Check } from 'lucide-react';

export default function CodeViewer({ generatedCode }) {
  const [copied, setCopied] = useState(false);
  const files = Object.keys(generatedCode || {});
  const [activeFile, setActiveFile] = useState(files[0] || '');

  if (!generatedCode || files.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl text-center text-xs text-slate-500 font-mono">
        No generated code available for this task.
      </div>
    );
  }

  const currentContent = generatedCode[activeFile] || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
      {/* File Tab Bar */}
      <div className="bg-slate-950/80 border-b border-slate-800 flex items-center justify-between px-3 pt-2">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {files.map((file) => (
            <button
              key={file}
              onClick={() => setActiveFile(file)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t-lg transition-colors border-t border-x cursor-pointer ${
                activeFile === file
                  ? 'bg-slate-900 border-slate-700 text-indigo-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{file}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2.5 py-1 mb-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[11px] cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Code Area */}
      <div className="p-4 overflow-x-auto max-h-80 text-slate-200 bg-[#0a0e17] leading-relaxed">
        <pre>{currentContent}</pre>
      </div>
    </div>
  );
}
