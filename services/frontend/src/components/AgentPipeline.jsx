import React from 'react';

export default function AgentPipeline({ status, compact = false }) {
  const normalizedStatus = (status || 'pending').toLowerCase();

  const nodes = [
    { key: 'planner', label: 'Planner' },
    { key: 'hitl', label: 'HITL Review' },
    { key: 'coder', label: 'Coder' },
    { key: 'reviewer', label: 'Reviewer' },
    { key: 'tests', label: 'Test Runner' },
  ];

  // Helper to determine node state
  const getNodeState = (key) => {
    if (normalizedStatus === 'completed') return 'done';
    if (normalizedStatus === 'aborted' || normalizedStatus === 'failed') return 'failed';

    if (key === 'planner') {
      if (normalizedStatus === 'pending') return 'active';
      return 'done';
    }
    if (key === 'hitl') {
      if (normalizedStatus === 'awaiting_human_review') return 'active';
      if (['plan_approved', 'code_generated', 'review_passed', 'review_failed', 'completed'].includes(normalizedStatus)) return 'done';
      return 'idle';
    }
    if (key === 'coder') {
      if (normalizedStatus === 'plan_approved') return 'active';
      if (['code_generated', 'review_passed', 'review_failed', 'completed'].includes(normalizedStatus)) return 'done';
      return 'idle';
    }
    if (key === 'reviewer') {
      if (normalizedStatus === 'code_generated') return 'active';
      if (['review_passed', 'completed'].includes(normalizedStatus)) return 'done';
      if (normalizedStatus === 'review_failed') return 'failed';
      return 'idle';
    }
    if (key === 'tests') {
      if (normalizedStatus === 'review_passed') return 'active';
      if (normalizedStatus === 'completed') return 'done';
      return 'idle';
    }
    return 'idle';
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-1 font-mono text-[10px]">
        {nodes.map((n, idx) => {
          const state = getNodeState(n.key);
          return (
            <React.Fragment key={n.key}>
              <span
                className={`px-1.5 py-0.5 rounded ${
                  state === 'done'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : state === 'active'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse'
                    : state === 'failed'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-slate-800/60 text-slate-500'
                }`}
              >
                {n.label}
              </span>
              {idx < nodes.length - 1 && <span className="text-slate-600">→</span>}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-2 p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-center font-mono">
      {nodes.map((n) => {
        const state = getNodeState(n.key);
        return (
          <div
            key={n.key}
            className={`p-2.5 rounded-lg border transition-all ${
              state === 'done'
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : state === 'active'
                ? 'bg-indigo-900/40 border-indigo-500/60 text-indigo-200 ring-2 ring-indigo-500/30'
                : state === 'failed'
                ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                : 'bg-slate-800/50 border-slate-800 text-slate-500'
            }`}
          >
            <span className="text-[10px] block uppercase font-bold tracking-wider mb-1">{n.label}</span>
            <div
              className={`w-2 h-2 rounded-full mx-auto ${
                state === 'done'
                  ? 'bg-emerald-400'
                  : state === 'active'
                  ? 'bg-indigo-400 animate-ping'
                  : state === 'failed'
                  ? 'bg-rose-400'
                  : 'bg-slate-600'
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}
