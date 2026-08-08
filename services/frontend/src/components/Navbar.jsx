import React from 'react';
import { Bot, Database, Zap, ShieldCheck, Github } from 'lucide-react';

export default function Navbar({ isOnline }) {
  return (
    <header className="glass-panel sticky top-0 z-50 px-6 py-4 mb-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                DevAgents
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                Enterprise v0.1
              </span>
            </div>
            <p className="text-xs text-slate-400">Multi-Agent Software Engineering Platform</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300">Database:</span>
            <span className="font-mono text-emerald-400 font-medium">Supabase Postgres</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-slate-300">API Status:</span>
            <span className={`font-semibold ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isOnline ? 'ONLINE (8005)' : 'OFFLINE'}
            </span>
          </div>

          <a
            href="https://github.com/Prathamesh1306/devagents"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>GitHub Repository</span>
          </a>
        </div>
      </div>
    </header>
  );
}
