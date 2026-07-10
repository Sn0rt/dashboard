import { formatK8sApiError } from "../utils/k8s-errors";
import { validateJobManifest } from "../utils/job-validation";
import {
  createCustomResource,
  deleteCustomResource,
  getCustomResource,
  listCustomResources,
  replaceCustomResource,
} from "./custom-resources";
import { volcanoResources } from "./definitions";
import {
  extractResourceListPage,
  fetchPaginatedResourceList,
} from "./pagination";
import { dumpResourceYaml } from "./yaml";

type Job = {
  status?:
    | {
        state?: {
          phase?: string;
        };
        phase?: string;
      }
    | string;
  spec?: {
    minAvailable?: number;
    queue?: string;
  };
  metadata: {
    name: string;
    resourceVersion?: string;
    uid?: string;
    creationTimestamp?: unknown;
  };
};

export function getJobState(job: Job) {
  if (typeof job.status === "object" && job.status?.state) {
    return job.status.state.phase || "Unknown";
  }
  if (typeof job.status === "string") {
    return job.status;
  }
  return "Unknown";
}

export async function listJobs(page: number, pageSize: number) {
  return fetchPaginatedResourceList(
    page,
    pageSize,
    async (limit, continueToken) => {
      const response = await listCustomResources(volcanoResources.job, {
        limit,
        continueToken,
        pretty: "true",
      });
      return extractResourceListPage(response);
    },
  );
}

export async function getJob(namespace: string, name: string) {
  return getCustomResource(volcanoResources.job, name, namespace);
}

export async function getJobYaml(namespace: string, name: string) {
  return dumpResourceYaml(await getJob(namespace, name));
}

export async function listAllJobs() {
  const response = await listCustomResources(volcanoResources.job, {
    pretty: "true",
  });

  const jobs = (response.items as Job[]).map((job) => ({
    ...job,
    status: {
      state:
        (typeof job.status === "object" && job.status?.state) ||
        getJobState(job),
      phase:
        (typeof job.status === "object" && job.status?.phase) ||
        job.spec?.minAvailable
          ? "Running"
          : "Unknown",
    },
  }));

  return {
    items: jobs,
    totalCount: jobs.length,
  };
}

export async function createJob(jobManifest: {
  metadata: { name: string; namespace?: string };
  spec?: unknown;
  [key: string]: unknown;
}) {
  if (!jobManifest.metadata.name || !jobManifest.spec) {
    throw new Error("Invalid job manifest: name and spec are required");
  }

  const jobError = validateJobManifest(jobManifest as Record<string, unknown>);
  if (jobError) {
    throw new Error(jobError);
  }

  const namespace = jobManifest.metadata.namespace || "default";

  try {
    const response = await createCustomResource(
      volcanoResources.job,
      jobManifest,
      namespace,
    );

    return {
      message: "Job created successfully",
      data: response.body,
    };
  } catch (error) {
    throw new Error(formatK8sApiError(error));
  }
}

export async function updateJob(
  namespace: string,
  name: string,
  patchData: Record<string, unknown> & {
    metadata?: Record<string, unknown>;
  },
) {
  const currentJob = (await getJob(namespace, name)) as Job &
    Record<string, unknown>;
  const updatedJob = {
    ...currentJob,
    ...patchData,
    metadata: {
      ...currentJob.metadata,
      ...patchData.metadata,
      resourceVersion: currentJob.metadata?.resourceVersion,
      uid: currentJob.metadata?.uid,
      creationTimestamp: currentJob.metadata?.creationTimestamp,
    },
  };

  const response = await replaceCustomResource(
    volcanoResources.job,
    name,
    updatedJob,
    namespace,
  );

  return {
    message: "Job updated successfully",
    data: response.body,
  };
}

export async function deleteJob(namespace: string, name: string) {
  const response = await deleteCustomResource(
    volcanoResources.job,
    name,
    namespace,
  );

  return {
    message: "Job deleted successfully",
    data: response.body,
  };
}
