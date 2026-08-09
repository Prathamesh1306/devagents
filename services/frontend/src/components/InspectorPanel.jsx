import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Cpu, CheckCircle2, Send, MessageSquare, AlertTriangle, GitPullRequest, ExternalLink, ShieldCheck } from 'lucide-react';
import AgentPipeline from './AgentPipeline.jsx';
import CodeViewer from './CodeViewer.jsx';
import TestResults from './TestResults.jsx';
import LiveLog from './LiveLog.jsx';

const API_BASE = 'http://localhost:8005';

export default function InspectorPanel({ task, onClose, onRefresh }) {
  const [llmCalls, setLlmCalls] = useState([]);
  const [checkpointState, setCheckpointState] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline', 'code', 'tests', 'logs', 'ledger'

  useEffect(() => {
    if (task && task.id) {
      // Fetch LLM call ledger
      axios.get(`${API_BASE}/tasks/${task.id}/llm-calls`)
        .then(res => setLlmCalls(res.data))
        .catch(() => setLlmCalls([]));

      // Fetch task detail checkpoint state
      axios.get(`${API_BASE}/tasks/${task.id}`)
        .then(res => {
          if (res.data && res.data.checkpoint) {
            setCheckpointState(res.data.checkpoint);
          }
        })
        .catch(() => setCheckpointState(null));
    }
  }, [task]);

  if (!task) return null;

  const isAwaitingReview = task.final_status?.toLowerCase() === 'awaiting_human_review';
  const isEscalated = task.final_status?.toLowerCase() === 'escalated';
  const isBudgetExceeded = task.final_status?.toLowerCase() === 'failed_budget_exceeded';

  const generatedCode = checkpointState?.generated_code || null;
  const testResults = checkpointState?.test_results || null;
  const logs = checkpointState?.logs || task.logs || [];

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
      alert("Failed to submit review decision.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-[#0a0e17]/95 backdrop-blur-2xl border-l border-slate-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Inspector Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl text-white shadow-md">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-outfit text-slate-100">Task Mission Inspector</h3>
            <p className="text-[11px] font-mono text-slate-400">ID: {task.id}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center border-b border-slate-800/80 bg-slate-900/60 px-5 text-xs font-semibold">
        {[
          { id: 'pipeline', label: 'Pipeline' },
          { id: 'code', label: 'Generated Code' },
          { id: 'tests', label: 'Test Results' },
          { id: 'logs', label: 'Live Logs' },
          { id: 'ledger', label: 'LLM Cost Ledger' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body Content */}
      <div className="p-6 overflow-y-auto space-y-6 flex-1">
        {/* Requirement Prompt */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
            Requirement Prompt
          </span>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-indigo-200 leading-relaxed">
            "{task.task_prompt}"
          </div>
        </div>

        {/* Human Review Banner */}
        {isAwaitingReview && (
          <div className="p-5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-300">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Human HITL Gate — Decision Required</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Planner has generated the technical architecture plan. Review or specify feedback before code generation starts.
            </p>
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Optional revision instructions (e.g. 'Use 15min expiry on JWT')"
              className="w-full bg-slate-900 border border-slate-700/60 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <div className="flex items-center space-x-3 pt-1">
              <button
                onClick={() => handleReview(true)}
                disabled={submitting}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Plan & Coding</span>
              </button>
              <button
                onClick={() => handleReview(false)}
                disabled={submitting}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Request Plan Revision</span>
              </button>
            </div>
          </div>
        )}

        {/* Escalation Banner */}
        {isEscalated && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-xs text-rose-300">
            <div className="flex items-center space-x-2 font-bold uppercase tracking-wider text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Human Escalation Triggered</span>
            </div>
            <p>Automated retries exhausted. Review the failing traceback in Test Results and reset task with updated instructions.</p>
          </div>
        )}

        {/* Budget Exceeded Banner */}
        {isBudgetExceeded && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-3 text-xs text-amber-300">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold block uppercase tracking-wider">Token Budget Circuit Breaker Tripped</span>
              <span>Execution halted to prevent cost runaways. Token budget ceiling reached.</span>
            </div>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'pipeline' && (
          <div className="space-y-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Node Execution Flow
            </span>
            <AgentPipeline status={task.final_status} />
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Multi-File Code Output
            </span>
            <CodeViewer generatedCode={generatedCode} />
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Sandbox Test Results
            </span>
            <TestResults testResults={testResults} />
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Execution History Logs
            </span>
            <LiveLog logs={logs} />
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              LLM Invocations Cost Ledger ({llmCalls.length} calls)
            </span>
            {llmCalls.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center text-xs text-slate-500 font-mono">
                No LLM calls recorded in PostgreSQL ledger.
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left font-mono">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="p-2.5">Node</th>
                      <th className="p-2.5">Model</th>
                      <th className="p-2.5">Prompt Tok</th>
                      <th className="p-2.5">Comp Tok</th>
                      <th className="p-2.5">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
                    {llmCalls.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/40">
                        <td className="p-2.5 uppercase font-bold text-indigo-400">{c.node_name}</td>
                        <td className="p-2.5 text-slate-200">{c.model}</td>
                        <td className="p-2.5">{c.prompt_tokens}</td>
                        <td className="p-2.5">{c.completion_tokens}</td>
                        <td className="p-2.5 text-emerald-400">${(c.cost_usd || 0).toFixed(6)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
        <button
          onClick={onClose}
          className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
        >
          Close Inspector
        </button>
      </div>
    </div>
  );
}
