import React, { useState } from 'react';
import { Search, StopCircle, XCircle, RefreshCw, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ProcessItem, ProcessState } from '../types/process.ts';
import { stopProcess, terminateProcess } from '../services/api.ts';

interface ProcessesViewProps {
  processes: ProcessItem[];
  isBackendConnected: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const ProcessesView: React.FC<ProcessesViewProps> = ({
  processes,
  isBackendConnected,
  onRefresh,
  isRefreshing,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  
  // Confirmation state for termination
  const [terminateTarget, setTerminateTarget] = useState<ProcessItem | null>(null);

  // Search filter matching PID or Process Name
  const filteredProcesses = processes.filter((proc) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      proc.pid.toString().includes(term) ||
      proc.name.toLowerCase().includes(term)
    );
  });

  const handleStop = async (proc: ProcessItem) => {
    setActionInProgress(proc.pid);
    setNotice(null);
    try {
      const res = await stopProcess(proc.pid);
      if (res.success) {
        setNotice({ type: 'success', message: res.message });
        // Immediately trigger refresh so the state updates
        onRefresh();
      } else {
        setNotice({ type: 'error', message: res.message });
      }
    } catch (err) {
      setNotice({
        type: 'error',
        message: `Failed to stop process ${proc.pid}. Please check backend logs.`,
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
        message: `Failed to terminate process ${target.pid}. Please check backend logs.`,
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const renderStateBadge = (state: ProcessState) => {
    switch (state) {
      case 'Running':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Running
          </span>
        );
      case 'Stopped':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Stopped
          </span>
        );
      case 'Zombie':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Zombie
          </span>
        );
      case 'Sleeping':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Sleeping
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Heading Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A1A2E] tracking-tight">
            LPMS — Process Management Console
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
            Linux System Administration Portal • Live Process Inspection &amp; Signal Controls
          </p>
        </div>

        <span className="text-xs font-mono bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg shrink-0">
          Source: ps -eo pid,args,%cpu,%mem,state
        </span>
      </div>

      {/* Action Notification Banner */}
      {notice && (
        <div
          className={`text-xs px-4 py-3 rounded-xl border flex items-center justify-between shadow-xs transition-all ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{notice.message}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Backend Offline Banner */}
      {!isBackendConnected && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-rose-800 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-900">
              Cannot control processes — Java backend is offline
            </p>
            <p className="mt-0.5 text-rose-700">
              Run <code className="font-mono bg-rose-100 px-1 py-0.5 rounded text-rose-950 font-bold">java ProcessAPI</code> in the backend folder to enable process controls.
            </p>
          </div>
        </div>
      )}

      {/* Search Bar + Controls */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by PID or process name (e.g. java, sleep)..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#533483] focus:border-transparent transition-all"
          />
        </div>

        {/* Count & Reload button */}
        <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-slate-500 font-medium">
            Processes: <strong className="text-[#1A1A2E] font-mono">{filteredProcesses.length}</strong>
            {searchTerm && ` (of ${processes.length})`}
          </span>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#533483] ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Process Monitoring Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#1A1A2E] text-slate-200 border-b border-[#16213E] text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">PID</th>
                <th className="py-3.5 px-4">Process Name</th>
                <th className="py-3.5 px-4">CPU %</th>
                <th className="py-3.5 px-4">Memory %</th>
                <th className="py-3.5 px-4">State</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProcesses.length > 0 ? (
                filteredProcesses.map((proc) => {
                  const isProcessing = actionInProgress === proc.pid;
                  return (
                    <tr
                      key={proc.pid}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* PID */}
                      <td className="py-3 px-4 font-mono text-xs font-bold text-[#1A1A2E]">
                        {proc.pid}
                      </td>

                      {/* Process Name */}
                      <td className="py-3 px-4 font-medium text-slate-800">
                        <span className="font-mono text-xs text-[#16213E] bg-slate-100 px-2 py-0.5 rounded border border-slate-200/70">
                          {proc.name}
                        </span>
                      </td>

                      {/* CPU % */}
                      <td className="py-3 px-4 font-mono text-xs font-medium text-slate-700">
                        {proc.cpu.toFixed(1)}%
                      </td>

                      {/* Memory % */}
                      <td className="py-3 px-4 font-mono text-xs font-medium text-slate-700">
                        {proc.memory.toFixed(1)}%
                      </td>

                      {/* State */}
                      <td className="py-3 px-4">
                        {renderStateBadge(proc.state)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleStop(proc)}
                          disabled={isProcessing || !isBackendConnected || proc.state === 'Stopped'}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 transition-colors"
                          title="Execute kill -STOP on this process"
                        >
                          <StopCircle className="w-3 h-3" />
                          <span>{isProcessing ? 'Stopping...' : 'Stop'}</span>
                        </button>

                        <button
                          onClick={() => setTerminateTarget(proc)}
                          disabled={isProcessing || !isBackendConnected}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 transition-colors"
                          title="Execute kill -TERM on this process"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>{isProcessing ? 'Ending...' : 'Terminate'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-2">
                      <p className="text-sm font-semibold text-slate-800">
                        {searchTerm ? 'No matching processes found' : 'No processes returned'}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {searchTerm
                          ? `No processes matched "${searchTerm}". Try a different PID or name.`
                          : isBackendConnected
                          ? 'Waiting for Linux processes from ps command...'
                          : 'The Java backend is currently offline. Please run "javac ProcessAPI.java && java ProcessAPI" in the backend directory.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
