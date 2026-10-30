import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Linux Process Resource Monitoring System - Backend API (Part 3)
 *
 * Implements a lightweight REST API server using Java's built-in
 * com.sun.net.httpserver.HttpServer.
 *
 * Features in Part 3:
 * - Real Linux process inspection via `ps -eo pid,args,%cpu,%mem,state --no-headers`
 * - System CPU usage calculation from `/proc/stat`
 * - System Memory usage calculation from `/proc/meminfo`
 * - Process Stop: POST /api/processes/{pid}/stop (`kill -STOP <pid>`)
 * - Process Terminate: POST /api/processes/{pid}/terminate (`kill -TERM <pid>`)
 * - CPU & Memory threshold alert detection
 * - File-based Activity logging in `logs/activity.log`
 * - REST Endpoints:
 *     GET  /api/processes
 *     POST /api/processes/{pid}/stop
 *     POST /api/processes/{pid}/terminate
 *     GET  /api/system-stats
 *     GET  /api/health
 *     GET  /api/alerts
 *     GET  /api/activity
 *
 * How to compile and run on Ubuntu / WSL:
 *   cd backend
 *   javac ProcessAPI.java
 *   java ProcessAPI
 */
public class ProcessAPI {

    private static final int PORT = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));

    // Previous CPU tick counters for computing delta from /proc/stat
    private static volatile long prevIdleTicks = 0;
    private static volatile long prevTotalTicks = 0;

    // Set of active alert keys to prevent spamming activity logs every 5 seconds
    private static final Set<String> activeAlertKeys = Collections.synchronizedSet(new HashSet<>());

    // Own JVM process ID to prevent self-termination
    private static final long OWN_PID = getCurrentProcessId();

    private static long getCurrentProcessId() {
        try {
            return ProcessHandle.current().pid();
        } catch (Throwable t) {
            return -1;
        }    }

    public static void main(String[] args) {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

            // Register REST API endpoints
            server.createContext("/api/processes", new ProcessesHandler());
            server.createContext("/api/system-stats", new SystemStatsHandler());
            server.createContext("/api/alerts", new AlertsHandler());
            server.createContext("/api/activity", new ActivityHandler());
            server.createContext("/api/health", new HealthHandler());

            server.setExecutor(Executors.newCachedThreadPool());
            server.start();

            // Ensure activity log file/directory exists
            initActivityLogFile();

            System.out.println("==========================================================");
            System.out.println("  Linux Process Resource Monitoring System - Part 3 API   ");
            System.out.println("==========================================================");
            System.out.println("Server running at: http://localhost:" + PORT);
            System.out.println("Backend PID: " + OWN_PID);
            System.out.println("Endpoints:");
            System.out.println(" - GET  http://localhost:" + PORT + "/api/processes");
            System.out.println(" - POST http://localhost:" + PORT + "/api/processes/{pid}/stop");
            System.out.println(" - POST http://localhost:" + PORT + "/api/processes/{pid}/terminate");
            System.out.println(" - GET  http://localhost:" + PORT + "/api/system-stats");
            System.out.println(" - GET  http://localhost:" + PORT + "/api/health");
            System.out.println(" - GET  http://localhost:" + PORT + "/api/alerts");
            System.out.println(" - GET  http://localhost:" + PORT + "/api/activity");
            System.out.println("Press Ctrl+C to stop.");
            System.out.println("==========================================================");

        } catch (IOException e) {
            System.err.println("Error starting server: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Resolves the activity.log file location reliably regardless of whether
     * running from `backend/` or root directory.
     */
    private static File getActivityLogFile() {
        File direct = new File("logs/activity.log");
        if (direct.exists()) return direct;

        File parentLogs = new File("../logs/activity.log");
        if (parentLogs.exists()) return parentLogs;

        // If neither exists yet, check if ../logs directory exists
        if (new File("../logs").isDirectory()) {
            return parentLogs;
        }
        return direct;
    }

    private static void initActivityLogFile() {
        try {
            File file = getActivityLogFile();
            if (file.getParentFile() != null) {
                file.getParentFile().mkdirs();
            }
            if (!file.exists()) {
                file.createNewFile();
            }
        } catch (Exception ignored) {}
    }

    /**
     * Appends an event to logs/activity.log
     * Format: YYYY-MM-DD HH:MM:SS | EVENT | PID <pid> | <process-name>
     */
    private static synchronized void logActivity(String event, int pid, String processName) {
        try {
            initActivityLogFile();
            File file = getActivityLogFile();
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            String timestamp = sdf.format(new Date());

            String logLine = String.format("%s | %s | PID %d | %s%n", timestamp, event, pid, processName);

            try (FileWriter fw = new FileWriter(file, true)) {
                fw.write(logLine);
            }
        } catch (Exception e) {
            System.err.println("Failed to write to activity log: " + e.getMessage());
        }
    }

    /**
     * Send JSON response with standard CORS headers to allow React frontend access.
     */
    private static void sendJsonResponse(HttpExchange exchange, int statusCode, String jsonResponse) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
            return;
        }

        byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);

        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    /**
     * Escape special JSON characters in strings
     */
    private static String escapeJson(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < ' ') {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        return sb.toString();
    }

    /**
     * Convert Linux process state character into a readable descriptive state.
     * R -> Running, S/I/D -> Sleeping, T/t -> Stopped, Z -> Zombie
     */
    private static String convertProcessState(String rawState) {
        if (rawState == null || rawState.isEmpty()) {
            return "Sleeping";
        }
        char primaryState = Character.toUpperCase(rawState.charAt(0));
        switch (primaryState) {
            case 'R':
                return "Running";
            case 'T':
                return "Stopped";
            case 'Z':
                return "Zombie";
            case 'S':
            case 'I':
            case 'D':
            default:
                return "Sleeping";
        }
    }

    /**
     * Extract a clean, readable process name from command args.
     */
    private static String parseProcessName(String rawArgs) {
        if (rawArgs == null || rawArgs.trim().isEmpty()) {
            return "unknown";
        }
        String trimmed = rawArgs.trim();

        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            return trimmed.substring(1, trimmed.length() - 1);
        }

        String firstToken = trimmed.split("\\s+")[0];
        int lastSlash = firstToken.lastIndexOf('/');
        if (lastSlash >= 0 && lastSlash < firstToken.length() - 1) {
            return firstToken.substring(lastSlash + 1);
        }

        return firstToken;
    }

    /**
     * Helper to read the process name for a given PID from /proc/<pid>/comm
     */
    private static String getProcessNameByPid(int pid) {
        File commFile = new File("/proc/" + pid + "/comm");
        if (commFile.exists()) {
            try (BufferedReader reader = new BufferedReader(new FileReader(commFile))) {
                String line = reader.readLine();
                if (line != null && !line.trim().isEmpty()) {
                    return line.trim();
                }
            } catch (Exception ignored) {}
        }
        return "PID-" + pid;
    }

    /**
     * Process data structure for internal filtering and serialization
     */
    static class ProcessData {
        int pid;
        String name;
        double cpu;
        double memory;
        String state;

        ProcessData(int pid, String name, double cpu, double memory, String state) {
            this.pid = pid;
            this.name = name;
            this.cpu = cpu;
            this.memory = memory;
            this.state = state;
        }

        String toJson() {
            return String.format(
                Locale.US,
                "{\"pid\":%d,\"name\":\"%s\",\"cpu\":%.1f,\"memory\":%.1f,\"state\":\"%s\"}",
                pid,
                escapeJson(name),
                cpu,
                memory,
                escapeJson(state)
            );
        }
    }

    /**
     * Query real Linux processes using:
     * `ps -eo pid,args,%cpu,%mem,state --no-headers`
     */
    private static List<ProcessData> fetchLinuxProcesses() {
        List<ProcessData> procs = new ArrayList<>();

        ProcessBuilder pb = new ProcessBuilder("ps", "-eo", "pid,args,%cpu,%mem,state", "--no-headers");
        try {
            Process process = pb.start();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    String trimmed = line.trim();
                    if (trimmed.isEmpty()) continue;

                    // Parse from the right:
                    // Format: <pid> <args...> <%cpu> <%mem> <state>
                    int lastSpace = trimmed.lastIndexOf(' ');
                    if (lastSpace == -1) continue;
                    String stateStr = trimmed.substring(lastSpace + 1).trim();

                    String rem1 = trimmed.substring(0, lastSpace).trim();
                    int secLastSpace = rem1.lastIndexOf(' ');
                    if (secLastSpace == -1) continue;
                    String memStr = rem1.substring(secLastSpace + 1).trim();

                    String rem2 = rem1.substring(0, secLastSpace).trim();
                    int thirdLastSpace = rem2.lastIndexOf(' ');
                    if (thirdLastSpace == -1) continue;
                    String cpuStr = rem2.substring(thirdLastSpace + 1).trim();

                    String rem3 = rem2.substring(0, thirdLastSpace).trim();
                    int firstSpace = rem3.indexOf(' ');
                    if (firstSpace == -1) continue;

                    String pidStr = rem3.substring(0, firstSpace).trim();
                    String argsStr = rem3.substring(firstSpace + 1).trim();

                    try {
                        int pid = Integer.parseInt(pidStr);
                        double cpu = Double.parseDouble(cpuStr);
                        double mem = Double.parseDouble(memStr);
                        String name = parseProcessName(argsStr);
                        String readableState = convertProcessState(stateStr);

                        procs.add(new ProcessData(pid, name, cpu, mem, readableState));
                    } catch (NumberFormatException ignored) {}
                }
            }
            process.waitFor();
        } catch (Exception e) {
            System.err.println("Error executing ps command: " + e.getMessage());
        }

        return procs;
    }

    /**
     * Compute actual system CPU usage from /proc/stat
     */
    private static synchronized double calculateSystemCpuUsage() {
        File statFile = new File("/proc/stat");
        if (!statFile.exists()) {
            return 0.0;
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(statFile))) {
            String line = reader.readLine();
            if (line != null && line.startsWith("cpu ")) {
                String[] tokens = line.trim().split("\\s+");
                if (tokens.length >= 5) {
                    long user = Long.parseLong(tokens[1]);
                    long nice = Long.parseLong(tokens[2]);
                    long system = Long.parseLong(tokens[3]);
                    long idle = Long.parseLong(tokens[4]);
                    long iowait = tokens.length > 5 ? Long.parseLong(tokens[5]) : 0;
                    long irq = tokens.length > 6 ? Long.parseLong(tokens[6]) : 0;
                    long softirq = tokens.length > 7 ? Long.parseLong(tokens[7]) : 0;
                    long steal = tokens.length > 8 ? Long.parseLong(tokens[8]) : 0;

                    long currentIdleTicks = idle + iowait;
                    long currentTotalTicks = user + nice + system + idle + iowait + irq + softirq + steal;

                    if (prevTotalTicks == 0) {
                        prevIdleTicks = currentIdleTicks;
                        prevTotalTicks = currentTotalTicks;
                        try {
                            Thread.sleep(100);
                        } catch (InterruptedException ignored) {}
                        return calculateSystemCpuUsage();
                    }

                    long totalDelta = currentTotalTicks - prevTotalTicks;
                    long idleDelta = currentIdleTicks - prevIdleTicks;

                    prevIdleTicks = currentIdleTicks;
                    prevTotalTicks = currentTotalTicks;

                    if (totalDelta > 0) {
                        double usage = (1.0 - ((double) idleDelta / (double) totalDelta)) * 100.0;
                        if (usage < 0.0) usage = 0.0;
                        if (usage > 100.0) usage = 100.0;
                        return Math.round(usage * 10.0) / 10.0;
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error reading /proc/stat: " + e.getMessage());
        }
        return 0.0;
    }

    /**
     * Compute actual system Memory usage from /proc/meminfo
     */
    private static double calculateSystemMemoryUsage() {
        File memFile = new File("/proc/meminfo");
        if (!memFile.exists()) {
            return 0.0;
        }

        long memTotal = 0;
        long memAvailable = -1;
        long memFree = 0;
        long buffers = 0;
        long cached = 0;

        try (BufferedReader reader = new BufferedReader(new FileReader(memFile))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(":");
                if (parts.length < 2) continue;
                String key = parts[0].trim();
                String valueStr = parts[1].trim().split("\\s+")[0];

                try {
                    long val = Long.parseLong(valueStr);
                    if ("MemTotal".equals(key)) {
                        memTotal = val;
                    } else if ("MemAvailable".equals(key)) {
                        memAvailable = val;
                    } else if ("MemFree".equals(key)) {
                        memFree = val;
                    } else if ("Buffers".equals(key)) {
                        buffers = val;
                    } else if ("Cached".equals(key)) {
                        cached = val;
                    }
                } catch (NumberFormatException ignored) {}
            }

            if (memTotal > 0) {
                long available = (memAvailable >= 0) ? memAvailable : (memFree + buffers + cached);
                long used = memTotal - available;
                if (used < 0) used = 0;
                double percentage = ((double) used * 100.0) / (double) memTotal;
                if (percentage < 0.0) percentage = 0.0;
                if (percentage > 100.0) percentage = 100.0;
                return Math.round(percentage * 10.0) / 10.0;
            }
        } catch (Exception e) {
            System.err.println("Error reading /proc/meminfo: " + e.getMessage());
        }
        return 0.0;
    }

    /**
     * Endpoint: /api/processes
     * GET  -> List processes
     * POST /api/processes/{pid}/stop      -> kill -STOP <pid>
     * POST /api/processes/{pid}/terminate -> kill -TERM <pid>
     */
    static class ProcessesHandler implements HttpHandler {
        private static final Pattern STOP_PATTERN = Pattern.compile("^/api/processes/(\\d+)/stop/?$");
        private static final Pattern TERMINATE_PATTERN = Pattern.compile("^/api/processes/(\\d+)/terminate/?$");

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI().getPath();

            if ("OPTIONS".equalsIgnoreCase(method)) {
                sendJsonResponse(exchange, 204, "");
                return;
            }

            // 1. Process Stop: POST /api/processes/{pid}/stop
            Matcher stopMatcher = STOP_PATTERN.matcher(path);
            if (stopMatcher.matches()) {
                if (!"POST".equalsIgnoreCase(method)) {
                    sendJsonResponse(exchange, 405, "{\"success\":false,\"error\":\"Method not allowed. Use POST.\"}");
                    return;
                }
                int pid = Integer.parseInt(stopMatcher.group(1));
                handleStopProcess(exchange, pid);
                return;
            }

            // 2. Process Terminate: POST /api/processes/{pid}/terminate
            Matcher termMatcher = TERMINATE_PATTERN.matcher(path);
            if (termMatcher.matches()) {
                if (!"POST".equalsIgnoreCase(method)) {
                    sendJsonResponse(exchange, 405, "{\"success\":false,\"error\":\"Method not allowed. Use POST.\"}");
                    return;
                }
                int pid = Integer.parseInt(termMatcher.group(1));
                handleTerminateProcess(exchange, pid);
                return;
            }

            // 3. Process Listing: GET /api/processes
            if ("GET".equalsIgnoreCase(method)) {
                List<ProcessData> procs = fetchLinuxProcesses();
                List<String> jsonParts = new ArrayList<>(procs.size());
                for (ProcessData p : procs) {
                    jsonParts.add(p.toJson());
                }
                String json = "[" + String.join(",", jsonParts) + "]";
                sendJsonResponse(exchange, 200, json);
            } else {
                sendJsonResponse(exchange, 405, "{\"error\": \"Method not allowed\"}");
            }
        }

        private void handleStopProcess(HttpExchange exchange, int pid) throws IOException {
            // Validation
            if (pid <= 0) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"error\":\"Invalid PID: must be a positive integer.\"}");
                return;
            }
            if (pid == 1) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"error\":\"Protected process: Cannot stop system init (PID 1).\"}");
                return;
            }
            if (OWN_PID > 0 && pid == OWN_PID) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"error\":\"Cannot stop the monitoring backend server itself.\"}");
                return;
            }

            String procName = getProcessNameByPid(pid);

            try {
                // Execute kill -STOP <pid>
                ProcessBuilder pb = new ProcessBuilder("kill", "-STOP", String.valueOf(pid));
                Process proc = pb.start();
                int exitCode = proc.waitFor();

                if (exitCode == 0) {
                    logActivity("STOPPED", pid, procName);
                    String resp = String.format(Locale.US,
                        "{\"success\":true,\"message\":\"Process %d (%s) stopped successfully.\"}",
                        pid, escapeJson(procName));
                    sendJsonResponse(exchange, 200, resp);
                } else {
                    String resp = String.format(Locale.US,
                        "{\"success\":false,\"error\":\"Unable to stop process %d. The process may have already ended or permission may be insufficient.\"}",
                        pid);
                    sendJsonResponse(exchange, 400, resp);
                }
            } catch (Exception e) {
                String resp = String.format(Locale.US,
                    "{\"success\":false,\"error\":\"Failed to execute stop command: %s\"}",
                    escapeJson(e.getMessage()));
                sendJsonResponse(exchange, 500, resp);
            }
        }

        private void handleTerminateProcess(HttpExchange exchange, int pid) throws IOException {
            // Validation
            if (pid <= 0) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"error\":\"Invalid PID: must be a positive integer.\"}");
                return;
            }
            if (pid == 1) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"error\":\"Protected process: Cannot terminate system init (PID 1).\"}");
                return;
            }
            if (OWN_PID > 0 && pid == OWN_PID) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"error\":\"Cannot terminate the monitoring backend server itself.\"}");
                return;
            }

            String procName = getProcessNameByPid(pid);

            try {
                // Execute kill -TERM <pid>
                ProcessBuilder pb = new ProcessBuilder("kill", "-TERM", String.valueOf(pid));
                Process proc = pb.start();
                int exitCode = proc.waitFor();

                if (exitCode == 0) {
                    logActivity("TERMINATED", pid, procName);
                    String resp = String.format(Locale.US,
                        "{\"success\":true,\"message\":\"Process %d (%s) terminated successfully.\"}",
                        pid, escapeJson(procName));
                    sendJsonResponse(exchange, 200, resp);
                } else {
                    String resp = String.format(Locale.US,
                        "{\"success\":false,\"error\":\"Unable to terminate process %d. The process may have already ended or permission may be insufficient.\"}",
                        pid);
                    sendJsonResponse(exchange, 400, resp);
                }
            } catch (Exception e) {
                String resp = String.format(Locale.US,
                    "{\"success\":false,\"error\":\"Failed to execute terminate command: %s\"}",
                    escapeJson(e.getMessage()));
                sendJsonResponse(exchange, 500, resp);
            }
        }
    }

    /**
     * Endpoint: GET /api/system-stats
     * Returns real Linux CPU and Memory usage percentages
     */
    static class SystemStatsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("GET".equalsIgnoreCase(exchange.getRequestMethod()) || "OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                double cpu = calculateSystemCpuUsage();
                double memory = calculateSystemMemoryUsage();
                String json = String.format(Locale.US, "{\"cpuUsage\":%.1f,\"memoryUsage\":%.1f}", cpu, memory);
                sendJsonResponse(exchange, 200, json);
            } else {
                sendJsonResponse(exchange, 405, "{\"error\": \"Method not allowed\"}");
            }
        }
    }

    /**
     * Endpoint: GET /api/alerts
     * Checks real process metrics against threshold parameters (cpuThreshold, memThreshold)
     * Logs newly triggered threshold events once to activity.log
     */
    static class AlertsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJsonResponse(exchange, 204, "");
                return;
            }

            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJsonResponse(exchange, 405, "{\"error\": \"Method not allowed\"}");
                return;
            }

            // Parse optional query params: ?cpuThreshold=80&memThreshold=80
            double cpuThreshold = 80.0;
            double memThreshold = 80.0;

            URI uri = exchange.getRequestURI();
            String query = uri.getQuery();
            if (query != null) {
                String[] pairs = query.split("&");
                for (String pair : pairs) {
                    String[] kv = pair.split("=");
                    if (kv.length == 2) {
                        try {
                            if ("cpuThreshold".equalsIgnoreCase(kv[0])) {
                                cpuThreshold = Double.parseDouble(kv[1]);
                            } else if ("memThreshold".equalsIgnoreCase(kv[0]) || "memoryThreshold".equalsIgnoreCase(kv[0])) {
                                memThreshold = Double.parseDouble(kv[1]);
                            }
                        } catch (NumberFormatException ignored) {}
                    }
                }
            }

            List<ProcessData> procs = fetchLinuxProcesses();
            List<String> alertJsonItems = new ArrayList<>();
            SimpleDateFormat timeFormat = new SimpleDateFormat("HH:mm:ss");
            String currentTime = timeFormat.format(new Date());

            Set<String> currentActiveKeys = new HashSet<>();

            for (ProcessData p : procs) {
                // 1. High CPU Check
                if (p.cpu >= cpuThreshold && p.cpu > 0.0) {
                    String alertKey = "CPU-" + p.pid;
                    currentActiveKeys.add(alertKey);

                    // If newly exceeded threshold, log once
                    if (!activeAlertKeys.contains(alertKey)) {
                        activeAlertKeys.add(alertKey);
                        logActivity("HIGH_CPU", p.pid, p.name);
                    }

                    String alertItem = String.format(Locale.US,
                        "{\"id\":\"cpu-%d\",\"type\":\"High CPU Usage\",\"pid\":%d,\"name\":\"%s\",\"value\":%.1f,\"metric\":\"CPU\",\"threshold\":%.1f,\"time\":\"%s\",\"message\":\"PID %d (%s) is using %.1f%% CPU\",\"severity\":\"high\"}",
                        p.pid, p.pid, escapeJson(p.name), p.cpu, cpuThreshold, currentTime, p.pid, escapeJson(p.name), p.cpu);
                    alertJsonItems.add(alertItem);
                }

                // 2. High Memory Check
                if (p.memory >= memThreshold && p.memory > 0.0) {
                    String alertKey = "MEM-" + p.pid;
                    currentActiveKeys.add(alertKey);

                    // If newly exceeded threshold, log once
                    if (!activeAlertKeys.contains(alertKey)) {
                        activeAlertKeys.add(alertKey);
                        logActivity("HIGH_MEMORY", p.pid, p.name);
                    }

                    String alertItem = String.format(Locale.US,
                        "{\"id\":\"mem-%d\",\"type\":\"High Memory Usage\",\"pid\":%d,\"name\":\"%s\",\"value\":%.1f,\"metric\":\"Memory\",\"threshold\":%.1f,\"time\":\"%s\",\"message\":\"PID %d (%s) is using %.1f%% memory\",\"severity\":\"high\"}",
                        p.pid, p.pid, escapeJson(p.name), p.memory, memThreshold, currentTime, p.pid, escapeJson(p.name), p.memory);
                    alertJsonItems.add(alertItem);
                }
            }

            // Remove keys that are no longer active
            activeAlertKeys.retainAll(currentActiveKeys);

            String json = "[" + String.join(",", alertJsonItems) + "]";
            sendJsonResponse(exchange, 200, json);
        }
    }

    /**
     * Endpoint: GET /api/activity
     * Reads logs/activity.log and returns structured entries in reverse chronological order
     */
    static class ActivityHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJsonResponse(exchange, 204, "");
                return;
            }

            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJsonResponse(exchange, 405, "{\"error\": \"Method not allowed\"}");
                return;
            }

            File logFile = getActivityLogFile();
            if (!logFile.exists() || logFile.length() == 0) {
                sendJsonResponse(exchange, 200, "[]");
                return;
            }

            List<String> rawLines = new ArrayList<>();
            try (BufferedReader reader = new BufferedReader(new FileReader(logFile, StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    String trimmed = line.trim();
                    if (!trimmed.isEmpty()) {
                        rawLines.add(trimmed);
                    }
                }
            } catch (Exception e) {
                sendJsonResponse(exchange, 200, "[]");
                return;
            }

            // Reverse order so newest activities appear first
            Collections.reverse(rawLines);

            List<String> activityJsonItems = new ArrayList<>();
            int idCounter = 1;

            for (String line : rawLines) {
                // Expected format: timestamp | EVENT | PID <pid> | <process-name>
                String[] parts = line.split("\\|");
                if (parts.length >= 4) {
                    String timestamp = parts[0].trim();
                    String event = parts[1].trim();
                    String pidToken = parts[2].trim(); // e.g. "PID 1234"
                    String processName = parts[3].trim();

                    int pid = 0;
                    try {
                        pid = Integer.parseInt(pidToken.replace("PID", "").trim());
                    } catch (Exception ignored) {}

                    String action = event + " " + pidToken + " (" + processName + ")";

                    String itemJson = String.format(Locale.US,
                        "{\"id\":\"act-%d\",\"timestamp\":\"%s\",\"event\":\"%s\",\"pid\":%d,\"processName\":\"%s\",\"action\":\"%s\",\"target\":\"%s\"}",
                        idCounter++, escapeJson(timestamp), escapeJson(event), pid, escapeJson(processName), escapeJson(action), escapeJson(pidToken)
                    );
                    activityJsonItems.add(itemJson);
                }
            }

            String json = "[" + String.join(",", activityJsonItems) + "]";
            sendJsonResponse(exchange, 200, json);
        }
    }

    /**
     * Endpoint: GET /api/health
     * Backend availability status check
     */
    static class HealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("GET".equalsIgnoreCase(exchange.getRequestMethod()) || "OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJsonResponse(exchange, 200, "{\"status\": \"online\", \"message\": \"Java backend is running\"}");
            } else {
                sendJsonResponse(exchange, 405, "{\"error\": \"Method not allowed\"}");
            }
        }
    }
}
