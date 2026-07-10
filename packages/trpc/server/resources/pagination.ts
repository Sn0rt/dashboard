import {
  buildPaginatedResponse,
  type PaginatedResponse,
} from "../router/pagination";

const LIST_CHUNK_LIMIT = 250;

export type ResourceListPage = {
  items: unknown[];
  continueToken?: string;
  remainingItemCount?: number;
};

type ListPageFn = (
  limit: number,
  continueToken?: string,
) => Promise<ResourceListPage>;

export async function fetchPaginatedResourceList<T>(
  page: number,
  pageSize: number,
  listPage: ListPageFn,
  options: {
    filter?: (item: T) => boolean;
    countWithFilter?: boolean;
  } = {},
): Promise<PaginatedResponse<T>> {
  const filter = options.filter ?? (() => true);
  const countWithFilter = options.countWithFilter ?? false;
  const skipTarget = (page - 1) * pageSize;

  let continueToken: string | undefined;
  let skipped = 0;
  const pageItems: T[] = [];
  let totalFromFirstChunk: number | undefined;
  let isFirstRequest = true;

  while (pageItems.length < pageSize) {
    const response = await listPage(LIST_CHUNK_LIMIT, continueToken);
    const filtered = (response.items as T[]).filter(filter);

    if (
      isFirstRequest &&
      page === 1 &&
      !countWithFilter &&
      response.remainingItemCount !== undefined
    ) {
      totalFromFirstChunk = filtered.length + response.remainingItemCount;
    }
    isFirstRequest = false;

    for (const item of filtered) {
      if (skipped < skipTarget) {
        skipped++;
        continue;
      }
      if (pageItems.length < pageSize) {
        pageItems.push(item);
      }
    }

    continueToken = response.continueToken;
    if (!continueToken) {
      break;
    }
  }

  const total = countWithFilter
    ? await countFilteredItems(listPage, filter)
    : (totalFromFirstChunk ?? (await countFilteredItems(listPage, filter)));

  return buildPaginatedResponse(pageItems, page, pageSize, total);
}

async function countFilteredItems<T>(
  listPage: ListPageFn,
  filter: (item: T) => boolean,
): Promise<number> {
  let total = 0;
  let continueToken: string | undefined;

  do {
    const response = await listPage(LIST_CHUNK_LIMIT, continueToken);
    total += (response.items as T[]).filter(filter).length;
    continueToken = response.continueToken;
  } while (continueToken);

  return total;
}

export function extractResourceListPage(response: {
  items?: unknown[];
  metadata?: { _continue?: string; remainingItemCount?: number };
}): ResourceListPage {
  return {
    items: response.items ?? [],
    continueToken: response.metadata?._continue,
    remainingItemCount: response.metadata?.remainingItemCount,
  };
}
