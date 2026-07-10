import { k8sCoreApi } from "../utils/k8s";
import { listCustomResources } from "./custom-resources";
import { volcanoResources } from "./definitions";

type ResourceWithStatus = {
  metadata?: { name?: string };
  spec?: Record<string, unknown> & {
    weight?: number;
    reclaimable?: boolean;
    capability?: Record<string, unknown>;
  };
  status?: Record<string, unknown> & {
    state?: { phase?: string } | string;
    phase?: string;
    allocated?: Record<string, unknown>;
    running?: number;
    pending?: number;
    inqueue?: number;
    reclaimable?: boolean;
  };
};

export async function getDashboardSummary() {
  try {
    const jobsResponse = await listCustomResources(volcanoResources.job);
    const jobs = (jobsResponse.items ?? []) as ResourceWithStatus[];
    const podsResponse = await k8sCoreApi.listPodForAllNamespaces();
    const pods = podsResponse.items ?? [];

    const totalJobs = jobs.length;
    const activeJobs = jobs.filter((job) => {
      const state =
        typeof job.status?.state === "object"
          ? job.status.state.phase
          : job.status?.state || "Unknown";
      return ["Running", "Pending", "Inqueue"].includes(state ?? "Unknown");
    }).length;
    const runningPods = pods.filter(
      (pod) => pod.status?.phase === "Running",
    ).length;
    const completeRate =
      totalJobs > 0
        ? `${Math.round(((totalJobs - activeJobs) / totalJobs) * 100)}%`
        : "0%";

    return { totalJobs, activeJobs, runningPods, completeRate };
  } catch (error) {
    console.error("Error fetching summary:", error);
    return {
      totalJobs: 0,
      activeJobs: 0,
      runningPods: 0,
      completeRate: "0%",
    };
  }
}

export async function getJobStatusMetrics() {
  try {
    const response = await listCustomResources(volcanoResources.job);
    const jobs = (response.items ?? []) as ResourceWithStatus[];
    const statusCounts: Record<string, number> = {};

    jobs.forEach((job) => {
      const state =
        typeof job.status?.state === "object"
          ? job.status.state.phase
          : job.status?.state || "Unknown";
      const key = state ?? "Unknown";
      statusCounts[key] = (statusCounts[key] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));
  } catch (error) {
    console.error("Error fetching job status metrics:", error);
    return [];
  }
}

export async function getQueueResourcesMetrics() {
  try {
    const response = await listCustomResources(volcanoResources.queue);
    const queues = (response.items ?? []) as ResourceWithStatus[];

    return queues.map((queue) => {
      const spec = queue.spec ?? {};
      const status = queue.status ?? {};
      const allocated = status.allocated ?? {};
      const capability = spec.capability ?? {};
      const runningPods =
        (status.running ?? 0) + (status.pending ?? 0) + (status.inqueue ?? 0);

      return {
        name: queue.metadata?.name || "Unknown",
        weight: spec.weight || 0,
        reclaimable: spec.reclaimable ?? status.reclaimable ?? false,
        cpu: allocated.cpu != null ? String(allocated.cpu) : "0",
        memory: allocated.memory != null ? String(allocated.memory) : "0",
        pods:
          allocated.pods != null ? String(allocated.pods) : String(runningPods),
        cpuCapability: capability.cpu != null ? String(capability.cpu) : "0",
        memoryCapability:
          capability.memory != null ? String(capability.memory) : "0",
        podsCapability: capability.pods != null ? String(capability.pods) : "0",
      };
    });
  } catch (error) {
    console.error("Error fetching queue resources metrics:", error);
    return [];
  }
}
