import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, CheckCircle2, Clock, AlertTriangle, Cpu, GitPullRequest, ExternalLink, ShieldCheck, Database, DollarSign, Send, MessageSquare } from 'lucide-react';

const API_BASE = 'http://localhost:8005';

export default function TaskDetailModal({ task, onClose, onRefresh }) {
  const [llmCalls, setLlmCalls] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (task && task.id) {
      axios.get(`${API_BASE}/tasks/${task.id}/llm-calls`)
        .then(res => setLlmCalls(res.data))
        .catch(() => setLlmCalls([]));
    }
  }, [task]);

  if (!task) return null;

  const isAwaitingReview = task.final_status?.toLowerCase() === 'awaiting_human_review';
  const isBudgetExceeded = task.final_status?.toLowerCase() === 'failed_budget_exceeded';

  const handleReview = async (planApproved) => {
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/tasks/${task.id}/review`, {
        plan_approved: planApproved,
        human_feedback: feedback || null
      });
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      alert("Failed to submit plan review decision.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-slate-700/60 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Agent Execution & HITL Review Inspector</h3>
              <p className="text-xs font-mono text-slate-400">Task ID: {task.id}</p>
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
          {/* Interactive Agent Workflow Visualizer */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 block">
              LangGraph State Graph Execution Workflow
            </label>
            <div className="grid grid-cols-4 gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-xl text-center">
              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                <span className="text-[11px] font-mono text-indigo-400 block mb-1">1. PLANNER</span>
                <span className="text-xs font-semibold text-slate-200">Architect Plan</span>
                <div className="w-2 h-2 rounded-full bg-emerald-400 mx-auto mt-2 animate-pulse" />
              </div>

              <div className={`p-3 rounded-lg border ${isAwaitingReview ? 'bg-indigo-900/40 border-indigo-500/60 ring-2 ring-indigo-500/30' : 'bg-slate-800/80 border-slate-700'}`}>
                <span className="text-[11px] font-mono text-amber-400 block mb-1">2. HITL GATE</span>
                <span className="text-xs font-semibold text-slate-200">Human Review</span>
                <div className={`w-2 h-2 rounded-full mx-auto mt-2 ${isAwaitingReview ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              </div>

              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                <span className="text-[11px] font-mono text-indigo-400 block mb-1">3. CODER</span>
                <span className="text-xs font-semibold text-slate-200">Generate Code</span>
                <div className="w-2 h-2 rounded-full bg-slate-600 mx-auto mt-2" />
              </div>

              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                <span className="text-[11px] font-mono text-indigo-400 block mb-1">4. PR ENGINE</span>
                <span className="text-xs font-semibold text-slate-200">GitHub Pull Request</span>
                <div className="w-2 h-2 rounded-full bg-slate-600 mx-auto mt-2" />
              </div>
            </div>
          </div>

          {/* Budget Warning Banner if Circuit Breaker Tripped */}
          {isBudgetExceeded && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3 text-rose-300 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <span className="font-semibold block">Server-Side Token Circuit Breaker Tripped</span>
                <span>Pre-call check halted graph execution because tokens requested exceeded the budget ceiling limit.</span>
              </div>
            </div>
          )}

          {/* Prompt Box */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
              Requirement Prompt
            </label>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-sm text-indigo-200 leading-relaxed">
              "{task.task_prompt}"
            </div>
          </div>

          {/* Human-in-the-Loop Plan Review Action Box */}
          {isAwaitingReview && (
            <div className="p-5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-4">
              <div className="flex items-center space-x-2 text-indigo-300">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-semibold">Human-in-the-Loop Gate Action Required</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The Planner Agent has constructed the technical implementation plan. Review or add custom revision feedback below before approving code generation.
              </p>

              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Optional feedback for plan revision (e.g. 'Use 15-minute JWT expiration')"
                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => handleReview(true)}
                  disabled={submitting}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve Plan & Generate Code</span>
                </button>

                <button
                  onClick={() => handleReview(false)}
                  disabled={submitting}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Request Plan Revision</span>
                </button>
              </div>
            </div>
          )}

          {/* LLM Calls Ledger Table */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 block">
              `llm_calls` PostgreSQL Ledger Breakdown ({llmCalls.length} Invocations)
            </label>

            {llmCalls.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center text-xs text-slate-500 font-mono">
                No LLM calls recorded in PostgreSQL ledger yet.
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950/60 text-slate-400 font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-3">Node</th>
                      <th className="p-3">Model</th>
                      <th className="p-3">Prompt Tok</th>
                      <th className="p-3">Completion Tok</th>
                      <th className="p-3">Cost (USD)</th>
                      <th className="p-3">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {llmCalls.map((call) => (
                      <tr key={call.id} className="hover:bg-slate-800/40">
                        <td className="p-3 uppercase font-semibold text-indigo-400">{call.node_name}</td>
                        <td className="p-3 text-slate-200">{call.model}</td>
                        <td className="p-3">{call.prompt_tokens}</td>
                        <td className="p-3">{call.completion_tokens}</td>
                        <td className="p-3 text-emerald-400">${(call.cost_usd || 0).toFixed(6)}</td>
                        <td className="p-3 text-slate-400">{call.latency_ms}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
        <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
