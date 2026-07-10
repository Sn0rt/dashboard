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
  type CustomResourceClient,
} from "./custom-resources";
import { volcanoResources } from "./definitions";
import {
  extractResourceListPage,
  fetchPaginatedResourceList,
} from "./pagination";
import { dumpResourceYaml } from "./yaml";

export async function listQueues(
  page: number,
  pageSize: number,
  client?: CustomResourceClient,
) {
  return fetchPaginatedResourceList(
    page,
    pageSize,
    async (limit, continueToken) => {
      const response = await listCustomResources(
        volcanoResources.queue,
        {
          limit,
          continueToken,
        },
        client,
      );
      return extractResourceListPage(response);
    },
  );
}

export async function getQueue(name: string, client?: CustomResourceClient) {
  return getCustomResource(volcanoResources.queue, name, undefined, client);
}

export async function getQueueYaml(
  name: string,
  client?: CustomResourceClient,
) {
  return dumpResourceYaml(await getQueue(name, client));
}

export async function listAllQueues(client?: CustomResourceClient) {
  const response = await listCustomResources(
    volcanoResources.queue,
    {},
    client,
  );
  return {
    items: response.items,
    totalCount: response.items.length,
  };
}

export async function createQueue(
  queueManifest: {
    metadata: { name: string };
    spec?: unknown;
    [key: string]: unknown;
  },
  client?: CustomResourceClient,
) {
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
      undefined,
      client,
    );

    return {
      message: "Queue created successfully",
      data: response,
    };
  } catch (error) {
    throw new Error(formatK8sApiError(error));
  }
}

export async function updateQueue(
  name: string,
  updatedBody: { spec?: Record<string, unknown> },
  client?: CustomResourceClient,
) {
  if (!updatedBody.spec || Object.keys(updatedBody.spec).length === 0) {
    throw new Error("spec object is required and cannot be empty");
  }

  const specError = validateQueueManifestSpec(updatedBody.spec);
  if (specError) {
    throw new Error(specError);
  }

  try {
    await getQueue(name, client);
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
      undefined,
      client,
    );
    const updatedQueue = await getQueue(name, client);

    return {
      message: `Successfully updated queue ${name}`,
      patchResponse: response,
      updatedQueue,
    };
  } catch (error) {
    throw new Error(formatK8sApiError(error));
  }
}

export async function deleteQueue(name: string, client?: CustomResourceClient) {
  const queueName = name.toLowerCase();

  if (isProtectedQueue(queueName)) {
    throw new Error(protectedQueueDeleteMessage(queueName));
  }

  await getQueue(queueName, client);
  const response = await deleteCustomResource(
    volcanoResources.queue,
    queueName,
    undefined,
    client,
  );

  return {
    message: "Queue deleted successfully",
    data: response,
  };
}
