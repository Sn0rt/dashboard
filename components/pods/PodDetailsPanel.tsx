import React from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import SyncIcon from "@mui/icons-material/Sync";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deletePod,
  fetchPod,
  getApiErrorMessage,
} from "../../lib/client/dashboard-api";
import { useAuth } from "../auth/AuthProvider";
import PodStatusChip from "./PodStatusChip";
import {
  headerMetaLabelSx,
  headerMetaValueSx,
  panelBg,
  panelBorder,
  PodDetailsPlaceholderPanel,
} from "./PodDetailLayout";
import PodEventsPanel from "./PodEventsPanel";
import PodLogsPanel from "./PodLogsPanel";
import PodOverviewPanel from "./PodOverviewPanel";
import PodTerminalPanel from "./PodTerminalPanel";
import PodYamlPanel from "./PodYamlPanel";
import { podJobName, podStatus } from "./podDetailsViewModel";

const PodDetailsPanel = ({
  elevated = false,
  onClose,
  selectedPod,
  selectedTab,
  setSelectedTab,
}) => {
  const auth = useAuth();
  const canWrite = auth?.canWrite !== false;
  const [selectedLogContainer, setSelectedLogContainer] = React.useState("");
  const [logTailLines, setLogTailLines] = React.useState(200);
  const [logFollow, setLogFollow] = React.useState(false);
  const [actionError, setActionError] = React.useState("");
  const [actionPending, setActionPending] = React.useState("");
  const queryClient = useQueryClient();
  const namespace = selectedPod?.metadata?.namespace;
  const name = selectedPod?.metadata?.name;
  const {
    data: pod,
    error,
    isLoading,
    refetch,
  } = useQuery({
    enabled: Boolean(namespace && name),
    initialData: selectedPod || undefined,
    queryFn: () => fetchPod(namespace, name),
    queryKey: ["pod", namespace, name],
  });
  const containers = React.useMemo(
    () => (pod?.spec?.containers || []).map((container) => container.name),
    [pod],
  );
  const podData = pod || selectedPod;

  React.useEffect(() => {
    if (!canWrite && ["logs", "terminal"].includes(selectedTab)) {
      setSelectedTab("overview");
    }
  }, [canWrite, selectedTab, setSelectedTab]);

  React.useEffect(() => {
    if (!containers.length) {
      setSelectedLogContainer("");
      return;
    }

    if (!selectedLogContainer || !containers.includes(selectedLogContainer)) {
      setSelectedLogContainer(containers[0]);
    }
  }, [containers, selectedLogContainer]);

  const handleSync = async () => {
    if (!namespace || !name) {
      return;
    }

    setActionError("");
    setActionPending("sync");
    try {
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ["pods"] }),
        queryClient.invalidateQueries({
          queryKey: ["podYaml", namespace, name],
        }),
        queryClient.invalidateQueries({
          queryKey: ["podEvents", namespace, name],
        }),
        queryClient.invalidateQueries({
          queryKey: ["podLogs", namespace, name],
        }),
      ]);
    } catch (syncError) {
      setActionError(
        getApiErrorMessage(syncError, "Failed to sync pod details"),
      );
    } finally {
      setActionPending("");
    }
  };

  const handleDelete = async () => {
    if (!namespace || !name) {
      return;
    }

    const confirmed = window.confirm(
      `Delete pod ${namespace}/${name}? This action cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    setActionError("");
    setActionPending("delete");
    try {
      await deletePod(namespace, name);
      await queryClient.invalidateQueries({ queryKey: ["pods"] });
      onClose?.();
    } catch (deleteError) {
      setActionError(getApiErrorMessage(deleteError, "Failed to delete pod"));
    } finally {
      setActionPending("");
    }
  };

  if (!selectedPod) {
    return (
      <Paper
        sx={{
          border: `1px solid ${panelBorder}`,
          borderRadius: 1.5,
          boxShadow: "none",
          minHeight: 680,
          p: 3,
        }}
      >
        <Typography color="text.secondary" sx={{ fontSize: 14 }}>
          Select a pod to view details.
        </Typography>
      </Paper>
    );
  }

  const renderSelectedTab = () => {
    if (isLoading && !podData) {
      return (
        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            justifyContent: "center",
            minHeight: 220,
          }}
        >
          <CircularProgress size={22} />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ boxShadow: "none" }}>
          {getApiErrorMessage(error, "Failed to fetch pod details")}
        </Alert>
      );
    }

    if (selectedTab === "overview") {
      return <PodOverviewPanel pod={pod} />;
    }

    if (selectedTab === "yaml") {
      return <PodYamlPanel enabled name={name} namespace={namespace} />;
    }

    if (canWrite && selectedTab === "logs") {
      return (
        <PodLogsPanel
          container={selectedLogContainer}
          containers={containers}
          follow={logFollow}
          name={name}
          namespace={namespace}
          onContainerChange={setSelectedLogContainer}
          onFollowChange={setLogFollow}
          onTailLinesChange={setLogTailLines}
          tailLines={logTailLines}
        />
      );
    }

    if (canWrite && selectedTab === "terminal") {
      return <PodTerminalPanel pod={podData} />;
    }

    if (selectedTab === "events") {
      return <PodEventsPanel name={name} namespace={namespace} />;
    }

    return <PodDetailsPlaceholderPanel title="Details" />;
  };

  return (
    <Paper
      sx={{
        bgcolor: panelBg,
        border: `1px solid ${panelBorder}`,
        borderRight: elevated ? 0 : `1px solid ${panelBorder}`,
        borderBottomLeftRadius: elevated ? 0 : 2,
        borderBottomRightRadius: 0,
        borderTopLeftRadius: elevated ? 0 : 1.5,
        borderTopRightRadius: 0,
        boxShadow: elevated
          ? "-18px 0 36px -22px rgba(15, 23, 42, 0.45)"
          : "0 8px 20px rgba(15, 23, 42, 0.06)",
        display: "flex",
        flexDirection: "column",
        height: elevated ? "100vh" : "auto",
        minHeight: elevated ? "100vh" : 680,
        overflow: "hidden",
        position: "relative",
        zIndex: 2,
        transition: "box-shadow 0.2s ease",
      }}
    >
      <Box
        sx={{
          borderBottom: `1px solid ${panelBorder}`,
          px: { xs: 1.75, md: 2.25 },
          py: 1.1,
        }}
      >
        <Box
          sx={{
            alignItems: "flex-start",
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                alignItems: "center",
                display: "flex",
                gap: 1.25,
                minWidth: 0,
              }}
            >
              <Inventory2OutlinedIcon
                sx={{
                  color: "text.primary",
                  fontSize: 18,
                }}
              />
              <Typography
                sx={{
                  color: "text.primary",
                  fontSize: 15.5,
                  fontWeight: 700,
                  lineHeight: 1.35,
                  minWidth: 0,
                }}
              >
                Pod: {name}
              </Typography>
            </Box>
            <Stack
              direction="row"
              spacing={{ xs: 1.5, md: 2.75 }}
              sx={{
                flexWrap: "wrap",
                mt: 1.15,
                rowGap: 0.65,
              }}
            >
              <Box
                sx={{
                  alignItems: "center",
                  display: "flex",
                  gap: 0.6,
                }}
              >
                <Typography sx={headerMetaLabelSx}>Namespace:</Typography>
                <Typography sx={headerMetaValueSx}>
                  {podData?.metadata?.namespace || "-"}
                </Typography>
              </Box>
              <Box
                sx={{
                  alignItems: "center",
                  display: "flex",
                  gap: 0.6,
                }}
              >
                <Typography sx={headerMetaLabelSx}>Job:</Typography>
                <Typography sx={headerMetaValueSx}>
                  {podJobName(podData)}
                </Typography>
              </Box>
              <Box
                sx={{
                  alignItems: "center",
                  display: "flex",
                  gap: 0.6,
                }}
              >
                <Typography sx={headerMetaLabelSx}>Node:</Typography>
                <Typography sx={headerMetaValueSx}>
                  {podData?.spec?.nodeName || "-"}
                </Typography>
              </Box>
              <Box
                sx={{
                  alignItems: "center",
                  display: "flex",
                  gap: 0.8,
                }}
              >
                <Typography sx={headerMetaLabelSx}>Status:</Typography>
                <PodStatusChip status={podStatus(podData)} />
              </Box>
            </Stack>
          </Box>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", flexShrink: 0 }}
          >
            <Button
              disabled={Boolean(actionPending)}
              onClick={handleSync}
              size="small"
              startIcon={<SyncIcon fontSize="small" />}
              sx={{
                borderColor: "#16a34a",
                color: "#15803d",
                minWidth: 82,
                textTransform: "none",
                "&:hover": {
                  bgcolor: "rgba(22, 163, 74, 0.08)",
                  borderColor: "#15803d",
                },
              }}
              variant="outlined"
            >
              {actionPending === "sync" ? "Syncing" : "Sync"}
            </Button>
            {canWrite && (
              <Button
                disabled={Boolean(actionPending)}
                onClick={handleDelete}
                size="small"
                startIcon={<DeleteOutlineIcon fontSize="small" />}
                sx={{
                  borderColor: "#dc2626",
                  color: "#dc2626",
                  minWidth: 84,
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: "rgba(220, 38, 38, 0.08)",
                    borderColor: "#b91c1c",
                  },
                }}
                variant="outlined"
              >
                {actionPending === "delete" ? "Deleting" : "Delete"}
              </Button>
            )}
            <IconButton onClick={onClose} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>
        {actionError && (
          <Alert severity="error" sx={{ boxShadow: "none", mt: 1.25 }}>
            {actionError}
          </Alert>
        )}
      </Box>

      <Tabs
        onChange={(_, value) => setSelectedTab(value)}
        sx={{
          borderBottom: `1px solid ${panelBorder}`,
          minHeight: 44,
          px: 1,
          "& .MuiTab-root": {
            fontSize: 13,
            fontWeight: 500,
            minHeight: 44,
            px: 1.25,
            textTransform: "none",
          },
        }}
        value={selectedTab}
        variant="scrollable"
      >
        <Tab label="Overview" value="overview" />
        {canWrite && <Tab label="Logs" value="logs" />}
        {canWrite && <Tab label="Terminal" value="terminal" />}
        <Tab label="YAML" value="yaml" />
        <Tab label="Events" value="events" />
      </Tabs>

      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>{renderSelectedTab()}</Box>
    </Paper>
  );
};

export default PodDetailsPanel;
