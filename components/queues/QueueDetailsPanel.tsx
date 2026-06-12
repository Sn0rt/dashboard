import React, { useState } from "react";
import { Box, Button, Chip, Paper, Tooltip, Typography } from "@mui/material";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useQuery } from "@tanstack/react-query";
import {
  fetchQueueEvents,
  fetchQueueYaml,
  updateQueueYaml,
} from "../../lib/client/dashboard-api";
import ResourceDetailDrawer from "../details/ResourceDetailDrawer";
import ResourceEventsPanel from "../details/ResourceEventsPanel";
import YamlViewer from "../details/YamlViewer";
import {
  getUsageToneColor,
  ResourceStatusLegend,
} from "../scheduling/ResourceStatus";
import { QueueResourceUsageDetailBar } from "./QueueResourceUsageView";
import {
  getQueueUsageSummary,
  QUEUE_RESOURCE_COLUMNS,
} from "./queueResourceUsage";
import { QueueHealthBadge, QueueStatusBadge } from "./QueueStatusBadges";
import {
  buildPath,
  formatDate,
  getFairnessShare,
  getHealth,
  getOverusedLabel,
  getPriorityWeight,
  getQueueEvents,
  getQueueName,
  getStatus,
} from "./queueViewModel";

type QueueDetailRowProps = {
  label: React.ReactNode;
  value?: React.ReactNode;
  valueNode?: React.ReactNode;
};

const detailCardSx = {
  border: "1px solid #dfe3e8",
  borderRadius: 1.25,
  boxShadow: "none",
  p: 2,
};

const QueueDetailRow = ({ label, value, valueNode }: QueueDetailRowProps) => (
  <Box
    sx={{
      display: "grid",
      gap: 1,
      gridTemplateColumns: "90px 1fr",
      py: 0.65,
    }}
  >
    <Typography sx={{ fontSize: 13 }}>{label}:</Typography>
    <Box sx={{ fontSize: 13 }}>{valueNode || value}</Box>
  </Box>
);

const QueueBooleanInfoValue = ({ label, value }) => (
  <Box sx={{ alignItems: "center", display: "flex", gap: 0.55 }}>
    <Typography sx={{ color: value ? "#12833f" : "#69707a", fontSize: 13 }}>
      {String(value)}
    </Typography>
    <Tooltip title={`${label} is configured on the queue spec.`}>
      <InfoOutlinedIcon sx={{ color: "text.disabled", fontSize: 14 }} />
    </Tooltip>
  </Box>
);

const QueueLabelChips = ({ labels }) => {
  const entries = Object.entries(labels || {});
  if (!entries.length) return <Typography sx={{ fontSize: 13 }}>-</Typography>;

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.65 }}>
      {entries.slice(0, 4).map(([key, value]) => (
        <Chip
          key={key}
          label={`${key}: ${value}`}
          size="small"
          sx={{
            bgcolor: "#e8f2ff",
            color: "#1266c3",
            fontSize: 11,
            height: 22,
          }}
        />
      ))}
      {entries.length > 4 && (
        <Chip
          label={`+${entries.length - 4}`}
          size="small"
          sx={{ fontSize: 11, height: 22 }}
        />
      )}
    </Box>
  );
};

export const QueueBasicInformationCard = ({ queueMap, selectedQueue }) => {
  const queueName = getQueueName(selectedQueue);
  const annotations = Object.keys(selectedQueue?.metadata?.annotations || {});

  return (
    <Paper sx={detailCardSx}>
      <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1.25 }}>
        Basic Information
      </Typography>
      <QueueDetailRow label="Name" value={queueName} />
      <QueueDetailRow label="Path" value={buildPath(selectedQueue, queueMap)} />
      <QueueDetailRow
        label="Parent"
        value={selectedQueue?.spec?.parent || "root"}
      />
      <QueueDetailRow
        label="State"
        valueNode={<QueueStatusBadge state={getStatus(selectedQueue)} />}
      />
      <QueueDetailRow
        label="Priority / Weight"
        value={getPriorityWeight(selectedQueue)}
      />
      <QueueDetailRow
        label="Preemptable"
        valueNode={
          <QueueBooleanInfoValue
            label="Preemptable"
            value={selectedQueue?.spec?.reclaimable ?? true}
          />
        }
      />
      <QueueDetailRow
        label="Reclaimable"
        valueNode={
          <QueueBooleanInfoValue
            label="Reclaimable"
            value={selectedQueue?.spec?.reclaimable ?? true}
          />
        }
      />
      <QueueDetailRow
        label="Created At"
        value={formatDate(selectedQueue?.metadata?.creationTimestamp)}
      />
      <QueueDetailRow
        label="Updated At"
        value={formatDate(
          selectedQueue?.metadata?.managedFields?.[0]?.time ||
            selectedQueue?.metadata?.creationTimestamp,
        )}
      />
      <QueueDetailRow
        label="Labels"
        valueNode={<QueueLabelChips labels={selectedQueue?.metadata?.labels} />}
      />
      <QueueDetailRow label="Annotations" value={annotations.length || "-"} />
    </Paper>
  );
};

export const QueueHealthStatusCard = ({ selectedQueue }) => {
  const health = getHealth(selectedQueue);
  const { stats, usagePercent } = getQueueUsageSummary(selectedQueue);
  const overused = getOverusedLabel(selectedQueue);
  const share = getFairnessShare(selectedQueue);

  return (
    <Paper sx={detailCardSx}>
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          mb: 1.5,
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
          Health Status
        </Typography>
        <QueueHealthBadge health={health} />
      </Box>
      <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
        <Typography sx={{ fontSize: 13 }}>
          Allocated resources are {usagePercent}% of deserved resources
        </Typography>
        <Tooltip title="Calculated from Volcano scheduler allocated / deserved metrics.">
          <InfoOutlinedIcon sx={{ color: "text.disabled", fontSize: 14 }} />
        </Tooltip>
      </Box>
      <Typography
        color="text.secondary"
        sx={{ fontSize: 13, fontWeight: 700, mt: 3, mb: 1.25 }}
      >
        Health Indicators
      </Typography>
      <Box sx={{ display: "grid", gap: 1.25 }}>
        {stats.map((item) => (
          <Box
            key={item.label}
            sx={{
              alignItems: "center",
              display: "grid",
              gap: 1,
              gridTemplateColumns: "1fr 58px",
            }}
          >
            <Box
              sx={{
                alignItems: "center",
                display: "flex",
                gap: 0.9,
              }}
            >
              <Box
                sx={{
                  bgcolor:
                    item.label === "CPU"
                      ? "#16a34a"
                      : item.label === "Memory"
                        ? "#2563eb"
                        : "#7c3aed",
                  borderRadius: "50%",
                  height: 9,
                  width: 9,
                }}
              />
              <Typography sx={{ fontSize: 13 }}>
                {item.label} Allocation
              </Typography>
            </Box>
            <Typography
              sx={{
                color: getUsageToneColor(item.usageTone),
                fontFamily:
                  '"SFMono-Regular", "Roboto Mono", Consolas, monospace',
                fontSize: 13,
                textAlign: "right",
              }}
            >
              {item.usageLabel}
            </Typography>
          </Box>
        ))}
        {[
          ["Fairness Share", share],
          ["Overused", overused],
        ].map(([label, value]) => (
          <Box
            key={label}
            sx={{
              alignItems: "center",
              display: "grid",
              gap: 1,
              gridTemplateColumns: "1fr 58px",
            }}
          >
            <Box
              sx={{
                alignItems: "center",
                display: "flex",
                gap: 0.9,
              }}
            >
              <Box
                sx={{
                  bgcolor: "#c7ccd3",
                  borderRadius: "50%",
                  height: 9,
                  width: 9,
                }}
              />
              <Typography sx={{ fontSize: 13 }}>{label}</Typography>
            </Box>
            <Typography
              sx={{
                fontFamily:
                  '"SFMono-Regular", "Roboto Mono", Consolas, monospace',
                fontSize: 13,
                textAlign: "right",
              }}
            >
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export const QueueResourceSummaryCard = ({ selectedQueue }) => {
  const [mode, setMode] = useState("absolute");

  return (
    <Paper sx={{ ...detailCardSx, gridColumn: "1 / -1" }}>
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          mb: 1.5,
        }}
      >
        <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
            Resource Summary
          </Typography>
          <Tooltip title="Requested, allocated, deserved, and configured capability for this queue. Metrics come from the Volcano scheduler endpoint.">
            <InfoOutlinedIcon sx={{ color: "text.disabled", fontSize: 14 }} />
          </Tooltip>
        </Box>
        <Box
          sx={{
            border: "1px solid #dfe3e8",
            borderRadius: 1,
            display: "flex",
            overflow: "hidden",
          }}
        >
          {[
            ["absolute", "Absolute"],
            ["percentage", "Percentage"],
          ].map(([value, label]) => (
            <Button
              key={value}
              onClick={() => setMode(value)}
              size="small"
              sx={{
                bgcolor: mode === value ? "#f4f7fb" : "#ffffff",
                borderRadius: 0,
                color: mode === value ? "#0f63c8" : "text.primary",
                fontSize: 12,
                fontWeight: 700,
                minWidth: 92,
                textTransform: "none",
              }}
            >
              {label}
            </Button>
          ))}
        </Box>
      </Box>
      <ResourceStatusLegend />
      <Box sx={{ mt: 1.5 }}>
        {QUEUE_RESOURCE_COLUMNS.map((resource) => (
          <QueueResourceUsageDetailBar
            key={resource.key}
            mode={mode}
            queue={selectedQueue}
            resource={resource}
          />
        ))}
      </Box>
    </Paper>
  );
};

export const QueueRecentEventsCard = ({ selectedQueue }) => (
  <Paper sx={{ ...detailCardSx, gridColumn: "1 / -1" }}>
    <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1.5 }}>
      Recent Events
    </Typography>
    <Box sx={{ display: "grid", gap: 1.25 }}>
      {getQueueEvents(selectedQueue).map((event, index) => (
        <Box
          key={`${event.description}-${index}`}
          sx={{
            alignItems: "center",
            display: "grid",
            gap: 2,
            gridTemplateColumns: "100px 180px 1fr",
          }}
        >
          <Box
            sx={{
              alignItems: "center",
              display: "flex",
              gap: 0.75,
            }}
          >
            <Box
              sx={{
                bgcolor: event.type === "Warning" ? "#f97316" : "#16a34a",
                borderRadius: "50%",
                height: 9,
                width: 9,
              }}
            />
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
              {event.type}
            </Typography>
          </Box>
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
            {event.time}
          </Typography>
          <Typography sx={{ fontSize: 13 }}>{event.description}</Typography>
        </Box>
      ))}
    </Box>
  </Paper>
);

const QueueOverviewPanel = ({ queueMap, selectedQueue }) => (
  <Box
    sx={{
      display: "grid",
      gap: 2,
      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
    }}
  >
    <QueueBasicInformationCard
      queueMap={queueMap}
      selectedQueue={selectedQueue}
    />
    <QueueHealthStatusCard selectedQueue={selectedQueue} />
    <QueueResourceSummaryCard selectedQueue={selectedQueue} />
    <QueueRecentEventsCard selectedQueue={selectedQueue} />
  </Box>
);

const QueueDetailsPanel = ({
  canWrite = true,
  onClose,
  onYamlSaved,
  queueMap,
  selectedQueue,
}) => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const queueName = getQueueName(selectedQueue);
  const yamlQuery = useQuery({
    enabled: Boolean(selectedQueue && selectedTab === "configuration"),
    queryFn: () => fetchQueueYaml(queueName),
    queryKey: ["queueYaml", queueName],
  });

  return (
    <ResourceDetailDrawer
      activeTab={selectedTab}
      icon={<FolderOutlinedIcon sx={{ fontSize: 18 }} />}
      meta={[
        {
          label: "Path",
          value: selectedQueue ? buildPath(selectedQueue, queueMap) : "-",
        },
        {
          label: "Parent",
          value: selectedQueue?.spec?.parent || "root",
        },
        {
          label: "State",
          valueNode: selectedQueue ? (
            <QueueStatusBadge state={getStatus(selectedQueue)} />
          ) : null,
        },
      ]}
      onClose={onClose}
      onTabChange={setSelectedTab}
      open={Boolean(selectedQueue)}
      tabs={[
        { label: "Overview", value: "overview" },
        { label: "YAML", value: "configuration" },
        { label: "Events", value: "events" },
      ]}
      title={`Queue: ${queueName}`}
      renderTab={(tab) =>
        tab === "configuration" ? (
          <YamlViewer
            data={yamlQuery.data}
            editable={canWrite}
            error={yamlQuery.error}
            fill
            isLoading={yamlQuery.isLoading || yamlQuery.isFetching}
            onSubmit={async (manifest) => {
              await updateQueueYaml(queueName, manifest);
              await yamlQuery.refetch();
              await onYamlSaved?.();
            }}
          />
        ) : tab === "events" ? (
          <ResourceEventsPanel
            emptyText="No queue events available."
            errorMessage="Failed to fetch queue events"
            queryFn={() => fetchQueueEvents(queueName)}
            queryKey={["queueEvents", queueName]}
          />
        ) : (
          <QueueOverviewPanel
            queueMap={queueMap}
            selectedQueue={selectedQueue}
          />
        )
      }
    />
  );
};

export default QueueDetailsPanel;
