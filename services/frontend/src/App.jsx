import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar.jsx';
import StatCard from './components/StatCard.jsx';
import TaskForm from './components/TaskForm.jsx';
import TaskCard from './components/TaskCard.jsx';
import InspectorPanel from './components/InspectorPanel.jsx';
import { Cpu, CheckCircle2, Zap, Clock, RefreshCw, Server, ShieldCheck, Activity } from 'lucide-react';

const API_BASE = 'http://localhost:8005';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [llmStatus, setLlmStatus] = useState(null);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');

  const fetchLLMStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tasks/llm/status`, { timeout: 3000 });
      if (res.data) {
        setLlmStatus(res.data);
      }
    } catch (err) {
      setLlmStatus({ provider: 'ollama', model: 'llama3.1', reachable: false });
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tasks/list`, { timeout: 3000 }).catch(() => null);
      if (res && res.data) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  };

  useEffect(() => {
    fetchLLMStatus();
    fetchTasks();
    const interval = setInterval(() => {
      fetchTasks();
      fetchLLMStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateTask = async (data) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/tasks`, data);
      if (res.data) {
        await fetchTasks();
      }
    } catch (err) {
      console.error("Failed to submit task:", err);
      alert("Failed to submit task to DevAgents Control Plane. Ensure API (port 8005) is running.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const status = (t.final_status || '').toLowerCase();
    if (filter === 'completed') return status === 'completed';
    if (filter === 'running') return status === 'running' || status === 'pending' || status === 'awaiting_human_review';
    if (filter === 'escalated') return status === 'escalated' || status === 'aborted';
    return true;
  });

  const totalTokens = tasks.reduce((acc, t) => acc + (t.tokens_used || 0), 0);
  const completedCount = tasks.filter(t => (t.final_status || '').toLowerCase() === 'completed').length;
  const runningCount = tasks.filter(t => ['running', 'pending', 'awaiting_human_review'].includes((t.final_status || '').toLowerCase())).length;

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex font-['Inter',sans-serif]">
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        llmStatus={llmStatus}
        onRefresh={() => { fetchTasks(); fetchLLMStatus(); }}
      />

      {/* Main Mission Control Canvas */}
      <div className="flex-1 ml-64 min-h-screen pb-16 px-8 pt-8">
        <main className="max-w-7xl mx-auto space-y-8">
          {/* Top Bar Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-outfit text-slate-100 tracking-tight">
                Mission Control Dashboard
              </h1>
              <p className="text-xs text-slate-400">
                Autonomous AI Multi-Agent Software Engineering Lifecycle
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                Target Repo: <span className="text-indigo-400 font-bold">Prathamesh1306/devagents</span>
              </span>
              <button
                onClick={() => { fetchTasks(); fetchLLMStatus(); }}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Refresh Status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4 Hero Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Total Graph Tasks"
              value={tasks.length}
              subtitle="All graph executions"
              icon={Cpu}
              color="indigo"
            />
            <StatCard
              title="Active Running Agents"
              value={runningCount}
              subtitle="In execution graph"
              icon={Activity}
              color="cyan"
            />
            <StatCard
              title="Completed PRs"
              value={completedCount}
              subtitle="Code & tests verified"
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              title="Total Tokens Used"
              value={totalTokens.toLocaleString()}
              subtitle="Ollama local tokens"
              icon={Zap}
              color="amber"
            />
          </div>

          {/* Task Execution Form */}
          <TaskForm onSubmit={handleCreateTask} loading={loading} llmStatus={llmStatus} />

          {/* Task List Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-bold font-outfit text-slate-100">Live Agent Missions</h2>
                <span className="px-2.5 py-0.5 text-xs font-mono bg-slate-900 text-indigo-400 border border-slate-800 rounded-full font-bold">
                  {filteredTasks.length} Missions
                </span>
              </div>

              {/* Filter Pills */}
              <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                {[
                  { key: 'all', label: 'All Missions' },
                  { key: 'running', label: 'Active / Running' },
                  { key: 'completed', label: 'Completed' },
                  { key: 'escalated', label: 'Escalated / Failed' },
                ].map((btn) => (
                  <button
                    key={btn.key}
                    onClick={() => setFilter(btn.key)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filter === btn.key
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Grid */}
            {filteredTasks.length === 0 ? (
              <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
                <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-base font-bold text-slate-300 mb-1">No Active Missions</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Execute your first software engineering mission prompt above to trigger DevAgents autonomous graph execution.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onSelect={setSelectedTask} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Right Slide-in Inspector Panel */}
      {selectedTask && (
        <InspectorPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onRefresh={fetchTasks}
        />
      )}
    </div>
  );
}
