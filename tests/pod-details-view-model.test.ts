import { beforeEach, describe, expect, it } from "vitest";
import {
  buildPodLogsStreamUrl,
  buildPodTerminalUrl,
  lineLevelColor,
  podJobName,
  podStatus,
  resourceCellValue,
} from "../components/pods/podDetailsViewModel";

describe("pod details view model", () => {
  beforeEach(() => {
    const sessionStorage = new Map();
    const localStorage = new Map();
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      value: {
        getItem: (key) => sessionStorage.get(key) || null,
        removeItem: (key) => sessionStorage.delete(key),
        setItem: (key, value) => sessionStorage.set(key, value),
      },
    });
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key) => localStorage.get(key) || null,
        removeItem: (key) => localStorage.delete(key),
        setItem: (key, value) => localStorage.set(key, value),
      },
    });
    window.sessionStorage.setItem("volcano-dashboard-token", "session-token");
    window.history.replaceState(null, "", "/workload/pods");
  });

  it("resolves display values from pod metadata and status", () => {
    const pod = {
      metadata: {
        labels: {
          "volcano.sh/job-name": "demo-job",
        },
      },
      status: {
        phase: "Running",
      },
    };

    expect(podStatus(pod)).toBe("Running");
    expect(podJobName(pod)).toBe("demo-job");
    expect(
      resourceCellValue(
        { resources: { limits: { cpu: "1" } } },
        "limits",
        "cpu",
      ),
    ).toBe("1");
  });

  it("classifies log line colors by severity", () => {
    expect(lineLevelColor("ERROR failed")).toBe("#f87171");
    expect(lineLevelColor("WARN slow")).toBe("#facc15");
    expect(lineLevelColor("INFO ready")).toBe("#4ade80");
    expect(lineLevelColor("DEBUG trace")).toBe("#93c5fd");
    expect(lineLevelColor("plain output")).toBe("#e5e7eb");
  });

  it("builds authenticated pod websocket URLs", () => {
    const host = window.location.host;

    expect(
      buildPodLogsStreamUrl({
        container: "main",
        name: "demo pod",
        namespace: "volcano demo",
        tailLines: 500,
      }),
    ).toBe(
      `ws://${host}/api/v1/pods/volcano%20demo/demo%20pod/logs/stream?container=main&follow=true&tailLines=500&token=session-token`,
    );

    expect(
      buildPodTerminalUrl({
        container: "main",
        name: "demo pod",
        namespace: "volcano demo",
      }),
    ).toBe(
      `ws://${host}/api/v1/pods/volcano%20demo/demo%20pod/terminal?container=main&token=session-token`,
    );
  });
});
