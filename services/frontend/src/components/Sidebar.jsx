import React from 'react';
import { Bot, LayoutDashboard, Cpu, Terminal, Layers, ShieldCheck, Activity, Github, RefreshCw } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, llmStatus, onRefresh }) {
  const isOllama = llmStatus?.provider === 'ollama';
  const isReachable = llmStatus?.reachable ?? false;

  return (
    <aside className="w-64 fixed inset-y-0 left-0 bg-[#0d121e]/90 backdrop-blur-xl border-r border-slate-800/80 z-30 flex flex-col justify-between p-5">
      <div>
        {/* Brand Header */}
        <div className="flex items-center space-x-3 mb-8 px-2">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/30">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-xl font-bold tracking-tight font-outfit bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                DevAgents
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                v0.1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Autonomous Engineering Platform</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Mission Control</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Agent Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'graph'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Agent Graph Topology</span>
          </button>
        </nav>
      </div>

      {/* Footer / Provider Status Widget */}
      <div className="space-y-3 border-t border-slate-800/80 pt-4">
        {/* Ollama / LLM Status Chip */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">LLM Provider</span>
            <button
              onClick={onRefresh}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              title="Check Provider Status"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isReachable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              {llmStatus?.provider || 'OLLAMA'}
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${isReachable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {isReachable ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/50">
            <span>Model:</span>
            <span className="text-indigo-300 font-semibold">{llmStatus?.model || 'llama3.1'}</span>
          </div>
        </div>

        {/* GitHub Link */}
        <a
          href="https://github.com/Prathamesh1306/devagents"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center space-x-2 w-full py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 text-xs font-medium transition-colors"
        >
          <Github className="w-4 h-4" />
          <span>GitHub Repository</span>
        </a>
      </div>
    </aside>
  );
}
