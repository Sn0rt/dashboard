import assert from "node:assert/strict";
import { test } from "node:test";
import {
  extractResourceListPage,
  fetchPaginatedResourceList,
} from "../server/resources/pagination";

test("extractResourceListPage reads a direct Kubernetes list body", () => {
  const page = extractResourceListPage({
    items: [{ id: 1 }],
    metadata: { _continue: "next", remainingItemCount: 2 },
  });

  assert.deepEqual(page, {
    items: [{ id: 1 }],
    continueToken: "next",
    remainingItemCount: 2,
  });
});

test("fetchPaginatedResourceList preserves items and Kubernetes totals", async () => {
  const page = await fetchPaginatedResourceList<{ id: number }>(
    1,
    2,
    async () => ({
      items: [{ id: 1 }, { id: 2 }],
      remainingItemCount: 1,
    }),
  );

  assert.deepEqual(page.items, [{ id: 1 }, { id: 2 }]);
  assert.equal(page.total, 3);
  assert.equal(page.totalPages, 2);
});
