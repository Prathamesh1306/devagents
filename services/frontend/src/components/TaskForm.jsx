import React, { useState } from 'react';
import { Play, Sparkles, Sliders, Cpu } from 'lucide-react';

export default function TaskForm({ onSubmit, loading }) {
  const [prompt, setPrompt] = useState('');
  const [tokenBudget, setTokenBudget] = useState(100000);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onSubmit({ task_prompt: prompt, token_budget: tokenBudget });
    setPrompt('');
  };

  const presetPrompts = [
    "Create user authentication endpoint with JWT tokens",
    "Add llm_calls ledger table and auto-logging middleware",
    "Implement rate limiting middleware on API routes",
    "Fix flaky test handling in sandbox runner"
  ];

  return (
    <div className="glass-panel p-6 rounded-2xl mb-8 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-slate-100">Trigger Autonomous Agent Task</h2>
        </div>
        <span className="text-xs text-slate-400">Target Repo: <span className="font-mono text-indigo-300">Prathamesh1306/devagents</span></span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the feature, bugfix, or refactoring task for DevAgents..."
            rows={3}
            className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono resize-none"
          />
        </div>

        {/* Preset Prompt Pills */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-400 py-1 font-medium">Quick Prompts:</span>
          {presetPrompts.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(preset)}
              className="text-xs bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50 rounded-lg px-2.5 py-1 transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-slate-400" />
              <label className="text-xs text-slate-300 font-medium">Token Budget Ceiling:</label>
              <span className="text-xs font-mono font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {tokenBudget.toLocaleString()} Tokens
              </span>
            </div>
            <input
              type="range"
              min={10000}
              max={500000}
              step={10000}
              value={tokenBudget}
              onChange={(e) => setTokenBudget(Number(e.target.value))}
              className="w-32 accent-indigo-500 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Cpu className="w-4 h-4 animate-spin" />
                <span>Submitting Task...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Execute Agent Graph</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
