import React from 'react';
import { History, FileText, StopCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { ActivityItem } from '../types/process.ts';

interface ActivityViewProps {
  activity: ActivityItem[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  activity,
  onRefresh,
  isRefreshing,
}) => {
  const renderEventBadge = (event: string) => {
    switch (event) {
      case 'STOPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <StopCircle className="w-3 h-3 text-amber-600" />
            STOPPED
          </span>
        );
      case 'TERMINATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            TERMINATED
          </span>
        );
      case 'HIGH_CPU':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <AlertTriangle className="w-3 h-3 text-purple-600" />
            HIGH_CPU
          </span>
        );
      case 'HIGH_MEMORY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <AlertTriangle className="w-3 h-3 text-blue-600" />
            HIGH_MEMORY
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {event}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Heading Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A1A2E] tracking-tight">
            LPMS — System Activity Log
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
            Linux System Administration Portal • Audit Trail from <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono text-[11px]">logs/activity.log</code>
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-2xs self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#533483] ${isRefreshing ? 'animate-spin' : ''}`}
          />
          <span>Reload Logs</span>
        </button>
      </div>

      {/* Main Activity List */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {activity.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center border border-slate-200">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-base font-bold text-[#1A1A2E]">
              No activity recorded yet
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              When workstation processes are stopped, terminated, or trigger threshold alerts, entries will be appended to <code className="font-mono text-slate-700">logs/activity.log</code> and displayed here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#1A1A2E] text-slate-200 border-b border-[#16213E] text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">PID</th>
                  <th className="py-3 px-4">Process Name</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activity.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                      {item.timestamp}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderEventBadge(item.event)}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-[#1A1A2E] whitespace-nowrap">
                      PID {item.pid}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                        {item.processName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                      {item.action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
