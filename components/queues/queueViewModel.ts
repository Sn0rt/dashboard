import {
  formatShare,
  getQueueResourceStats,
  QUEUE_RESOURCE_COLUMNS,
} from "./queueResourceUsage";

export const getQueueName = (queue) => queue?.metadata?.name || "-";

export const getStatus = (queue) => {
  const state = queue?.spec?.state || queue?.status?.state || "Open";
  if (state === "Active") return "Open";
  return state;
};

export const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString();
};

export const healthStyles = {
  healthy: {
    bgcolor: "#e7f6ec",
    color: "#12833f",
    label: "Healthy",
    severity: "healthy",
  },
  hot: {
    bgcolor: "#ffe7e7",
    color: "#cf2727",
    label: "Hot",
    severity: "hot",
  },
  idle: {
    bgcolor: "#f2f3f5",
    color: "#69707a",
    label: "Idle",
    severity: "idle",
  },
  underused: {
    bgcolor: "#fff8db",
    color: "#a16207",
    label: "Underused",
    severity: "underused",
  },
  invalid: {
    bgcolor: "#ffe5e5",
    color: "#d92323",
    label: "Invalid",
    severity: "invalid",
  },
  starving: {
    bgcolor: "#fff2df",
    color: "#d86b00",
    label: "Starving",
    severity: "starving",
  },
};

export const statusStyles = {
  Open: {
    background: "#e7f6ec",
    border: "#12833f22",
    color: "#12833f",
    label: "Open",
    tooltip: "Queue accepts jobs and participates in scheduling",
  },
  Closed: {
    background: "#f2f3f5",
    border: "#69707a22",
    color: "#69707a",
    label: "Closed",
    tooltip: "Queue is disabled for new scheduling",
  },
};

export const getHealth = (queue) => {
  const status = getStatus(queue).toLowerCase();
  if (status.includes("invalid") || status.includes("unknown")) {
    return healthStyles.invalid;
  }

  const stats = QUEUE_RESOURCE_COLUMNS.map((resource) =>
    getQueueResourceStats(queue, resource),
  );
  const requested = stats.reduce(
    (sum, resource) => sum + resource.requested,
    0,
  );
  const allocated = stats.reduce((sum, resource) => sum + resource.used, 0);
  const allocatedCpu = getQueueResourceStats(
    queue,
    QUEUE_RESOURCE_COLUMNS[0],
  ).used;
  const allocatedMemory = getQueueResourceStats(
    queue,
    QUEUE_RESOURCE_COLUMNS[1],
  ).used;
  const maxUsage = Math.max(...stats.map((resource) => resource.usagePercent));
  const overLimit = stats.some((resource) => resource.overCapability);
  const overused = queue?.summary?.schedulerMetrics?.scheduling?.overused;

  if (overused || overLimit || maxUsage > 110) return healthStyles.hot;
  if (!requested && !allocated) return healthStyles.idle;
  if (requested > 0 && allocatedCpu === 0 && allocatedMemory === 0)
    return healthStyles.starving;
  if (requested > 0 && allocated / requested < 0.5)
    return healthStyles.underused;
  return allocated > 0 ? healthStyles.healthy : healthStyles.idle;
};

export const getPriorityWeight = (queue) => {
  const priority = queue?.spec?.priority ?? "-";
  const weight =
    queue?.summary?.schedulerMetrics?.scheduling?.weight ??
    queue?.spec?.weight ??
    "-";
  return `${priority} / ${weight}`;
};

export const getRunningPodGroups = (queue) =>
  Number(queue?.summary?.schedulerMetrics?.podGroups?.running ?? 0);

export const getPendingPodGroups = (queue) =>
  Number(queue?.summary?.schedulerMetrics?.podGroups?.pending ?? 0);

export const getInqueuePodGroups = (queue) =>
  Number(queue?.summary?.schedulerMetrics?.podGroups?.inqueue ?? 0);

export const getPendingInqueuePodGroups = (queue) =>
  `${getPendingPodGroups(queue)} / ${getInqueuePodGroups(queue)}`;

export const getFairnessShare = (queue) =>
  formatShare(queue?.summary?.schedulerMetrics?.scheduling?.share);

export const getOverusedLabel = (queue) =>
  queue?.summary?.schedulerMetrics?.scheduling?.overused ? "Yes" : "No";

export const getQueueSearchBlob = (queue) => {
  const labels = Object.entries(queue?.metadata?.labels || {})
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");
  return [
    queue?.metadata?.name,
    queue?.metadata?.namespace,
    queue?.spec?.parent,
    labels,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

export const buildPath = (queue, queueMap) => {
  const names = [getQueueName(queue)];
  let parentName = queue?.spec?.parent;
  const visited = new Set(names);

  while (parentName && queueMap.has(parentName) && !visited.has(parentName)) {
    names.unshift(parentName);
    visited.add(parentName);
    parentName = queueMap.get(parentName)?.spec?.parent;
  }

  if (names[0] !== "root") names.unshift("root");
  return names.join(" / ");
};

export const getQueueEvents = (queue) => {
  const createdAt = formatDate(queue?.metadata?.creationTimestamp);
  return [
    {
      description: "Queue created",
      time: createdAt,
      type: "Normal",
    },
    {
      description: `Queue state changed to ${getStatus(queue)}`,
      time: createdAt,
      type: "Normal",
    },
    queue?.summary?.schedulerMetrics?.scheduling?.overused
      ? {
          description: "Queue is overused according to scheduler metrics",
          time: createdAt,
          type: "Warning",
        }
      : null,
  ].filter(Boolean);
};

export const buildQueueSummary = (queues, totalQueues) => {
  const healthCounts = queues.reduce(
    (acc, queue) => {
      acc[getHealth(queue).severity] =
        (acc[getHealth(queue).severity] || 0) + 1;
      return acc;
    },
    {
      healthy: 0,
      hot: 0,
      idle: 0,
      invalid: 0,
      starving: 0,
      underused: 0,
    },
  );
  const active = queues.filter((queue) => getStatus(queue) === "Open");

  return {
    active: active.length,
    hot: healthCounts.hot || 0,
    idle: healthCounts.idle || 0,
    invalid: healthCounts.invalid || 0,
    starving: healthCounts.starving || 0,
    total: totalQueues || queues.length,
  };
};
