import type { CustomObjectsApi } from "@kubernetes/client-node";
import { k8sApi } from "../utils/k8s";
import type { CustomResourceDefinition } from "./definitions";

type ListOptions = {
  namespace?: string;
  limit?: number;
  continueToken?: string;
  pretty?: string;
};

export type CustomResourceClient = Pick<
  CustomObjectsApi,
  | "listNamespacedCustomObject"
  | "listClusterCustomObject"
  | "getNamespacedCustomObject"
  | "getClusterCustomObject"
  | "createNamespacedCustomObject"
  | "createClusterCustomObject"
  | "replaceNamespacedCustomObject"
  | "replaceClusterCustomObject"
  | "patchNamespacedCustomObject"
  | "patchClusterCustomObject"
  | "deleteNamespacedCustomObject"
  | "deleteClusterCustomObject"
>;

function requireNamespace(
  definition: CustomResourceDefinition,
  namespace?: string,
): string {
  if (definition.scope === "Namespaced" && !namespace) {
    throw new Error(
      `Namespace is required for ${definition.apiGroup}/${definition.version}/${definition.plural}`,
    );
  }

  return namespace ?? "";
}

export async function listCustomResources(
  definition: CustomResourceDefinition,
  options: ListOptions = {},
  client: CustomResourceClient = k8sApi,
) {
  const common = {
    group: definition.apiGroup,
    version: definition.version,
    plural: definition.plural,
    ...(options.pretty && { pretty: options.pretty }),
    ...(options.limit !== undefined && { limit: options.limit }),
    ...(options.continueToken && { continue: options.continueToken }),
  };

  if (definition.scope === "Namespaced" && options.namespace) {
    return client.listNamespacedCustomObject({
      ...common,
      namespace: options.namespace,
    });
  }

  return client.listClusterCustomObject(common);
}

export async function getCustomResource(
  definition: CustomResourceDefinition,
  name: string,
  namespace?: string,
  client: CustomResourceClient = k8sApi,
) {
  const common = {
    group: definition.apiGroup,
    version: definition.version,
    plural: definition.plural,
    name,
  };

  if (definition.scope === "Namespaced") {
    return client.getNamespacedCustomObject({
      ...common,
      namespace: requireNamespace(definition, namespace),
    });
  }

  return client.getClusterCustomObject(common);
}

export async function createCustomResource(
  definition: CustomResourceDefinition,
  body: object,
  namespace?: string,
  client: CustomResourceClient = k8sApi,
) {
  const common = {
    group: definition.apiGroup,
    version: definition.version,
    plural: definition.plural,
    body,
  };

  if (definition.scope === "Namespaced") {
    return client.createNamespacedCustomObject({
      ...common,
      namespace: requireNamespace(definition, namespace),
    });
  }

  return client.createClusterCustomObject(common);
}

export async function replaceCustomResource(
  definition: CustomResourceDefinition,
  name: string,
  body: object,
  namespace?: string,
  client: CustomResourceClient = k8sApi,
) {
  const common = {
    group: definition.apiGroup,
    version: definition.version,
    plural: definition.plural,
    name,
    body,
  };

  if (definition.scope === "Namespaced") {
    return client.replaceNamespacedCustomObject({
      ...common,
      namespace: requireNamespace(definition, namespace),
    });
  }

  return client.replaceClusterCustomObject(common);
}

export async function patchCustomResource(
  definition: CustomResourceDefinition,
  name: string,
  body: object,
  namespace?: string,
  client: CustomResourceClient = k8sApi,
) {
  const common = {
    group: definition.apiGroup,
    version: definition.version,
    plural: definition.plural,
    name,
    body,
  };

  if (definition.scope === "Namespaced") {
    return client.patchNamespacedCustomObject({
      ...common,
      namespace: requireNamespace(definition, namespace),
    });
  }

  return client.patchClusterCustomObject(common);
}

export async function deleteCustomResource(
  definition: CustomResourceDefinition,
  name: string,
  namespace?: string,
  client: CustomResourceClient = k8sApi,
) {
  const common = {
    group: definition.apiGroup,
    version: definition.version,
    plural: definition.plural,
    name,
    body: { propagationPolicy: "Foreground" },
  };

  if (definition.scope === "Namespaced") {
    return client.deleteNamespacedCustomObject({
      ...common,
      namespace: requireNamespace(definition, namespace),
    });
  }

  return client.deleteClusterCustomObject(common);
}
