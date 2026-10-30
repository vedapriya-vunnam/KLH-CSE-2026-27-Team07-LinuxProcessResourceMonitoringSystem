import React from 'react';
import { ShieldAlert, CheckCircle2, Cpu, HardDrive, AlertTriangle } from 'lucide-react';
import { AlertItem } from '../types/process.ts';

interface AlertsViewProps {
  alerts: AlertItem[];
  cpuThreshold: number;
  memoryThreshold: number;
  onNavigateToSettings: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  cpuThreshold,
  memoryThreshold,
  onNavigateToSettings,
}) => {
  return (
    <div className="space-y-6">
      {/* Heading Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A1A2E] tracking-tight">
            LPMS — System Resource Alerts
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
            Linux System Administration Portal • Live Threshold Telemetry
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs font-mono bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg">
            CPU &gt;= {cpuThreshold}%
          </span>
          <span className="text-xs font-mono bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg">
            RAM &gt;= {memoryThreshold}%
          </span>
          <button
            onClick={onNavigateToSettings}
            className="text-xs font-bold text-[#533483] hover:text-[#16213E] underline ml-1.5"
          >
            Adjust Thresholds
          </button>
        </div>
      </div>

      {/* Main Alert List */}
      {alerts.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 shadow-xs text-center">
          <div className="max-w-sm mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#1A1A2E]">
              No active alerts
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              All active Linux processes are operating within safe resource thresholds (CPU &lt; {cpuThreshold}%, RAM &lt; {memoryThreshold}%).
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {alerts.map((alert) => {
            const isCpu = alert.metric === 'CPU' || alert.type.toLowerCase().includes('cpu');
            return (
              <div
                key={alert.id}
                className="bg-white border border-amber-200/80 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isCpu ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {isCpu ? <Cpu className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-[#1A1A2E]">
                        {alert.type}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Exceeds Threshold
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 font-mono">
                      PID <span className="font-bold text-[#1A1A2E]">{alert.pid}</span> ({alert.name}) is using{' '}
                      <span className="font-bold text-amber-700">{alert.value.toFixed(1)}%</span> {alert.metric}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Triggered At</span>
                    <span className="text-xs font-mono font-medium text-slate-700">
                      {alert.time}
                    </span>
                  </div>

                  <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#16213E] text-white">
                    {alert.value.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
