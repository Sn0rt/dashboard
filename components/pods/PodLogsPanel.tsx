import React from "react";
import {
  Alert,
  Box,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import { useQuery } from "@tanstack/react-query";
import {
  fetchPodLogs,
  getApiErrorMessage,
} from "../../lib/client/dashboard-api";
import { detailLabelSx, panelBorder } from "./PodDetailLayout";
import PodLogTerminal from "./PodLogTerminal";
import { buildPodLogsStreamUrl } from "./podDetailsViewModel";

const PodLogsToolbar = ({
  container,
  containers,
  follow,
  onContainerChange,
  onFollowChange,
  onRefresh,
  onTailLinesChange,
  streamStatus,
  tailLines,
}) => (
  <Stack
    direction={{ xs: "column", md: "row" }}
    spacing={1.5}
    sx={{
      alignItems: { xs: "stretch", md: "center" },
      justifyContent: "space-between",
      mb: 1.5,
    }}
  >
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.25}
      sx={{ alignItems: { xs: "stretch", sm: "center" } }}
    >
      <Typography sx={detailLabelSx}>Container</Typography>
      <Select
        onChange={(event) => onContainerChange(event.target.value)}
        size="small"
        sx={{ minWidth: 180 }}
        value={container}
      >
        {(containers.length ? containers : [container || "main"]).map(
          (item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ),
        )}
      </Select>
    </Stack>

    <Stack
      direction="row"
      spacing={1.25}
      sx={{
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: { xs: "flex-start", md: "flex-end" },
        rowGap: 1,
      }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={follow}
            color="primary"
            onChange={(event) => onFollowChange(event.target.checked)}
            size="small"
          />
        }
        label="Follow"
        sx={{
          color: "text.secondary",
          m: 0,
          "& .MuiFormControlLabel-label": {
            fontSize: 12,
            fontWeight: 600,
          },
        }}
      />
      {follow && (
        <Typography
          sx={{
            color:
              streamStatus === "connected"
                ? "success.main"
                : streamStatus === "error"
                  ? "error.main"
                  : "text.secondary",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {streamStatus === "connected"
            ? "Live"
            : streamStatus === "connecting"
              ? "Connecting"
              : streamStatus === "closed"
                ? "Closed"
                : "Idle"}
        </Typography>
      )}
      <Typography sx={detailLabelSx}>Tail</Typography>
      <Select
        onChange={(event) => onTailLinesChange(Number(event.target.value))}
        size="small"
        sx={{ minWidth: 150 }}
        value={tailLines}
      >
        {[50, 100, 200, 500, 1000].map((value) => (
          <MenuItem key={value} value={value}>
            Last {value} lines
          </MenuItem>
        ))}
      </Select>
      <IconButton
        aria-label="refresh logs"
        onClick={onRefresh}
        size="small"
        sx={{
          border: `1px solid ${panelBorder}`,
          borderRadius: 1,
          height: 38,
          width: 38,
        }}
      >
        <RefreshIcon fontSize="small" />
      </IconButton>
    </Stack>
  </Stack>
);

const PodLogsPanel = ({
  container,
  containers,
  follow,
  name,
  namespace,
  onContainerChange,
  onFollowChange,
  onTailLinesChange,
  tailLines,
}) => {
  const [streamContent, setStreamContent] = React.useState("");
  const [streamError, setStreamError] = React.useState("");
  const [streamRefreshKey, setStreamRefreshKey] = React.useState(0);
  const [streamStatus, setStreamStatus] = React.useState("idle");
  const streamContentRef = React.useRef("");
  const terminalRef = React.useRef(null);
  const { data, error, isFetching, isLoading, refetch } = useQuery({
    enabled: Boolean(namespace && name && !follow),
    queryFn: () =>
      fetchPodLogs(namespace, name, {
        container,
        tailLines,
      }),
    queryKey: ["podLogs", namespace, name, container, tailLines],
  });
  const displayedLogs = follow ? streamContent : data || "";
  const displayedError = follow ? streamError : error;
  const isLogsLoading =
    follow && streamStatus === "connecting"
      ? !streamContent
      : isLoading || isFetching;

  React.useEffect(() => {
    if (!follow || !namespace || !name || !container) {
      setStreamStatus("idle");
      setStreamError("");
      return undefined;
    }

    let disposed = false;
    const socket = new WebSocket(
      buildPodLogsStreamUrl({ container, name, namespace, tailLines }),
    );

    setStreamContent("");
    streamContentRef.current = "";
    setStreamError("");
    setStreamStatus("connecting");

    socket.addEventListener("open", () => {
      if (!disposed) {
        setStreamStatus("connected");
      }
    });

    socket.addEventListener("message", (event) => {
      if (disposed) {
        return;
      }
      const chunk =
        typeof event.data === "string" ? event.data : String(event.data);
      setStreamContent((current) => {
        const next = `${current}${chunk}`;
        streamContentRef.current = next;
        return next;
      });
    });

    socket.addEventListener("error", () => {
      if (!disposed) {
        setStreamError("Pod log stream connection failed.");
        setStreamStatus("error");
      }
    });

    socket.addEventListener("close", (event) => {
      if (disposed) {
        return;
      }
      setStreamStatus("closed");
      if (!event.wasClean && !streamContentRef.current) {
        setStreamError(
          `Pod log stream closed unexpectedly (${event.code || 1006}).`,
        );
      }
    });

    return () => {
      disposed = true;
      socket.close(1000, "logs panel detached");
    };
  }, [container, follow, name, namespace, streamRefreshKey, tailLines]);

  React.useEffect(() => {
    if (!follow || !terminalRef.current) {
      return;
    }
    terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [displayedLogs, follow]);

  const handleCopyLogs = async () => {
    await navigator.clipboard?.writeText(displayedLogs || "");
  };

  const handleDownloadLogs = () => {
    const blob = new Blob([displayedLogs || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name || "pod"}.log`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    if (follow) {
      setStreamContent("");
      streamContentRef.current = "";
      setStreamRefreshKey((current) => current + 1);
      return;
    }
    refetch();
  };

  const toolbar = (
    <PodLogsToolbar
      container={container}
      containers={containers}
      follow={follow}
      onContainerChange={onContainerChange}
      onFollowChange={onFollowChange}
      onRefresh={handleRefresh}
      onTailLinesChange={onTailLinesChange}
      streamStatus={streamStatus}
      tailLines={tailLines}
    />
  );

  if (isLogsLoading) {
    return (
      <Box>
        {toolbar}
        <Box
          sx={{
            alignItems: "center",
            bgcolor: "#171717",
            borderRadius: 1,
            display: "flex",
            justifyContent: "center",
            minHeight: 520,
          }}
        >
          <CircularProgress size={22} />
        </Box>
      </Box>
    );
  }

  if (displayedError) {
    return (
      <Box>
        {toolbar}
        <Alert severity="error" sx={{ boxShadow: "none" }}>
          {typeof displayedError === "string"
            ? displayedError
            : getApiErrorMessage(displayedError, "Failed to fetch pod logs")}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative" }}>
      {toolbar}
      <Box sx={{ position: "relative" }}>
        <PodLogTerminal content={displayedLogs} terminalRef={terminalRef} />
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            position: "absolute",
            right: 18,
            top: 18,
          }}
        >
          <IconButton
            aria-label="search logs"
            size="small"
            sx={{ color: "#e5e7eb" }}
          >
            <SearchIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label="copy logs"
            onClick={handleCopyLogs}
            size="small"
            sx={{ color: "#e5e7eb" }}
          >
            <ContentCopyOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label="download logs"
            onClick={handleDownloadLogs}
            size="small"
            sx={{ color: "#e5e7eb" }}
          >
            <DownloadOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
};

export default PodLogsPanel;
