import React from "react";
import SchedulingStatusChip from "../scheduling/SchedulingStatusChip";
import { statusStyles } from "./queueViewModel";

export const QueueHealthBadge = ({ health }) => (
  <SchedulingStatusChip
    minWidth={78}
    status={health.label}
    tone={{
      background: health.bgcolor,
      border: `${health.color}22`,
      color: health.color,
      label: health.label,
    }}
  />
);

export const QueueStatusBadge = ({ state }) => {
  const status = statusStyles[state] || {
    background: "#f2f3f5",
    border: "#69707a22",
    color: "#69707a",
    label: state || "Unknown",
    tooltip: "Queue state reported by Volcano",
  };

  return (
    <SchedulingStatusChip
      minWidth={68}
      showTooltipIcon
      status={status.label}
      tone={status}
    />
  );
};
