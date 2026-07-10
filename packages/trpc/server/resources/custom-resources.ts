import { k8sApi } from "../utils/k8s";
import type { CustomResourceDefinition } from "./definitions";

type ListOptions = {
  namespace?: string;
  limit?: number;
  continueToken?: string;
  pretty?: string;
};

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
    return k8sApi.listNamespacedCustomObject({
      ...common,
      namespace: options.namespace,
    });
  }

  return k8sApi.listClusterCustomObject(common);
}

export async function getCustomResource(
  definition: CustomResourceDefinition,
  name: string,
  namespace?: string,
) {
  const common = {
    group: definition.apiGroup,
    version: definition.version,
    plural: definition.plural,
    name,
  };

  if (definition.scope === "Namespaced") {
    return k8sApi.getNamespacedCustomObject({
      ...common,
      namespace: requireNamespace(definition, namespace),
    });
  }

  return k8sApi.getClusterCustomObject(common);
}

export async function createCustomResource(
  definition: CustomResourceDefinition,
  body: object,
  namespace?: string,
) {
  const common = {
    group: definition.apiGroup,
    version: definition.version,
    plural: definition.plural,
    body,
  };

  if (definition.scope === "Namespaced") {
    return k8sApi.createNamespacedCustomObject({
      ...common,
      namespace: requireNamespace(definition, namespace),
    });
  }

  return k8sApi.createClusterCustomObject(common);
}

export async function replaceCustomResource(
  definition: CustomResourceDefinition,
  name: string,
  body: object,
  namespace?: string,
) {
  const common = {
    group: definition.apiGroup,
    version: definition.version,
    plural: definition.plural,
    name,
    body,
  };

  if (definition.scope === "Namespaced") {
    return k8sApi.replaceNamespacedCustomObject({
      ...common,
      namespace: requireNamespace(definition, namespace),
    });
  }

  return k8sApi.replaceClusterCustomObject(common);
}

export async function patchCustomResource(
  definition: CustomResourceDefinition,
  name: string,
  body: object,
  namespace?: string,
) {
  const common = {
    group: definition.apiGroup,
    version: definition.version,
    plural: definition.plural,
    name,
    body,
  };

  if (definition.scope === "Namespaced") {
    return k8sApi.patchNamespacedCustomObject({
      ...common,
      namespace: requireNamespace(definition, namespace),
    });
  }

  return k8sApi.patchClusterCustomObject(common);
}

export async function deleteCustomResource(
  definition: CustomResourceDefinition,
  name: string,
  namespace?: string,
) {
  const common = {
    group: definition.apiGroup,
    version: definition.version,
    plural: definition.plural,
    name,
    body: { propagationPolicy: "Foreground" },
  };

  if (definition.scope === "Namespaced") {
    return k8sApi.deleteNamespacedCustomObject({
      ...common,
      namespace: requireNamespace(definition, namespace),
    });
  }

  return k8sApi.deleteClusterCustomObject(common);
}
