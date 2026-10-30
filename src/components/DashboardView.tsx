import React, { useState } from 'react';
import {
  Layers,
  Cpu,
  HardDrive,
  PlayCircle,
  StopCircle,
  XCircle,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  History,
  CheckCircle2,
  Clock,
  Radio,
  Server,
  Terminal,
  Activity as ActivityIcon,
  HelpCircle,
  Check,
  AlertCircle,
  Zap,
} from 'lucide-react';
import {
  SystemStats,
  ProcessItem,
  AlertItem,
  ActivityItem,
  ProcessState,
  DeploymentEnvironment,
} from '../types/process.ts';
import { stopProcess, terminateProcess } from '../services/api.ts';

interface DashboardViewProps {
  stats: SystemStats;
  processes: ProcessItem[];
  alerts: AlertItem[];
  activity: ActivityItem[];
  isBackendConnected: boolean;
  deploymentEnvironment: DeploymentEnvironment;
  onEnvironmentChange: (env: DeploymentEnvironment) => void;
  onRefresh: () => void;
  onNavigateToProcesses: () => void;
  onNavigateToAlerts: () => void;
  onNavigateToActivity: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  processes,
  alerts,
  activity,
  isBackendConnected,
  deploymentEnvironment,
  onEnvironmentChange,
  onRefresh,
  onNavigateToProcesses,
  onNavigateToAlerts,
  onNavigateToActivity,
}) => {
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [terminateTarget, setTerminateTarget] = useState<ProcessItem | null>(null);

  // Top 6 processes sorted by CPU then Memory
  const topProcesses = [...processes]
    .sort((a, b) => b.cpu - a.cpu || b.memory - a.memory)
    .slice(0, 6);

  // Latest 4 activity entries from real /api/activity
  const recentActivities = activity.slice(0, 4);

  const deploymentOptions: { name: DeploymentEnvironment; desc: string }[] = [
    {
      name: 'College Computer Lab',
      desc: 'LPMS can be deployed to monitor Linux workstations in a college computer lab.',
    },
    {
      name: 'School Computer Lab',
      desc: 'LPMS can be deployed to monitor Linux workstations in a school computer lab.',
    },
    {
      name: 'Department Linux Server',
      desc: 'LPMS can be deployed to monitor a department Linux server.',
    },
    {
      name: 'Institution Linux Server',
      desc: 'LPMS can be deployed to monitor an institution Linux server.',
    },
  ];

  const handleStop = async (proc: ProcessItem) => {
    setActionInProgress(proc.pid);
    setNotice(null);
    try {
      const res = await stopProcess(proc.pid);
      if (res.success) {
        setNotice({ type: 'success', message: res.message });
        onRefresh();
      } else {
        setNotice({ type: 'error', message: res.message });
      }
    } catch (err) {
      setNotice({
        type: 'error',
        message: `Failed to stop process ${proc.pid}.`,
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleTerminateConfirm = async () => {
    if (!terminateTarget) return;
    const target = terminateTarget;
    setTerminateTarget(null);
    setActionInProgress(target.pid);
    setNotice(null);

    try {
      const res = await terminateProcess(target.pid);
      if (res.success) {
        setNotice({ type: 'success', message: res.message });
        onRefresh();
      } else {
        setNotice({ type: 'error', message: res.message });
      }
    } catch (err) {
      setNotice({
        type: 'error',
        message: `Failed to terminate process ${target.pid}.`,
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const renderStatusBadge = (state: ProcessState) => {
    switch (state) {
      case 'Running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Running
          </span>
        );
      case 'Stopped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Stopped
          </span>
        );
      case 'Zombie':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Zombie
          </span>
        );
      case 'Sleeping':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Sleeping
          </span>
        );
    }
  };

  const renderActivityBadge = (event: string) => {
    switch (event) {
      case 'STOPPED':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            STOPPED
          </span>
        );
      case 'TERMINATED':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            TERMINATED
          </span>
        );
      case 'HIGH_CPU':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            HIGH_CPU
          </span>
        );
      case 'HIGH_MEMORY':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            HIGH_MEMORY
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
            {event}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Banner */}
      {notice && (
        <div
          className={`text-xs px-4 py-3 rounded-xl border flex items-center justify-between shadow-2xs transition-all ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{notice.message}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A1A2E] tracking-tight">
                LPMS — Linux Process Management System
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
              Linux System Administration Portal
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5 shrink-0">
            {/* System Online / Backend Offline */}
            {isBackendConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                System Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Backend Offline
              </span>
            )}

            {/* LIVE indicator */}
            {stats.monitoringEnabled && isBackendConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#16213E] text-white border border-[#533483] shadow-2xs">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                MONITORING PAUSED
              </span>
            )}

            {/* Active Deployment Context Tag */}
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <Server className="w-3 h-3 text-[#533483]" />
              {deploymentEnvironment}
            </span>
          </div>
        </div>

        {/* Backend Offline Warning (shown only when offline) */}
        {!isBackendConnected && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Backend server is offline on port 8080. Start the process monitor in your terminal:{' '}
              <code className="font-mono font-bold bg-rose-100 px-1.5 py-0.5 rounded text-rose-950">
                cd backend &amp;&amp; java ProcessAPI
              </code>
            </span>
          </div>
        )}
      </div>

      {/* 2. Four Summary Cards (Visually Consistent & Equal Height) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Processes */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-[#A78BFA]/60 transition-all flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Processes
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-700 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#1A1A2E] font-mono leading-none">
              {stats.totalProcesses}
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              Active kernel processes
            </p>
          </div>
        </div>

        {/* Card 2: Running Processes */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-[#A78BFA]/60 transition-all flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Running Processes
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-600 font-mono leading-none">
              {stats.runningProcesses}
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              Kernel state 'R' (Running)
            </p>
          </div>
        </div>

        {/* Card 3: CPU Usage */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-[#A78BFA]/60 transition-all flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              CPU Usage
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#533483]/10 border border-[#533483]/20 flex items-center justify-center text-[#533483] shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#1A1A2E] font-mono leading-none">
              {stats.cpuUsage.toFixed(1)}%
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#533483] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(Math.max(stats.cpuUsage, 0), 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              Host CPU utilization
            </p>
          </div>
        </div>

        {/* Card 4: Memory Usage */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-[#A78BFA]/60 transition-all flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Memory Usage
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#A78BFA]/20 border border-[#A78BFA]/30 flex items-center justify-center text-[#533483] shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#1A1A2E] font-mono leading-none">
              {stats.memoryUsage.toFixed(1)}%
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#A78BFA] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(Math.max(stats.memoryUsage, 0), 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              Physical RAM allocated
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Section: Live Process Monitoring + System Overview (Two-Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Process Monitoring (7 cols) - Main Focus */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#1A1A2E] tracking-tight">
                  Live Process Monitoring
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time active processes with administrative Stop and Terminate controls
                </p>
              </div>

              <button
                onClick={onNavigateToProcesses}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#533483] hover:text-[#16213E] transition-colors bg-[#533483]/10 hover:bg-[#533483]/15 px-3 py-1.5 rounded-lg"
              >
                <span>View All Processes →</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#1A1A2E] text-slate-200 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3 rounded-l-lg">PID</th>
                    <th className="py-2.5 px-3">Process Name</th>
                    <th className="py-2.5 px-3">CPU %</th>
                    <th className="py-2.5 px-3">Memory %</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProcesses.length > 0 ? (
                    topProcesses.map((proc) => {
                      const isProcessing = actionInProgress === proc.pid;
                      return (
                        <tr key={proc.pid} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-xs font-bold text-[#1A1A2E]">
                            {proc.pid}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200/70">
                              {proc.name}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs text-slate-700 font-semibold">
                            {proc.cpu.toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs text-slate-700 font-semibold">
                            {proc.memory.toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-3">
                            {renderStatusBadge(proc.state)}
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleStop(proc)}
                              disabled={isProcessing || !isBackendConnected || proc.state === 'Stopped'}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold rounded border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 transition-colors"
                              title="SIGSTOP (Pause process)"
                            >
                              <StopCircle className="w-3 h-3" />
                              <span>{isProcessing ? '...' : 'Stop'}</span>
                            </button>
                            <button
                              onClick={() => setTerminateTarget(proc)}
                              disabled={isProcessing || !isBackendConnected}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold rounded border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 transition-colors"
                              title="SIGTERM (Terminate process)"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>{isProcessing ? '...' : 'Terminate'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                        {isBackendConnected
                          ? 'Loading Linux processes from backend...'
                          : 'Backend offline. Run "java ProcessAPI" on port 8080.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing top {topProcesses.length} high-load processes</span>
            <span className="font-mono text-[11px]">Command: ps -eo pid,args,%cpu,%mem,state</span>
          </div>
        </div>

        {/* Right Column: System Overview (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#1A1A2E] tracking-tight">
                  System Overview
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Host hardware telemetry and service health
                </p>
              </div>
              <span className="text-[10px] font-bold font-mono text-[#533483] bg-[#533483]/10 px-2 py-0.5 rounded uppercase">
                /proc Telemetry
              </span>
            </div>

            {/* 1. CPU Usage Bar */}
            <div className="space-y-1.5 mb-5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#533483]" />
                  CPU Usage
                </span>
                <span className="font-mono text-[#1A1A2E] font-bold text-sm">
                  {stats.cpuUsage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-2.5 rounded-full transition-all duration-500 bg-gradient-to-r from-[#533483] to-[#A78BFA]"
                  style={{ width: `${Math.min(Math.max(stats.cpuUsage, 0), 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0% (Idle)</span>
                <span>100% (Full Load)</span>
              </div>
            </div>

            {/* 2. Memory Usage Bar */}
            <div className="space-y-1.5 mb-5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-[#533483]" />
                  Memory Usage
                </span>
                <span className="font-mono text-[#1A1A2E] font-bold text-sm">
                  {stats.memoryUsage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-2.5 rounded-full transition-all duration-500 bg-gradient-to-r from-[#16213E] to-[#A78BFA]"
                  style={{ width: `${Math.min(Math.max(stats.memoryUsage, 0), 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0% (Available)</span>
                <span>100% (Allocated)</span>
              </div>
            </div>

            {/* 3. Operational Overview Cards */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Monitoring */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Monitoring</p>
                <p className="text-xs font-bold text-[#1A1A2E] mt-1 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${stats.monitoringEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                  {stats.monitoringEnabled ? 'Active Telemetry' : 'Paused'}
                </p>
              </div>

              {/* Refresh */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Refresh</p>
                <p className="text-xs font-bold text-[#1A1A2E] mt-1 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#533483]" />
                  {stats.refreshInterval} seconds
                </p>
              </div>
            </div>
          </div>

          {/* Backend Status Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-700">
            <span className="flex items-center gap-1.5 font-medium">
              <Server className="w-3.5 h-3.5 text-[#533483]" />
              Backend
            </span>
            <span
              className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                isBackendConnected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {isBackendConnected ? 'Java API :8080 Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Active Alerts + Recent Activity (Two-Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-[#533483]" />
                <h4 className="text-sm font-bold text-[#1A1A2E]">Active Alerts</h4>
                {alerts.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    {alerts.length} Active
                  </span>
                )}
              </div>

              <button
                onClick={onNavigateToAlerts}
                className="text-xs font-bold text-[#533483] hover:text-[#16213E] inline-flex items-center space-x-1"
              >
                <span>View All Alerts →</span>
              </button>
            </div>

            {alerts.length === 0 ? (
              <div className="p-5 bg-emerald-50/70 border border-emerald-200/70 rounded-xl text-xs text-emerald-800 flex items-center space-x-3 my-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-[#1A1A2E]">✓ No active alerts</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    All processes are operating within configured CPU &amp; RAM safety thresholds.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 my-2">
                {alerts.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#1A1A2E]">{a.type}</span>
                          <span className="text-[10px] font-mono bg-amber-200/60 px-1.5 py-0.2 rounded font-semibold text-amber-900">
                            Threshold: {a.threshold}%
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                          PID {a.pid} ({a.name}) • Current: <span className="font-bold text-amber-800">{a.value.toFixed(1)}%</span> {a.metric}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 whitespace-nowrap">{a.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            Monitors real-time CPU &amp; RAM threshold spikes across active Linux processes.
          </p>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-[#533483]" />
                <h4 className="text-sm font-bold text-[#1A1A2E]">Recent Activity</h4>
              </div>

              <button
                onClick={onNavigateToActivity}
                className="text-xs font-bold text-[#533483] hover:text-[#16213E] inline-flex items-center space-x-1"
              >
                <span>View Activity Log →</span>
              </button>
            </div>

            {recentActivities.length === 0 ? (
              <div className="p-5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-500 flex items-center space-x-3 my-2">
                <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="font-bold text-slate-700">No activity recorded yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Entries from process interventions (Stop, Terminate) will be recorded in <code className="font-mono text-slate-600">logs/activity.log</code>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 my-2">
                {recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs flex items-center justify-between hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="font-mono text-[11px] text-slate-500 whitespace-nowrap shrink-0">
                        {act.timestamp.split(' ')[1] || act.timestamp}
                      </span>
                      {renderActivityBadge(act.event)}
                      <span className="font-mono text-slate-800 truncate">
                        PID {act.pid} ({act.processName})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            Real audit trail of process stops, terminations, and threshold alerts from <code className="font-mono text-[10px]">logs/activity.log</code>.
          </p>
        </div>
      </div>

      {/* 5. Deployment Profiles Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-[#1A1A2E] tracking-tight">
              Deployment Profiles
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an operational deployment profile for the current workstation monitoring session.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#533483] font-semibold bg-[#533483]/10 px-2.5 py-1 rounded-full">
            <Server className="w-3 h-3" />
            4 Supported Profiles
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
          {deploymentOptions.map((opt) => {
            const isSelected = deploymentEnvironment === opt.name;
            return (
              <button
                key={opt.name}
                onClick={() => onEnvironmentChange(opt.name)}
                className={`text-left p-4 rounded-xl border transition-all relative ${
                  isSelected
                    ? 'bg-[#533483]/5 border-[#533483] shadow-xs ring-1 ring-[#533483]/30'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${isSelected ? 'text-[#533483]' : 'text-[#1A1A2E]'}`}>
                    {opt.name}
                  </span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-[#533483] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {opt.desc}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>These are deployment environments for LPMS. For the current prototype, all live data comes from the host Linux system running ProcessAPI.</span>
          </span>
          <span className="font-mono text-[11px] text-slate-500 shrink-0 ml-2">
            Active: <strong className="text-slate-700">{deploymentEnvironment}</strong>
          </span>
        </div>
      </div>

      {/* 6. How It Works Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <h3 className="text-base font-bold text-[#1A1A2E] tracking-tight mb-1">
          How It Works
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          End-to-end data pipeline from host Linux kernel interfaces to the LPMS real-time administration dashboard.
        </p>

        {/* Visual Pipeline Flow */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Step 1 */}
          <div className="bg-[#1A1A2E] text-white rounded-xl p-3.5 text-center flex flex-col justify-center items-center shadow-xs">
            <Terminal className="w-5 h-5 text-[#A78BFA] mb-1.5" />
            <span className="text-xs font-bold leading-tight">Linux System</span>
            <span className="text-[10px] text-slate-400 mt-1 font-mono">Host OS / WSL</span>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center flex flex-col justify-center items-center">
            <Layers className="w-5 h-5 text-[#533483] mb-1.5" />
            <span className="text-xs font-bold text-[#1A1A2E] leading-tight">Running Processes</span>
            <span className="text-[10px] text-slate-500 mt-1 font-mono">ps command</span>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center flex flex-col justify-center items-center">
            <ActivityIcon className="w-5 h-5 text-[#533483] mb-1.5" />
            <span className="text-xs font-bold text-[#1A1A2E] leading-tight">CPU &amp; Memory</span>
            <span className="text-[10px] text-slate-500 mt-1 font-mono">/proc filesystem</span>
          </div>

          {/* Step 4 */}
          <div className="bg-[#16213E] text-white rounded-xl p-3.5 text-center flex flex-col justify-center items-center shadow-xs">
            <Server className="w-5 h-5 text-emerald-400 mb-1.5" />
            <span className="text-xs font-bold leading-tight">Java ProcessAPI</span>
            <span className="text-[10px] text-slate-300 mt-1 font-mono">REST API :8080</span>
          </div>

          {/* Step 5 */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center flex flex-col justify-center items-center">
            <Zap className="w-5 h-5 text-[#533483] mb-1.5" />
            <span className="text-xs font-bold text-[#1A1A2E] leading-tight">LPMS Dashboard</span>
            <span className="text-[10px] text-slate-500 mt-1 font-mono">React + Vite</span>
          </div>

          {/* Step 6 */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center flex flex-col justify-center items-center">
            <ShieldAlert className="w-5 h-5 text-amber-600 mb-1.5" />
            <span className="text-xs font-bold text-[#1A1A2E] leading-tight">Alerts &amp; Activity</span>
            <span className="text-[10px] text-slate-500 mt-1 font-mono">activity.log</span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Process Termination */}
      {terminateTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4 animate-scale-in">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center border border-rose-200">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Process Termination</h3>
                <p className="text-xs text-slate-500">Signal: SIGTERM (kill -TERM)</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
              <p className="text-slate-600">
                Are you sure you want to terminate this process?
              </p>
              <div className="font-mono text-slate-900 pt-1">
                <span className="font-semibold text-slate-500">PID:</span> {terminateTarget.pid}
                <br />
                <span className="font-semibold text-slate-500">Name:</span> {terminateTarget.name}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setTerminateTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTerminateConfirm}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Terminate Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
