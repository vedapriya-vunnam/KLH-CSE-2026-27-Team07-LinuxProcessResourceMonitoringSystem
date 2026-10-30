import React from 'react';
import { Sliders, CheckCircle, RotateCcw, Server } from 'lucide-react';
import { MonitorSettings, DeploymentEnvironment } from '../types/process.ts';

interface SettingsViewProps {
  settings: MonitorSettings;
  onUpdateSettings: (newSettings: Partial<MonitorSettings>) => void;
  onResetSettings: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  const envOptions: DeploymentEnvironment[] = [
    'College Computer Lab',
    'School Computer Lab',
    'Department Linux Server',
    'Institution Linux Server',
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header Info */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A2E] text-white flex items-center justify-center shadow-inner">
            <Sliders className="w-5 h-5 text-[#A78BFA]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#1A1A2E]">
              LPMS — System Administration Settings
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configuration is persisted in browser <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono text-[11px]">localStorage</code>.
            </p>
          </div>
        </div>

        <button
          onClick={onResetSettings}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          title="Reset to default settings (80% thresholds, 5s interval)"
        >
          <RotateCcw className="w-3 h-3 text-slate-500" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Settings Form Cards */}
      <div className="bg-white border border-slate-200/90 rounded-2xl divide-y divide-slate-100 shadow-xs">
        {/* 1. Deployment / Use-Case Environment */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 pr-6">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-[#533483]" />
              <label htmlFor="deployment-env-select" className="text-sm font-bold text-[#1A1A2E] cursor-pointer">
                Deployment / Use-Case Profile
              </label>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Selects the administrative deployment context. All real process information continues to stream from the host Linux/WSL system.
            </p>
          </div>
          <div>
            <select
              id="deployment-env-select"
              value={settings.deploymentEnvironment}
              onChange={(e) =>
                onUpdateSettings({ deploymentEnvironment: e.target.value as DeploymentEnvironment })
              }
              className="bg-slate-50 border border-slate-200 text-[#1A1A2E] text-xs font-bold rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-[#533483] focus:outline-none"
            >
              {envOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Monitoring Enabled */}
        <div className="p-6 flex items-center justify-between">
          <div className="space-y-1 pr-6">
            <label htmlFor="monitoring-toggle" className="text-sm font-bold text-[#1A1A2E] cursor-pointer">
              Monitoring Enabled
            </label>
            <p className="text-xs text-slate-500 leading-relaxed">
              When enabled, the dashboard actively polls the Java REST API for real-time Linux telemetry and threshold alerts.
            </p>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="monitoring-toggle"
                type="checkbox"
                checked={settings.monitoringEnabled}
                onChange={(e) =>
                  onUpdateSettings({ monitoringEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#533483]"></div>
            </label>
          </div>
        </div>

        {/* 3. CPU Threshold */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label htmlFor="cpu-range" className="text-sm font-bold text-[#1A1A2E]">
                CPU Threshold
              </label>
              <p className="text-xs text-slate-500">
                Workstation processes exceeding this CPU percentage trigger High CPU alerts. Default: 80%.
              </p>
            </div>
            <span className="text-sm font-bold font-mono text-[#533483] bg-[#533483]/10 px-2.5 py-1 rounded">
              {settings.cpuThreshold}%
            </span>
          </div>
          <input
            id="cpu-range"
            type="range"
            min="10"
            max="100"
            step="5"
            value={settings.cpuThreshold}
            onChange={(e) =>
              onUpdateSettings({ cpuThreshold: Number(e.target.value) })
            }
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#533483]"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
            <span>10% (Testing)</span>
            <span>50% (Moderate)</span>
            <span>80% (Default)</span>
            <span>100% (Critical)</span>
          </div>
        </div>

        {/* 4. Memory Threshold */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label htmlFor="mem-range" className="text-sm font-bold text-[#1A1A2E]">
                Memory Threshold
              </label>
              <p className="text-xs text-slate-500">
                Workstation processes exceeding this RAM percentage trigger High Memory alerts. Default: 80%.
              </p>
            </div>
            <span className="text-sm font-bold font-mono text-[#533483] bg-[#533483]/10 px-2.5 py-1 rounded">
              {settings.memoryThreshold}%
            </span>
          </div>
          <input
            id="mem-range"
            type="range"
            min="10"
            max="100"
            step="5"
            value={settings.memoryThreshold}
            onChange={(e) =>
              onUpdateSettings({ memoryThreshold: Number(e.target.value) })
            }
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#533483]"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
            <span>10% (Testing)</span>
            <span>50% (Moderate)</span>
            <span>80% (Default)</span>
            <span>100% (Critical)</span>
          </div>
        </div>

        {/* 5. Refresh Interval */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <label htmlFor="refresh-select" className="text-sm font-bold text-[#1A1A2E]">
              Refresh Interval
            </label>
            <p className="text-xs text-slate-500">
              Frequency of periodic REST polling from the Java backend. Default: 5 seconds.
            </p>
          </div>
          <div>
            <select
              id="refresh-select"
              value={settings.refreshInterval}
              onChange={(e) =>
                onUpdateSettings({ refreshInterval: Number(e.target.value) })
              }
              className="bg-white border border-slate-200 text-[#1A1A2E] text-xs font-semibold rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#533483] focus:outline-none"
            >
              <option value={2}>Every 2 seconds (Fast)</option>
              <option value={5}>Every 5 seconds (Default)</option>
              <option value={10}>Every 10 seconds (Standard)</option>
              <option value={30}>Every 30 seconds (Power Saver)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-2.5 text-xs text-slate-600">
        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          Settings are saved in browser <code className="font-mono">localStorage</code>. When changed, threshold alerts and polling frequency update immediately.
        </span>
      </div>
    </div>
  );
};
