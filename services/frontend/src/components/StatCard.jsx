import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'indigo' }) {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      text: 'text-indigo-400',
      valColor: 'text-indigo-200'
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      valColor: 'text-emerald-300'
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
      valColor: 'text-cyan-200'
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      valColor: 'text-amber-300'
    }
  };

  const c = colorMap[color] || colorMap.indigo;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
      <div className="space-y-1">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">{title}</span>
        <div className={`text-2xl font-bold font-mono tracking-tight ${c.valColor}`}>{value}</div>
        {subtitle && <span className="text-[11px] text-slate-500 font-mono block">{subtitle}</span>}
      </div>

      <div className={`p-3.5 rounded-2xl ${c.bg} border ${c.border} ${c.text}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
