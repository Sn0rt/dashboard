import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import QueueSummaryCards from "../components/queues/QueueSummaryCards";

const makeQueue = (name, status, schedulerMetrics = {}) => ({
  metadata: { name },
  status: { state: status },
  summary: { schedulerMetrics },
});

const valueForCard = (label: string) => {
  const labelNode = screen.getByText(label);
  const card = labelNode.closest(".MuiPaper-root");
  if (!card) throw new Error(`Missing card for ${label}`);
  return within(card).getByText(/^\d+$/).textContent;
};

describe("QueueSummaryCards", () => {
  it("renders queue totals and health buckets", () => {
    render(
      <QueueSummaryCards
        totalQueues={4}
        queues={[
          makeQueue("hot", "Open", {
            scheduling: { overused: true },
          }),
          makeQueue("idle", "Closed"),
          makeQueue("invalid", "Unknown"),
        ]}
      />,
    );

    expect(valueForCard("Total Queues")).toBe("4");
    expect(valueForCard("Active Queues")).toBe("1");
    expect(valueForCard("Hot Queues")).toBe("1");
    expect(valueForCard("Idle Queues")).toBe("1");
    expect(valueForCard("Invalid Queues")).toBe("1");
  });
});
