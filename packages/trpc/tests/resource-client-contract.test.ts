import type { V1Pod, V1PodList } from "@kubernetes/client-node";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createCustomResource,
  getCustomResource,
  listCustomResources,
  type CustomResourceClient,
} from "../server/resources/custom-resources";
import { volcanoResources } from "../server/resources/definitions";
import { createJob, deleteJob, updateJob } from "../server/resources/jobs";
import {
  getPodYaml,
  listPods,
  updatePod,
  type PodResourceClient,
} from "../server/resources/pods";
import {
  createQueue,
  deleteQueue,
  updateQueue,
} from "../server/resources/queues";

test("custom resource operations preserve client-node 1.x direct return values", async () => {
  const list = {
    apiVersion: "v1",
    kind: "QueueList",
    metadata: {},
    items: [{ metadata: { name: "default" } }],
  };
  const queue = { metadata: { name: "default" }, spec: { weight: 1 } };
  const client = {
    listClusterCustomObject: async () => list,
    getClusterCustomObject: async () => queue,
    createClusterCustomObject: async () => queue,
  } as unknown as CustomResourceClient;

  assert.equal(
    await listCustomResources(volcanoResources.queue, {}, client),
    list,
  );
  assert.equal(
    await getCustomResource(
      volcanoResources.queue,
      "default",
      undefined,
      client,
    ),
    queue,
  );
  assert.equal(
    await createCustomResource(
      volcanoResources.queue,
      queue,
      undefined,
      client,
    ),
    queue,
  );
});

test("pod services read and return direct V1Pod values", async () => {
  const currentPod: V1Pod = {
    metadata: {
      name: "demo",
      namespace: "default",
      resourceVersion: "10",
    },
    spec: {
      containers: [{ name: "main", image: "example:v1" }],
    },
  };
  let replacedPod: V1Pod | undefined;
  const client = {
    listPodForAllNamespaces: async () =>
      ({ items: [currentPod], metadata: {} }) as V1PodList,
    readNamespacedPod: async () => currentPod,
    replaceNamespacedPod: async ({ body }: { body: V1Pod }) => {
      replacedPod = body;
      return body;
    },
  } as unknown as PodResourceClient;

  const list = await listPods(1, 10, client);
  assert.equal(list.items[0], currentPod);

  const yaml = await getPodYaml("default", "demo", client);
  assert.match(yaml, /name: demo/);
  assert.doesNotMatch(yaml, /\bbody:/);

  const result = await updatePod(
    "default",
    "demo",
    { spec: { containers: [{ image: "example:v2" }] } },
    client,
  );

  assert.equal(result.data, replacedPod);
  assert.equal(replacedPod?.spec?.containers[0]?.image, "example:v2");
  assert.equal(replacedPod?.metadata?.resourceVersion, "10");
});

test("job mutations preserve direct custom-resource responses", async () => {
  const currentJob = {
    apiVersion: "batch.volcano.sh/v1alpha1",
    kind: "Job",
    metadata: {
      name: "demo",
      namespace: "default",
      resourceVersion: "10",
      uid: "job-uid",
    },
    spec: { tasks: [] },
  };
  const createdJob = { ...currentJob, metadata: { ...currentJob.metadata } };
  const deletedJob = { kind: "Status", status: "Success" };
  let replacedJob: typeof currentJob | undefined;
  const client = {
    getNamespacedCustomObject: async () => currentJob,
    createNamespacedCustomObject: async () => createdJob,
    replaceNamespacedCustomObject: async ({
      body,
    }: {
      body: typeof currentJob;
    }) => {
      replacedJob = body;
      return body;
    },
    deleteNamespacedCustomObject: async () => deletedJob,
  } as unknown as CustomResourceClient;

  const createResult = await createJob(currentJob, client);
  assert.equal(createResult.data, createdJob);

  const updateResult = await updateJob(
    "default",
    "demo",
    { spec: { tasks: [], queue: "team" } },
    client,
  );
  assert.equal(updateResult.data, replacedJob);
  assert.equal(replacedJob?.metadata.resourceVersion, "10");
  assert.deepEqual(replacedJob?.spec, { tasks: [], queue: "team" });

  const deleteResult = await deleteJob("default", "demo", client);
  assert.equal(deleteResult.data, deletedJob);
});

test("queue mutations preserve direct custom-resource responses", async () => {
  const queue = {
    apiVersion: "scheduling.volcano.sh/v1beta1",
    kind: "Queue",
    metadata: { name: "team" },
    spec: { weight: 1 },
  };
  const patchedQueue = { ...queue, spec: { weight: 2 } };
  const patchResponse = { kind: "Queue", metadata: { name: "team" } };
  const deletedQueue = { kind: "Status", status: "Success" };
  const client = {
    getClusterCustomObject: async () => patchedQueue,
    createClusterCustomObject: async () => queue,
    patchClusterCustomObject: async () => patchResponse,
    deleteClusterCustomObject: async () => deletedQueue,
  } as unknown as CustomResourceClient;

  const createResult = await createQueue(queue, client);
  assert.equal(createResult.data, queue);

  const updateResult = await updateQueue(
    "team",
    { spec: { weight: 2 } },
    client,
  );
  assert.equal(updateResult.patchResponse, patchResponse);
  assert.equal(updateResult.updatedQueue, patchedQueue);

  const deleteResult = await deleteQueue("team", client);
  assert.equal(deleteResult.data, deletedQueue);
});
