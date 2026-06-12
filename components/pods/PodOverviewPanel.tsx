import React from "react";
import { Box, Typography } from "@mui/material";
import PodStatusChip from "./PodStatusChip";
import {
  detailLabelSx,
  detailValueSx,
  PlainPodDetailTable,
  PodDetailGridRow,
  PodDetailSectionCard,
} from "./PodDetailLayout";
import {
  formatDateTime,
  podJobName,
  podStatus,
  resourceCellValue,
} from "./podDetailsViewModel";
import { calculateAge } from "../utils";

const PodMetadataLabels = ({ labels }) => (
  <Box
    sx={{
      display: "grid",
      gap: 1,
      gridTemplateColumns: "132px minmax(0, 1fr)",
      py: 0.5,
    }}
  >
    <Typography sx={detailLabelSx}>Labels</Typography>
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 0.75,
      }}
    >
      {labels.length === 0 ? (
        <Typography sx={detailValueSx}>-</Typography>
      ) : (
        labels.slice(0, 3).map(([key, value]) => (
          <PodStatusChip
            key={key}
            status={`${key}=${value}`}
            sx={{
              bgcolor: "#ffffff",
              border: "1px solid #d0d5dd",
              color: "#4b5563",
              fontWeight: 500,
              maxWidth: "100%",
            }}
          />
        ))
      )}
      {labels.length > 3 && (
        <PodStatusChip
          status={`+${labels.length - 3}`}
          sx={{
            bgcolor: "#ffffff",
            border: "1px solid #d0d5dd",
            color: "#4b5563",
            fontWeight: 500,
          }}
        />
      )}
    </Box>
  </Box>
);

const buildContainerRows = (pod) =>
  (pod?.spec?.containers || []).map((container) => {
    const containerStatus = (pod?.status?.containerStatuses || []).find(
      (status) => status.name === container.name,
    );
    return {
      image: container.image || "-",
      name: container.name || "-",
      ready: containerStatus ? `${containerStatus.ready ? 1 : 0}/1` : "0/1",
      restarts: containerStatus?.restartCount ?? 0,
      status: (
        <PodStatusChip
          status={
            containerStatus?.state?.running
              ? "Running"
              : containerStatus?.state?.waiting?.reason ||
                containerStatus?.state?.terminated?.reason ||
                "Waiting"
          }
        />
      ),
    };
  });

const buildResourceRows = (pod) =>
  (pod?.spec?.containers || []).flatMap((container) =>
    ["cpu", "memory", "nvidia.com/gpu"].map((resource) => ({
      container: container.name || "-",
      limits: resourceCellValue(container, "limits", resource),
      requests: resourceCellValue(container, "requests", resource),
      resource:
        resource === "nvidia.com/gpu"
          ? "GPU (nvidia.com/gpu)"
          : resource.toUpperCase(),
    })),
  );

const buildVolumeRows = (pod) =>
  (pod?.spec?.volumes || []).map((volume) => ({
    mountPath:
      (pod?.spec?.containers || [])
        .flatMap((container) => container.volumeMounts || [])
        .find((mount) => mount.name === volume.name)?.mountPath || "-",
    name: volume.name || "-",
    type: Object.keys(volume).find((key) => key !== "name") || "-",
  }));

const PodOverviewPanel = ({ pod }) => {
  const labels = Object.entries(pod?.metadata?.labels || {});
  const annotations = Object.entries(pod?.metadata?.annotations || {});
  const conditions = (pod?.status?.conditions || []).map((condition) => ({
    message: condition.message || "-",
    reason: condition.reason || "-",
    status: condition.status || "-",
    type: condition.type || "-",
  }));
  const containers = buildContainerRows(pod);
  const resources = buildResourceRows(pod);
  const volumes = buildVolumeRows(pod);

  return (
    <Box sx={{ display: "grid", gap: 1.75 }}>
      <Box
        sx={{
          display: "grid",
          gap: 1.75,
          gridTemplateColumns: {
            xs: "1fr",
            xl: "minmax(0, 1fr) minmax(0, 1fr)",
          },
        }}
      >
        <PodDetailSectionCard title="Basic Information">
          <Box sx={{ display: "grid", gap: 0.4 }}>
            <PodDetailGridRow
              label="Namespace"
              value={pod?.metadata?.namespace || "-"}
            />
            <PodDetailGridRow label="Job" value={podJobName(pod)} />
            <PodDetailGridRow label="Node" value={pod?.spec?.nodeName || "-"} />
            <PodDetailGridRow
              label="Pod IP"
              value={pod?.status?.podIP || "-"}
            />
            <PodDetailGridRow
              label="Created"
              value={formatDateTime(pod?.metadata?.creationTimestamp)}
            />
            <PodDetailGridRow
              label="Age"
              value={
                pod?.metadata?.creationTimestamp
                  ? calculateAge(pod.metadata.creationTimestamp)
                  : "-"
              }
            />
            <PodMetadataLabels labels={labels} />
            <PodDetailGridRow
              label="Annotations"
              value={annotations.length || "-"}
            />
            <PodDetailGridRow
              label="Restart Policy"
              value={pod?.spec?.restartPolicy || "-"}
            />
            <PodDetailGridRow
              label="QoS Class"
              value={pod?.status?.qosClass || "-"}
            />
          </Box>
        </PodDetailSectionCard>

        <PodDetailSectionCard title="Status">
          <Box sx={{ display: "grid", gap: 1.25 }}>
            <Box
              sx={{
                alignItems: "center",
                display: "grid",
                gap: 1,
                gridTemplateColumns: "96px minmax(0, 1fr)",
              }}
            >
              <Typography sx={detailLabelSx}>Phase</Typography>
              <PodStatusChip status={podStatus(pod)} />
            </Box>
            <Box>
              <Typography
                sx={{
                  ...detailLabelSx,
                  fontWeight: 700,
                  mb: 1,
                }}
              >
                Conditions
              </Typography>
              <PlainPodDetailTable
                columns={[
                  { key: "type", label: "Type" },
                  { key: "status", label: "Status" },
                  { key: "reason", label: "Reason" },
                  { key: "message", label: "Message" },
                ]}
                rows={conditions}
                emptyText="No pod conditions available."
              />
            </Box>
          </Box>
        </PodDetailSectionCard>
      </Box>

      <PodDetailSectionCard title="Containers">
        <PlainPodDetailTable
          columns={[
            { key: "name", label: "Name" },
            { key: "image", label: "Image" },
            { key: "status", label: "Status" },
            { key: "ready", label: "Ready" },
            { key: "restarts", label: "Restarts" },
          ]}
          rows={containers}
          emptyText="No containers found."
        />
      </PodDetailSectionCard>

      <Box
        sx={{
          display: "grid",
          gap: 1.75,
          gridTemplateColumns: {
            xs: "1fr",
            xl: "minmax(0, 1fr) minmax(0, 1fr)",
          },
        }}
      >
        <PodDetailSectionCard title="Resource Requests / Limits">
          <PlainPodDetailTable
            columns={[
              { key: "container", label: "Container" },
              { key: "resource", label: "Resource" },
              { key: "requests", label: "Requests" },
              { key: "limits", label: "Limits" },
            ]}
            rows={resources}
            emptyText="No resource requirements found."
          />
        </PodDetailSectionCard>

        <PodDetailSectionCard title="Volumes">
          <PlainPodDetailTable
            columns={[
              { key: "name", label: "Name" },
              { key: "type", label: "Type" },
              { key: "mountPath", label: "Mount Path" },
            ]}
            rows={volumes}
            emptyText="No volumes configured."
          />
        </PodDetailSectionCard>
      </Box>
    </Box>
  );
};

export default PodOverviewPanel;
