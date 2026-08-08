import React from 'react';
import { CheckCircle2, Clock, AlertCircle, ArrowUpRight, Cpu, FileCode, GitPullRequest } from 'lucide-react';

export default function TaskCard({ task, onSelect }) {
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        );
      case 'running':
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Cpu className="w-3.5 h-3.5 animate-spin" />
            <span>Running</span>
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{status || 'Aborted'}</span>
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onSelect(task)}
      className="glass-card p-5 rounded-xl cursor-pointer flex flex-col justify-between space-y-4"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          {getStatusBadge(task.final_status)}
          <span className="text-[11px] font-mono text-slate-500">
            ID: {task.id.slice(0, 8)}...
          </span>
        </div>

        <h3 className="text-sm font-medium text-slate-100 line-clamp-2 leading-relaxed mb-2 font-mono">
          "{task.task_prompt}"
        </h3>
      </div>

      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono text-slate-300">{(task.tokens_used || 0).toLocaleString()}</span>
            <span>tok</span>
          </div>

          {task.pr_url && (
            <div className="flex items-center space-x-1 text-emerald-400">
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>PR Ready</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 font-medium">
          <span>Details</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
