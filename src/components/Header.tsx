import React from 'react';
import { RefreshCw, Radio, Terminal, Server, Activity } from 'lucide-react';
import { DeploymentEnvironment } from '../types/process.ts';

interface HeaderProps {
  isBackendConnected: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated: string;
  monitoringEnabled: boolean;
  refreshInterval: number;
  deploymentEnvironment: DeploymentEnvironment;
  onEnvironmentChange: (env: DeploymentEnvironment) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isBackendConnected,
  isRefreshing,
  onRefresh,
  lastUpdated,
  monitoringEnabled,
  refreshInterval,
  deploymentEnvironment,
  onEnvironmentChange,
}) => {
  const envOptions: DeploymentEnvironment[] = [
    'College Computer Lab',
    'School Computer Lab',
    'Department Linux Server',
    'Institution Linux Server',
  ];

  return (
    <header className="bg-white border-b border-slate-200/90 px-6 sm:px-8 py-3.5 sticky top-0 z-20 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Side: Exact Title & Subtitle */}
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#16213E] border border-[#533483]/40 text-[#A78BFA] flex items-center justify-center shrink-0 shadow-xs">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-[#1A1A2E] tracking-tight leading-tight">
                LPMS — Linux Process Management System
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Linux System Administration Portal
            </p>
          </div>
        </div>

        {/* Right Side: Deployment Context, Status Badges & Controls */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          {/* Deployment Environment Context Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <Server className="w-3.5 h-3.5 text-[#533483]" />
            <select
              value={deploymentEnvironment}
              onChange={(e) => onEnvironmentChange(e.target.value as DeploymentEnvironment)}
              className="bg-transparent font-semibold text-[#1A1A2E] text-xs focus:outline-none cursor-pointer"
              title="Deployment / Use-Case Environment"
            >
              {envOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Current Monitoring Status */}
          <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <Activity className="w-3.5 h-3.5 text-[#533483]" />
            <span className="font-medium">
              {monitoringEnabled ? 'Active Telemetry' : 'Monitoring Paused'}
            </span>
          </div>

          {/* System Online / Backend Offline Badge */}
          {isBackendConnected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              System Online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Backend Offline
            </span>
          )}

          {/* LIVE Indicator */}
          {monitoringEnabled && isBackendConnected ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#16213E] text-white border border-[#533483] shadow-2xs">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              LIVE
            </span>
          ) : !monitoringEnabled ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              ○ PAUSED
            </span>
          ) : null}

          {/* Refresh interval indicator */}
          <span className="hidden xl:inline-block text-[11px] text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
            {refreshInterval}s Polling
          </span>

          {/* Manual Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all active:scale-95 disabled:opacity-50"
            title={`Last updated: ${lastUpdated}`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#533483] ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
};
