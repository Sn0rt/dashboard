import { formatK8sApiError } from "../utils/k8s-errors";
import {
  isProtectedQueue,
  protectedQueueDeleteMessage,
} from "../utils/queue-constants";
import { validateQueueManifestSpec } from "../utils/queue-validation";
import {
  createCustomResource,
  deleteCustomResource,
  getCustomResource,
  listCustomResources,
  patchCustomResource,
} from "./custom-resources";
import { volcanoResources } from "./definitions";
import {
  extractResourceListPage,
  fetchPaginatedResourceList,
} from "./pagination";
import { dumpResourceYaml } from "./yaml";

export async function listQueues(page: number, pageSize: number) {
  return fetchPaginatedResourceList(
    page,
    pageSize,
    async (limit, continueToken) => {
      const response = await listCustomResources(volcanoResources.queue, {
        limit,
        continueToken,
      });
      return extractResourceListPage(response);
    },
  );
}

export async function getQueue(name: string) {
  return getCustomResource(volcanoResources.queue, name);
}

export async function getQueueYaml(name: string) {
  return dumpResourceYaml(await getQueue(name));
}

export async function listAllQueues() {
  const response = await listCustomResources(volcanoResources.queue);
  return {
    items: response.items,
    totalCount: response.items.length,
  };
}

export async function createQueue(queueManifest: {
  metadata: { name: string };
  spec?: unknown;
  [key: string]: unknown;
}) {
  if (!queueManifest.metadata.name || !queueManifest.spec) {
    throw new Error("Invalid queue manifest: name and spec are required");
  }

  const specError = validateQueueManifestSpec(
    queueManifest.spec as Record<string, unknown>,
  );
  if (specError) {
    throw new Error(specError);
  }

  try {
    const response = await createCustomResource(
      volcanoResources.queue,
      queueManifest,
    );

    return {
      message: "Queue created successfully",
      data: response.body,
    };
  } catch (error) {
    throw new Error(formatK8sApiError(error));
  }
}

export async function updateQueue(
  name: string,
  updatedBody: { spec?: Record<string, unknown> },
) {
  if (!updatedBody.spec || Object.keys(updatedBody.spec).length === 0) {
    throw new Error("spec object is required and cannot be empty");
  }

  const specError = validateQueueManifestSpec(updatedBody.spec);
  if (specError) {
    throw new Error(specError);
  }

  try {
    await getQueue(name);
  } catch {
    throw new Error(`Queue ${name} not found`);
  }

  const numericFields = new Set(["weight"]);
  const patchOperations = Object.entries(updatedBody.spec).map(
    ([key, value]) => {
      let normalizedValue = value;

      if (numericFields.has(key) && typeof normalizedValue === "string") {
        const parsed = parseInt(normalizedValue, 10);
        if (!Number.isNaN(parsed)) {
          normalizedValue = parsed;
        }
      }

      return {
        op: "replace",
        path: `/spec/${key}`,
        value: normalizedValue,
      };
    },
  );

  try {
    const response = await patchCustomResource(
      volcanoResources.queue,
      name,
      patchOperations,
    );
    const updatedQueue = await getQueue(name);

    return {
      message: `Successfully updated queue ${name}`,
      patchResponse: response.body,
      updatedQueue: updatedQueue.body,
    };
  } catch (error) {
    throw new Error(formatK8sApiError(error));
  }
}

export async function deleteQueue(name: string) {
  const queueName = name.toLowerCase();

  if (isProtectedQueue(queueName)) {
    throw new Error(protectedQueueDeleteMessage(queueName));
  }

  await getQueue(queueName);
  const response = await deleteCustomResource(
    volcanoResources.queue,
    queueName,
  );

  return {
    message: "Queue deleted successfully",
    data: response.body,
  };
}
