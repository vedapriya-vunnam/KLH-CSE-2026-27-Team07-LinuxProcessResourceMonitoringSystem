import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Bell,
  Clock,
  Settings,
  Server,
  Terminal,
  Shield,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'processes' | 'alerts' | 'activity' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isBackendConnected: boolean;
  monitoringEnabled: boolean;
  alertCount?: number;
  processCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isBackendConnected,
  monitoringEnabled,
  alertCount = 0,
  processCount = 0,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'processes' as NavTab,
      label: 'Processes',
      icon: Cpu,
      badge: processCount > 0 ? String(processCount) : null,
    },
    {
      id: 'alerts' as NavTab,
      label: 'Alerts',
      icon: Bell,
      badge: alertCount > 0 ? String(alertCount) : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'activity' as NavTab,
      label: 'Activity',
      icon: Clock,
      badge: null,
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-[#1A1A2E] text-slate-200 border-r border-[#16213E] flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30 shadow-md">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#16213E] flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#16213E] border border-[#533483]/60 flex items-center justify-center shadow-inner shrink-0">
            <Server className="w-5 h-5 text-[#A78BFA]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-base font-extrabold text-white tracking-tight leading-none">
                LPMS
              </span>
              <span className="text-[10px] font-bold text-[#A78BFA] bg-[#533483]/40 px-1.5 py-0.5 rounded border border-[#A78BFA]/30 uppercase">
                Portal
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 leading-tight mt-1 truncate">
              Linux System Admin
            </p>
          </div>
        </div>

        {/* Section Heading */}
        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            System Navigation
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  isActive
                    ? 'bg-[#533483] text-white shadow-sm shadow-[#533483]/40 border border-[#A78BFA]/30'
                    : 'text-slate-300 hover:text-white hover:bg-[#16213E]/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#A78BFA]' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Host & Management Console Info */}
      <div className="p-4 border-t border-[#16213E] bg-[#16213E]/60 space-y-2.5 text-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-slate-300 font-semibold text-[11px]">
            <Shield className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>Host Administrator</span>
          </div>
          <div className="flex items-center space-x-1.5 pl-0.5">
            <span
              className={`w-2 h-2 rounded-full ${
                monitoringEnabled && isBackendConnected
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400'
              }`}
            ></span>
            <span className="text-[11px] font-medium text-slate-400">
              {monitoringEnabled ? 'Telemetry Active' : 'Polling Paused'}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-[#16213E]/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 font-mono text-[10px]">
            <Terminal className="w-3 h-3 text-[#A78BFA]" />
            Java REST API
          </span>
          <span
            className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-semibold ${
              isBackendConnected
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
            }`}
          >
            {isBackendConnected ? ':8080 Online' : ':8080 Offline'}
          </span>
        </div>
      </div>
    </aside>
  );
};
