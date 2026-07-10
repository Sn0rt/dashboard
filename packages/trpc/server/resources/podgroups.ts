import { getCustomResource, listCustomResources } from "./custom-resources";
import { volcanoResources } from "./definitions";
import {
  extractResourceListPage,
  fetchPaginatedResourceList,
} from "./pagination";
import { dumpResourceYaml } from "./yaml";

type PodGroup = {
  metadata?: { name?: string; deletionTimestamp?: unknown };
  status?: { phase?: string };
};

type PodGroupFilters = {
  namespace?: string;
  search?: string;
  status?: string;
};

export async function listPodGroups(
  page: number,
  pageSize: number,
  filters: PodGroupFilters = {},
) {
  const namespace = filters.namespace?.trim() ?? "";
  const search = filters.search?.trim().toLowerCase() ?? "";
  const status = filters.status?.trim() ?? "";

  const matchesFilters = (podGroup: PodGroup) => {
    if (podGroup.metadata?.deletionTimestamp) return false;
    if (
      search &&
      !String(podGroup.metadata?.name ?? "")
        .toLowerCase()
        .includes(search)
    ) {
      return false;
    }
    if (status && status !== "All" && podGroup.status?.phase !== status) {
      return false;
    }
    return true;
  };

  return fetchPaginatedResourceList<PodGroup>(
    page,
    pageSize,
    async (limit, continueToken) => {
      const response = await listCustomResources(volcanoResources.podGroup, {
        namespace: namespace && namespace !== "All" ? namespace : undefined,
        limit,
        continueToken,
      });
      return extractResourceListPage(response);
    },
    {
      filter: matchesFilters,
      countWithFilter: true,
    },
  );
}

export async function getPodGroup(namespace: string, name: string) {
  return getCustomResource(volcanoResources.podGroup, name, namespace);
}

export async function getPodGroupYaml(namespace: string, name: string) {
  return dumpResourceYaml(await getPodGroup(namespace, name));
}
