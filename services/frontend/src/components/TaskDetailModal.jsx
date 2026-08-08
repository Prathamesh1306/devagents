import React from 'react';
import { X, CheckCircle2, Clock, AlertCircle, Cpu, GitPullRequest, ExternalLink, ShieldCheck, Database } from 'lucide-react';

export default function TaskDetailModal({ task, onClose }) {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700/60 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Task Execution Details</h3>
              <p className="text-xs font-mono text-slate-400">ID: {task.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Prompt Box */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
              Requirement Prompt
            </label>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-sm text-indigo-200 leading-relaxed">
              "{task.task_prompt}"
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">Status</span>
              <span className="text-sm font-semibold capitalize text-emerald-400">
                {task.final_status}
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">Tokens Used</span>
              <span className="text-sm font-semibold font-mono text-indigo-300">
                {(task.tokens_used || 0).toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">Budget Ceiling</span>
              <span className="text-sm font-semibold font-mono text-slate-300">
                {(task.token_budget || 100000).toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">Database Store</span>
              <span className="text-sm font-semibold text-emerald-400 flex items-center space-x-1">
                <Database className="w-3.5 h-3.5" />
                <span>Supabase</span>
              </span>
            </div>
          </div>

          {/* Trace Information */}
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Trace Correlation ID:</span>
              <span className="text-slate-200">{task.trace_id || 'trace-default'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Created At:</span>
              <span className="text-slate-300">{new Date(task.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Updated At:</span>
              <span className="text-slate-300">{new Date(task.updated_at).toLocaleString()}</span>
            </div>
          </div>

          {/* Pull Request Link */}
          {task.pr_url && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <GitPullRequest className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-300">Pull Request Created</h4>
                  <p className="text-xs text-slate-400">Verified code & test suite pushed to GitHub</p>
                </div>
              </div>

              <a
                href={task.pr_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
              >
                <span>View PR</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
