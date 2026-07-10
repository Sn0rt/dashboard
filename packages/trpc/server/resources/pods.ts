import type { V1Pod, V1PodSpec } from "@kubernetes/client-node";
import { k8sCoreApi } from "../utils/k8s";
import {
  extractResourceListPage,
  fetchPaginatedResourceList,
} from "./pagination";
import { dumpResourceYaml } from "./yaml";

type PodPatch = {
  spec?: {
    containers?: Array<{
      image?: string;
      imagePullPolicy?: string;
    }>;
    initContainers?: Array<{ image?: string }>;
    activeDeadlineSeconds?: number;
    terminationGracePeriodSeconds?: number;
  };
};

export async function listPods(page: number, pageSize: number) {
  return fetchPaginatedResourceList<V1Pod>(
    page,
    pageSize,
    async (limit, continueToken) => {
      const response = await k8sCoreApi.listPodForAllNamespaces({
        limit,
        ...(continueToken && { continue: continueToken }),
      });
      return extractResourceListPage(response);
    },
    {
      filter: (pod) => !pod.metadata?.deletionTimestamp,
      countWithFilter: true,
    },
  );
}

export async function getPod(namespace: string, name: string) {
  return k8sCoreApi.readNamespacedPod({ name, namespace });
}

export async function getPodYaml(namespace: string, name: string) {
  return dumpResourceYaml(await getPod(namespace, name));
}

export async function listAllPods() {
  const response = await k8sCoreApi.listNamespacedPod({
    namespace: "default",
  });
  return {
    items: response.items,
    totalCount: response.items.length,
  };
}

export async function createPod(podManifest: unknown) {
  const pod = podManifest as V1Pod;
  const response = await k8sCoreApi.createNamespacedPod({
    namespace: pod.metadata?.namespace || "default",
    body: pod,
  });

  return {
    message: "Pod created successfully",
    data: response,
  };
}

export async function updatePod(
  namespace: string,
  name: string,
  patchData: PodPatch,
) {
  const currentPod = await getPod(namespace, name);
  const updatedSpec = {
    ...currentPod.spec,
  } as V1PodSpec;

  if (patchData.spec?.containers) {
    updatedSpec.containers =
      currentPod.spec?.containers?.map((container, index) => {
        const patchContainer = patchData.spec?.containers?.[index];
        if (!patchContainer) return container;

        return {
          ...container,
          ...(patchContainer.image && { image: patchContainer.image }),
          ...(patchContainer.imagePullPolicy && {
            imagePullPolicy: patchContainer.imagePullPolicy,
          }),
        };
      }) ?? [];
  }

  if (patchData.spec?.initContainers && currentPod.spec?.initContainers) {
    updatedSpec.initContainers = currentPod.spec.initContainers.map(
      (container, index) => {
        const patchContainer = patchData.spec?.initContainers?.[index];
        return patchContainer?.image
          ? { ...container, image: patchContainer.image }
          : container;
      },
    );
  }

  if (patchData.spec?.activeDeadlineSeconds !== undefined) {
    updatedSpec.activeDeadlineSeconds = patchData.spec.activeDeadlineSeconds;
  }
  if (patchData.spec?.terminationGracePeriodSeconds !== undefined) {
    updatedSpec.terminationGracePeriodSeconds =
      patchData.spec.terminationGracePeriodSeconds;
  }

  const updatedPod: V1Pod = {
    ...currentPod,
    metadata: {
      ...currentPod.metadata,
      resourceVersion: currentPod.metadata?.resourceVersion,
      uid: currentPod.metadata?.uid,
      creationTimestamp: currentPod.metadata?.creationTimestamp,
    },
    spec: updatedSpec,
  };

  const response = await k8sCoreApi.replaceNamespacedPod({
    name,
    namespace,
    body: updatedPod,
  });

  return {
    message: "Pod updated successfully",
    data: response,
  };
}

export async function deletePod(namespace: string, name: string) {
  const response = await k8sCoreApi.deleteNamespacedPod({ name, namespace });

  return {
    message: "Pod deleted successfully",
    data: response,
  };
}
