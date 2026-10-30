import { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ProcessesView } from './components/ProcessesView.tsx';
import { AlertsView } from './components/AlertsView.tsx';
import { ActivityView } from './components/ActivityView.tsx';
import { SettingsView } from './components/SettingsView.tsx';

import {
  ProcessItem,
  AlertItem,
  ActivityItem,
  SystemStats,
  MonitorSettings,
  SystemResourceUsage,
  DeploymentEnvironment,
} from './types/process.ts';
import {
  getProcesses,
  getSystemStats,
  getAlerts,
  getActivity,
  checkBackendHealth,
} from './services/api.ts';

const SETTINGS_STORAGE_KEY = 'lpms_portal_settings_v2';

const DEFAULT_SETTINGS: MonitorSettings = {
  monitoringEnabled: true,
  cpuThreshold: 80,
  memoryThreshold: 80,
  refreshInterval: 5, // Default 5 seconds
  deploymentEnvironment: 'College Computer Lab',
};

function loadStoredSettings(): MonitorSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validEnvs: DeploymentEnvironment[] = [
        'College Computer Lab',
        'School Computer Lab',
        'Department Linux Server',
        'Institution Linux Server',
      ];
      return {
        monitoringEnabled: typeof parsed.monitoringEnabled === 'boolean' ? parsed.monitoringEnabled : true,
        cpuThreshold: typeof parsed.cpuThreshold === 'number' ? parsed.cpuThreshold : 80,
        memoryThreshold: typeof parsed.memoryThreshold === 'number' ? parsed.memoryThreshold : 80,
        refreshInterval: typeof parsed.refreshInterval === 'number' ? parsed.refreshInterval : 5,
        deploymentEnvironment: validEnvs.includes(parsed.deploymentEnvironment)
          ? parsed.deploymentEnvironment
          : 'College Computer Lab',
      };
    }
  } catch (ignored) {}
  return DEFAULT_SETTINGS;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Connecting...');

  // Real Linux Process & System State
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [systemResource, setSystemResource] = useState<SystemResourceUsage>({
    cpuUsage: 0.0,
    memoryUsage: 0.0,
  });
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  // Settings with LocalStorage persistence
  const [settings, setSettings] = useState<MonitorSettings>(loadStoredSettings);

  const isFetchingRef = useRef(false);

  // Fetch all monitoring metrics from Java REST API
  const fetchData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsRefreshing(true);

    try {
      // 1. Health check to test if Java backend is running on port 8080
      const health = await checkBackendHealth();
      setIsBackendConnected(health.online);

      if (health.online) {
        // 2. Query real endpoints simultaneously, passing active thresholds to /api/alerts
        const [procs, sysStats, alrts, acts] = await Promise.all([
          getProcesses(),
          getSystemStats(),
          getAlerts(settings.cpuThreshold, settings.memoryThreshold),
          getActivity(),
        ]);

        setProcesses(procs);
        setSystemResource(sysStats);
        setAlerts(alrts);
        setActivity(acts);

        const now = new Date();
        setLastUpdated(
          now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        );
      } else {
        // Backend offline
        setProcesses([]);
        setSystemResource({ cpuUsage: 0.0, memoryUsage: 0.0 });
        setAlerts([]);
      }
    } catch (err) {
      console.warn('[LPMS] Polling issue:', err);
      setIsBackendConnected(false);
    } finally {
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [settings.cpuThreshold, settings.memoryThreshold]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Automatic periodic refresh based on refreshInterval setting
  useEffect(() => {
    if (!settings.monitoringEnabled) return;

    const intervalMs = settings.refreshInterval * 1000;
    const intervalId = setInterval(() => {
      fetchData();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [settings.monitoringEnabled, settings.refreshInterval, fetchData]);

  // Persist settings changes
  const handleUpdateSettings = (newSettings: Partial<MonitorSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch (ignored) {}
      return updated;
    });
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (ignored) {}
  };

  // Compute stats strictly from real Linux data
  const runningProcessesCount = processes.filter((p) => p.state === 'Running').length;
  const stoppedProcessesCount = processes.filter((p) => p.state === 'Stopped').length;

  const stats: SystemStats = {
    totalProcesses: processes.length,
    cpuUsage: systemResource.cpuUsage,
    memoryUsage: systemResource.memoryUsage,
    runningProcesses: runningProcessesCount,
    stoppedProcesses: stoppedProcessesCount,
    systemStatus: isBackendConnected ? 'Online' : 'Offline',
    monitoringEnabled: settings.monitoringEnabled,
    autoRefresh: settings.monitoringEnabled,
    refreshInterval: settings.refreshInterval,
    lastUpdated: lastUpdated,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isBackendConnected={isBackendConnected}
        monitoringEnabled={settings.monitoringEnabled}
        alertCount={alerts.length}
        processCount={processes.length}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          isBackendConnected={isBackendConnected}
          isRefreshing={isRefreshing}
          onRefresh={fetchData}
          lastUpdated={lastUpdated}
          monitoringEnabled={settings.monitoringEnabled}
          refreshInterval={settings.refreshInterval}
          deploymentEnvironment={settings.deploymentEnvironment}
          onEnvironmentChange={(env) => handleUpdateSettings({ deploymentEnvironment: env })}
        />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              processes={processes}
              alerts={alerts}
              activity={activity}
              isBackendConnected={isBackendConnected}
              deploymentEnvironment={settings.deploymentEnvironment}
              onEnvironmentChange={(env) => handleUpdateSettings({ deploymentEnvironment: env })}
              onRefresh={fetchData}
              onNavigateToProcesses={() => setActiveTab('processes')}
              onNavigateToAlerts={() => setActiveTab('alerts')}
              onNavigateToActivity={() => setActiveTab('activity')}
            />
          )}

          {activeTab === 'processes' && (
            <ProcessesView
              processes={processes}
              isBackendConnected={isBackendConnected}
              onRefresh={fetchData}
              isRefreshing={isRefreshing}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsView
              alerts={alerts}
              cpuThreshold={settings.cpuThreshold}
              memoryThreshold={settings.memoryThreshold}
              onNavigateToSettings={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityView
              activity={activity}
              onRefresh={fetchData}
              isRefreshing={isRefreshing}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetSettings={handleResetSettings}
            />
          )}
        </main>
      </div>
    </div>
  );
}
