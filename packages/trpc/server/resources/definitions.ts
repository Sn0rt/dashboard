export type ResourceScope = "Cluster" | "Namespaced";

export type CustomResourceDefinition = {
  apiGroup: string;
  version: string;
  plural: string;
  scope: ResourceScope;
};

export type ResourceIdentity = {
  definition: CustomResourceDefinition;
  namespace?: string;
  name?: string;
  subresource?: string;
};

export const volcanoResources = {
  job: {
    apiGroup: "batch.volcano.sh",
    version: "v1alpha1",
    plural: "jobs",
    scope: "Namespaced",
  },
  podGroup: {
    apiGroup: "scheduling.volcano.sh",
    version: "v1beta1",
    plural: "podgroups",
    scope: "Namespaced",
  },
  queue: {
    apiGroup: "scheduling.volcano.sh",
    version: "v1beta1",
    plural: "queues",
    scope: "Cluster",
  },
} as const satisfies Record<string, CustomResourceDefinition>;
