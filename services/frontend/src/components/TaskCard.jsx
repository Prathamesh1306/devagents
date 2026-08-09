import React from 'react';
import { CheckCircle2, Clock, AlertCircle, ArrowUpRight, Cpu, GitPullRequest, AlertTriangle } from 'lucide-react';
import AgentPipeline from './AgentPipeline.jsx';

export default function TaskCard({ task, onSelect }) {
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'completed':
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        );
      case 'running':
      case 'pending':
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Cpu className="w-3.5 h-3.5 animate-spin" />
            <span>Running</span>
          </span>
        );
      case 'awaiting_human_review':
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>Review Needed</span>
          </span>
        );
      case 'escalated':
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Escalated</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{status || 'Aborted'}</span>
          </span>
        );
    }
  };

  const isRunning = ['running', 'pending', 'awaiting_human_review'].includes((task.final_status || '').toLowerCase());

  return (
    <div
      onClick={() => onSelect(task)}
      className={`glass-card p-5 rounded-2xl cursor-pointer flex flex-col justify-between space-y-4 ${
        isRunning ? 'border-cyan-500/30 bg-slate-900/60' : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          {getStatusBadge(task.final_status)}
          <span className="text-[11px] font-mono text-slate-500">
            ID: {task.id.slice(0, 8)}...
          </span>
        </div>

        <h3 className="text-xs font-semibold text-slate-100 line-clamp-2 leading-relaxed mb-3 font-mono">
          "{task.task_prompt}"
        </h3>

        {/* Compact Node Pipeline Tracker */}
        <div className="pt-2 border-t border-slate-800/60">
          <AgentPipeline status={task.final_status} compact={true} />
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 font-mono text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-200 font-bold">{(task.tokens_used || 0).toLocaleString()}</span>
            <span className="text-slate-500">tok</span>
          </div>

          {task.pr_url && (
            <div className="flex items-center space-x-1 text-emerald-400 font-mono text-[11px]">
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>PR Ready</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 font-semibold text-[11px]">
          <span>Inspect</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
