import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

export default function LiveLog({ logs }) {
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-[#070a10] border border-slate-800 p-4 rounded-xl text-center text-xs text-slate-500 font-mono">
        No execution logs recorded yet.
      </div>
    );
  }

  return (
    <div className="bg-[#070a10] border border-slate-800/90 rounded-xl overflow-hidden font-mono text-xs shadow-inner">
      <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-slate-400 text-[11px]">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>Execution Log Stream</span>
        </div>
        <span className="text-slate-500">{logs.length} events</span>
      </div>

      <div className="p-4 max-h-56 overflow-y-auto space-y-1.5 leading-relaxed text-[11px] text-slate-300">
        {logs.map((log, idx) => {
          const isError = log.includes('ABORTED') || log.includes('FAILED') || log.includes('ERROR') || log.includes('ESCALATION');
          const isSuccess = log.includes('PASSED') || log.includes('APPROVED');
          return (
            <div key={idx} className="flex items-start space-x-2">
              <span className="text-slate-600 select-none">$</span>
              <span
                className={
                  isError
                    ? 'text-rose-400 font-semibold'
                    : isSuccess
                    ? 'text-emerald-300'
                    : 'text-indigo-200'
                }
              >
                {log}
              </span>
            </div>
          );
        })}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
