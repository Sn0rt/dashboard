import { API_BASE } from "../../lib/client/dashboard-api";
import { getStoredToken } from "../../lib/client/auth-token";

export const resourceCellValue = (container, group, name) =>
  container?.resources?.[group]?.[name] || "-";

export const podStatus = (pod) =>
  pod?.status?.phase || pod?.summary?.status || "Unknown";

export const podJobName = (pod) =>
  pod?.metadata?.labels?.["volcano.sh/job-name"] ||
  pod?.metadata?.labels?.job ||
  "-";

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "-";

export const lineLevelColor = (line) => {
  if (/\b(ERROR|ERR|FATAL|PANIC)\b/i.test(line)) {
    return "#f87171";
  }
  if (/\b(WARN|WARNING)\b/i.test(line)) {
    return "#facc15";
  }
  if (/\b(INFO)\b/i.test(line)) {
    return "#4ade80";
  }
  if (/\b(DEBUG|TRACE)\b/i.test(line)) {
    return "#93c5fd";
  }
  return "#e5e7eb";
};

export const appendAuthToken = (params) => {
  const token = getStoredToken();
  if (token) {
    params.set("token", token);
  }
  return params;
};

const podWebSocketBaseUrl = ({ name, namespace, protocol, route }) =>
  `${protocol}://${window.location.host}${API_BASE}/pods/${encodeURIComponent(
    namespace,
  )}/${encodeURIComponent(name)}/${route}`;

export const buildPodLogsStreamUrl = ({
  container,
  name,
  namespace,
  tailLines,
}) => {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const params = appendAuthToken(
    new URLSearchParams({
      container,
      follow: "true",
      tailLines: String(tailLines || 200),
    }),
  );
  return `${podWebSocketBaseUrl({
    name,
    namespace,
    protocol,
    route: "logs/stream",
  })}?${params.toString()}`;
};

export const buildPodTerminalUrl = ({ container, name, namespace }) => {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const params = appendAuthToken(
    new URLSearchParams({
      container,
    }),
  );
  return `${podWebSocketBaseUrl({
    name,
    namespace,
    protocol,
    route: "terminal",
  })}?${params.toString()}`;
};
