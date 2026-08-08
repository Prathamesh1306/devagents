import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar.jsx';
import TaskForm from './components/TaskForm.jsx';
import TaskCard from './components/TaskCard.jsx';
import TaskDetailModal from './components/TaskDetailModal.jsx';
import { Cpu, CheckCircle2, Clock, Zap, RefreshCw, Server } from 'lucide-react';

const API_BASE = 'http://localhost:8005';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchTasks = async () => {
    try {
      // In part 1 endpoint, GET /health and task status polling
      const healthRes = await axios.get(`${API_BASE}/health`, { timeout: 3000 });
      setIsOnline(healthRes.status === 200);

      // Fetch active tasks from API
      // Since API GET /tasks is ready in FastAPI route:
      const res = await axios.get(`${API_BASE}/tasks/list`, { timeout: 3000 }).catch(() => null);
      if (res && res.data) {
        setTasks(res.data);
      }
    } catch (err) {
      setIsOnline(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 3000);
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
    if (filter === 'completed') return t.final_status?.toLowerCase() === 'completed';
    if (filter === 'running') return t.final_status?.toLowerCase() === 'running' || t.final_status?.toLowerCase() === 'pending';
    return true;
  });

  const totalTokens = tasks.reduce((acc, t) => acc + (t.tokens_used || 0), 0);
  const completedCount = tasks.filter(t => t.final_status?.toLowerCase() === 'completed').length;

  return (
    <div className="min-h-screen pb-16">
      <Navbar isOnline={isOnline} />

      <main className="max-w-7xl mx-auto px-6">
        {/* Top Hero / Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Total Graph Tasks</span>
              <span className="text-2xl font-bold text-slate-100 font-mono">{tasks.length}</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Completed PRs</span>
              <span className="text-2xl font-bold text-emerald-400 font-mono">{completedCount}</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
            <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Total Tokens Used</span>
              <span className="text-2xl font-bold text-violet-300 font-mono">{totalTokens.toLocaleString()}</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Control Plane Port</span>
              <span className="text-xl font-bold text-amber-300 font-mono">http://localhost:8005</span>
            </div>
          </div>
        </div>

        {/* Task Trigger Form */}
        <TaskForm onSubmit={handleCreateTask} loading={loading} />

        {/* Task List Header & Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-slate-100">Graph Execution History</h2>
            <span className="px-2.5 py-0.5 text-xs font-mono bg-slate-800 text-slate-400 rounded-full">
              {filteredTasks.length} Tasks
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors ${filter === 'all' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                All Tasks
              </button>
              <button
                onClick={() => setFilter('running')}
                className={`px-3 py-1 rounded-lg transition-colors ${filter === 'running' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Active / Running
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 py-1 rounded-lg transition-colors ${filter === 'completed' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Completed
              </button>
            </div>

            <button
              onClick={fetchTasks}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border border-slate-700/50 transition-colors"
              title="Refresh Task List"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Task Cards Grid */}
        {filteredTasks.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
            <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-slate-300 mb-1">No Agent Tasks Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Submit your first requirement prompt above to trigger DevAgents autonomous graph execution.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} onSelect={setSelectedTask} />
            ))}
          </div>
        )}
      </main>

      {/* Task Detail Inspection Modal */}
      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} onRefresh={fetchTasks} />
      )}
    </div>
  );
}
