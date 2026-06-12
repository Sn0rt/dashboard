import { describe, expect, it } from "vitest";
import {
  buildPath,
  buildQueueSummary,
  getHealth,
  getPriorityWeight,
  getQueueSearchBlob,
  getStatus,
} from "../components/queues/queueViewModel";

const queue = (name, spec = {}, status = {}, schedulerMetrics = {}) => ({
  metadata: {
    labels: {
      team: "ml",
    },
    name,
  },
  spec,
  status,
  summary: {
    schedulerMetrics,
  },
});

describe("queue view model", () => {
  it("normalizes queue status and priority weight display", () => {
    const item = queue(
      "root",
      { priority: 3, weight: 1 },
      { state: "Active" },
      { scheduling: { weight: 5 } },
    );

    expect(getStatus(item)).toBe("Open");
    expect(getPriorityWeight(item)).toBe("3 / 5");
  });

  it("builds queue paths from parent relationships", () => {
    const root = queue("root");
    const prod = queue("prod", { parent: "root" });
    const training = queue("training", { parent: "prod" });
    const queueMap = new Map([
      ["root", root],
      ["prod", prod],
      ["training", training],
    ]);

    expect(buildPath(training, queueMap)).toBe("root / prod / training");
  });

  it("includes name, parent, and labels in the search blob", () => {
    const item = queue("training", { parent: "prod" });

    expect(getQueueSearchBlob(item)).toContain("training");
    expect(getQueueSearchBlob(item)).toContain("prod");
    expect(getQueueSearchBlob(item)).toContain("team=ml");
  });

  it("summarizes queue health categories for summary cards", () => {
    const hotQueue = queue(
      "hot",
      {},
      { state: "Open" },
      {
        scheduling: { overused: true },
      },
    );
    const idleQueue = queue("idle", {}, { state: "Closed" });
    const invalidQueue = queue("broken", {}, { state: "Unknown" });

    expect(getHealth(hotQueue).severity).toBe("hot");
    expect(getHealth(idleQueue).severity).toBe("idle");
    expect(getHealth(invalidQueue).severity).toBe("invalid");
    expect(buildQueueSummary([hotQueue, idleQueue, invalidQueue], 3)).toEqual({
      active: 1,
      hot: 1,
      idle: 1,
      invalid: 1,
      starving: 0,
      total: 3,
    });
  });
});
