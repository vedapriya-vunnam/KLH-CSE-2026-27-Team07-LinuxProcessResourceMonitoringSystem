/**
 * API Service for Linux Process Resource Monitoring System (Part 3)
 * Connects the React frontend to the Java REST API at http://localhost:8080/api
 */

import { ProcessItem, SystemResourceUsage, AlertItem, ActivityItem } from '../types/process.ts';

export const API_BASE_URL = 'http://localhost:8080/api';

export interface HealthStatus {
  online: boolean;
  message: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Fetch live Linux processes from Java backend (GET /api/processes)
 */
export async function getProcesses(): Promise<ProcessItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/processes`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      pid: Number(item.pid) || 0,
      name: String(item.name || 'unknown'),
      cpu: typeof item.cpu === 'number' ? item.cpu : Number(item.cpuPercent || 0),
      memory: typeof item.memory === 'number' ? item.memory : Number(item.memoryPercent || 0),
      state: item.state || 'Sleeping',
    }));
  } catch (err) {
    return [];
  }
}

/**
 * Fetch real system resource usage (GET /api/system-stats)
 */
export async function getSystemStats(): Promise<SystemResourceUsage> {
  try {
    const response = await fetch(`${API_BASE_URL}/system-stats`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return { cpuUsage: 0, memoryUsage: 0 };
    }

    const data = await response.json();
    return {
      cpuUsage: typeof data.cpuUsage === 'number' ? data.cpuUsage : 0,
      memoryUsage: typeof data.memoryUsage === 'number' ? data.memoryUsage : 0,
    };
  } catch (err) {
    return { cpuUsage: 0, memoryUsage: 0 };
  }
}

/**
 * Fetch alerts from Java backend (GET /api/alerts?cpuThreshold=...&memThreshold=...)
 */
export async function getAlerts(cpuThreshold: number = 80, memThreshold: number = 80): Promise<AlertItem[]> {
  try {
    const url = `${API_BASE_URL}/alerts?cpuThreshold=${encodeURIComponent(cpuThreshold)}&memThreshold=${encodeURIComponent(memThreshold)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) return [];
    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      id: String(item.id || Math.random()),
      type: item.type || 'High Resource Usage',
      pid: Number(item.pid) || 0,
      name: String(item.name || 'unknown'),
      value: Number(item.value) || 0,
      metric: item.metric || 'CPU',
      threshold: Number(item.threshold) || 80,
      time: item.time || new Date().toLocaleTimeString(),
      message: item.message || `PID ${item.pid} exceeded resource threshold`,
      severity: item.severity || 'high',
    }));
  } catch (err) {
    return [];
  }
}

/**
 * Fetch system activities from Java backend (GET /api/activity)
 * Reads logs/activity.log
 */
export async function getActivity(): Promise<ActivityItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/activity`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) return [];
    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      id: String(item.id || Math.random()),
      timestamp: String(item.timestamp || ''),
      event: String(item.event || 'ACTION'),
      pid: Number(item.pid) || 0,
      processName: String(item.processName || 'unknown'),
      action: String(item.action || `${item.event} PID ${item.pid}`),
      target: item.target,
      user: item.user,
    }));
  } catch (err) {
    return [];
  }
}

/**
 * Stop a Linux process (POST /api/processes/{pid}/stop)
 * Executes `kill -STOP <pid>` on Linux host
 */
export async function stopProcess(pid: number): Promise<ActionResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/processes/${pid}/stop`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      return {
        success: true,
        message: data.message || `Process ${pid} stopped successfully.`,
      };
    }

    return {
      success: false,
      message: data?.error || `Unable to stop process ${pid}. The process may have already ended or permission may be insufficient.`,
      error: data?.error,
    };
  } catch (err) {
    return {
      success: false,
      message: `Unable to connect to backend server. Please verify Java ProcessAPI is running on port 8080.`,
      error: String(err),
    };
  }
}

/**
 * Terminate a Linux process (POST /api/processes/{pid}/terminate)
 * Executes `kill -TERM <pid>` on Linux host
 */
export async function terminateProcess(pid: number): Promise<ActionResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/processes/${pid}/terminate`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      return {
        success: true,
        message: data.message || `Process ${pid} terminated successfully.`,
      };
    }

    return {
      success: false,
      message: data?.error || `Unable to terminate process ${pid}. The process may have already ended or permission may be insufficient.`,
      error: data?.error,
    };
  } catch (err) {
    return {
      success: false,
      message: `Unable to connect to backend server. Please verify Java ProcessAPI is running on port 8080.`,
      error: String(err),
    };
  }
}

/**
 * Check if the Java backend server is running (GET /api/health)
 */
export async function checkBackendHealth(): Promise<HealthStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return { online: true, message: 'System Online' };
    }
    return { online: false, message: 'Backend Offline' };
  } catch (err) {
    return { online: false, message: 'Backend Offline' };
  }
}
