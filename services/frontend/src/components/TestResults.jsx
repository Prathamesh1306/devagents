import React from 'react';
import { CheckCircle2, AlertOctagon, Terminal } from 'lucide-react';

export default function TestResults({ testResults }) {
  if (!testResults) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center text-xs text-slate-500 font-mono">
        Test execution pending or skipped.
      </div>
    );
  }

  const passed = testResults.passed;
  const output = testResults.output || '';
  const traceback = testResults.traceback;

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Banner */}
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between ${
          passed
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          {passed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <div>
            <span className="font-bold text-sm block">
              {passed ? '✅ Test Suite PASSED' : '❌ Test Suite FAILED'}
            </span>
            <span className="text-[11px] text-slate-400">
              {passed ? 'All generated unit tests passed in sandbox' : 'Pytest reported test failures in generated code'}
            </span>
          </div>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
          return code: {testResults.return_code ?? 0}
        </span>
      </div>

      {/* Output / Traceback box */}
      {(output || traceback) && (
        <div className="bg-[#0a0e17] border border-slate-800 rounded-xl p-3.5 space-y-2 overflow-x-auto max-h-60">
          <div className="flex items-center space-x-2 text-slate-400 text-[11px] border-b border-slate-800 pb-1.5">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Pytest Execution Log</span>
          </div>

          {output && (
            <pre className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">{output}</pre>
          )}

          {traceback && (
            <pre className="text-rose-400 text-[11px] leading-relaxed whitespace-pre-wrap border-t border-rose-500/20 pt-2">
              {traceback}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
