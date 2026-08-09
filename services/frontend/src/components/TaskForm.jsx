import React, { useState } from 'react';
import { Play, Sparkles, Sliders, Cpu, Zap, Code2 } from 'lucide-react';

export default function TaskForm({ onSubmit, loading, llmStatus }) {
  const [prompt, setPrompt] = useState('');
  const [tokenBudget, setTokenBudget] = useState(100000);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onSubmit({ task_prompt: prompt, token_budget: tokenBudget });
    setPrompt('');
  };

  const presetPrompts = [
    "Create email validation utility with regex and unit tests",
    "Add JWT token authentication endpoint and pytest suite",
    "Implement rate limiting middleware with pytest coverage",
    "Create LRU cache data structure with unit tests"
  ];

  return (
    <div className="glass-panel p-6 rounded-2xl mb-8 border border-slate-800/90 glow-indigo">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-outfit text-slate-100">Execute Autonomous Agent Task</h2>
            <p className="text-[11px] text-slate-400">Multi-agent software engineering mission trigger</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400">Engine:</span>
          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold uppercase">
            {llmStatus?.provider || 'OLLAMA'} ({llmStatus?.model || 'llama3.1'})
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the software engineering task for DevAgents (e.g. 'Create user authentication endpoint with JWT tokens and pytest coverage')..."
            rows={3}
            className="w-full bg-[#080c14]/90 border border-slate-700/60 rounded-xl p-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono resize-none leading-relaxed"
          />
        </div>

        {/* Quick Prompt Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider py-1">Quick Presets:</span>
          {presetPrompts.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(preset)}
              className="text-[11px] bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50 rounded-lg px-2.5 py-1 transition-all cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-slate-800/80 gap-3">
          <div className="flex items-center space-x-3">
            <Sliders className="w-4 h-4 text-slate-400" />
            <label className="text-xs text-slate-300 font-semibold">Token Budget Limit:</label>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {tokenBudget.toLocaleString()} Tokens
            </span>
            <input
              type="range"
              min={10000}
              max={500000}
              step={10000}
              value={tokenBudget}
              onChange={(e) => setTokenBudget(Number(e.target.value))}
              className="w-28 accent-indigo-500 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Cpu className="w-4 h-4 animate-spin" />
                <span>Launching Agent Graph...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>⚡ Execute Agent Graph</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
