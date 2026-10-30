/**
 * LPMS — Linux Process Management System
 * Linux System Administration Portal
 * Type definitions
 */

export type ProcessState = 'Running' | 'Sleeping' | 'Stopped' | 'Zombie' | 'Other';

export type DeploymentEnvironment =
  | 'College Computer Lab'
  | 'School Computer Lab'
  | 'Department Linux Server'
  | 'Institution Linux Server';

export interface ProcessItem {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  state: ProcessState;
}

export interface SystemResourceUsage {
  cpuUsage: number;
  memoryUsage: number;
}

export interface SystemStats {
  totalProcesses: number;
  cpuUsage: number;
  memoryUsage: number;
  runningProcesses: number;
  stoppedProcesses: number;
  systemStatus: 'Online' | 'Offline';
  monitoringEnabled: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  lastUpdated: string;
}

export interface AlertItem {
  id: string;
  type: string; // 'High CPU Usage' | 'High Memory Usage'
  pid: number;
  name: string;
  value: number;
  metric: 'CPU' | 'Memory';
  threshold: number;
  time: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  event: string; // 'STOPPED' | 'TERMINATED' | 'HIGH_CPU' | 'HIGH_MEMORY'
  pid: number;
  processName: string;
  action: string;
  target?: string;
  user?: string;
}

export interface MonitorSettings {
  monitoringEnabled: boolean;
  cpuThreshold: number;
  memoryThreshold: number;
  refreshInterval: number;
  deploymentEnvironment: DeploymentEnvironment;
}
