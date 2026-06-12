import React from "react";
import {
  Box,
  Button,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { detailLabelSx, terminalSx } from "./PodDetailLayout";
import { buildPodTerminalUrl } from "./podDetailsViewModel";
import {
  getTerminalSession,
  releaseTerminalSession,
} from "./podTerminalSession";

const xtermTheme = {
  background: "#171717",
  black: "#171717",
  blue: "#60a5fa",
  brightBlack: "#6b7280",
  brightBlue: "#93c5fd",
  brightCyan: "#67e8f9",
  brightGreen: "#86efac",
  brightMagenta: "#f0abfc",
  brightRed: "#fca5a5",
  brightWhite: "#ffffff",
  brightYellow: "#fde68a",
  cursor: "#e5e7eb",
  cyan: "#22d3ee",
  foreground: "#e5e7eb",
  green: "#4ade80",
  magenta: "#e879f9",
  red: "#f87171",
  selectionBackground: "#374151",
  white: "#e5e7eb",
  yellow: "#facc15",
};

const PodTerminalPanel = ({ pod }) => {
  const namespace = pod?.metadata?.namespace || "default";
  const name = pod?.metadata?.name || "";
  const container = pod?.spec?.containers?.[0]?.name || "main";
  const containers = (pod?.spec?.containers || []).map((item) => item.name);
  const [selectedContainer, setSelectedContainer] = React.useState(container);
  const [connected, setConnected] = React.useState(false);
  const terminalRef = React.useRef(null);
  const socketRef = React.useRef(null);
  const termRef = React.useRef(null);
  const fitAddonRef = React.useRef(null);

  React.useEffect(() => {
    let disposed = false;
    let resizeObserver;
    let dataDisposable;
    let session;
    let sessionListener;
    const sessionKey = `${namespace}/${name}/${selectedContainer}`;

    if (!terminalRef.current) {
      return undefined;
    }

    Promise.all([import("@xterm/xterm"), import("@xterm/addon-fit")]).then(
      ([xtermModule, fitModule]) => {
        if (disposed || !terminalRef.current) {
          return;
        }

        const term = new xtermModule.Terminal({
          allowProposedApi: false,
          cursorBlink: true,
          convertEol: true,
          fontFamily:
            '"Roboto Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
          fontSize: 12.5,
          lineHeight: 1.35,
          scrollback: 5000,
          theme: xtermTheme,
        });
        const fitAddon = new fitModule.FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();
        term.focus();

        termRef.current = term;
        fitAddonRef.current = fitAddon;
        term.writeln(
          `Connecting to ${namespace}/${name} (${selectedContainer})...`,
        );

        const url = buildPodTerminalUrl({
          container: selectedContainer,
          name,
          namespace,
        });
        session = getTerminalSession(sessionKey, url);
        socketRef.current = session.socket;
        setConnected(session.connected);

        if (session.buffer.length > 0) {
          term.write(session.buffer.join(""));
        }

        sessionListener = (event) => {
          if (disposed) {
            return;
          }

          if (event.type === "open") {
            term.focus();
            return;
          }

          if (event.type === "message") {
            if (event.data.startsWith("Connected to ")) {
              setConnected(true);
            }
            term.write(event.data);
            return;
          }

          if (event.type === "close") {
            setConnected(false);
            const closeEvent = event.event;
            const suffix =
              closeEvent?.code || closeEvent?.reason
                ? ` (${closeEvent.code || "unknown"}${
                    closeEvent.reason ? ` ${closeEvent.reason}` : ""
                  })`
                : "";
            const state = event.wasConnected
              ? "disconnected"
              : "closed before Kubernetes exec was ready";
            term.writeln(`\r\n[terminal ${state}${suffix}]`);
            return;
          }

          if (event.type === "error") {
            term.writeln("\r\n[terminal connection error]");
          }
        };

        session.listeners.add(sessionListener);

        dataDisposable = term.onData((data) => {
          if (session?.socket.readyState === WebSocket.OPEN) {
            session.socket.send(data);
          }
        });

        resizeObserver = new ResizeObserver(() => {
          fitAddon.fit();
        });
        resizeObserver.observe(terminalRef.current);
      },
    );

    return () => {
      disposed = true;
      session?.listeners.delete(sessionListener);
      releaseTerminalSession(sessionKey);
      dataDisposable?.dispose();
      resizeObserver?.disconnect();
      termRef.current?.dispose();
      socketRef.current = null;
      termRef.current = null;
      fitAddonRef.current = null;
      setConnected(false);
    };
  }, [name, namespace, selectedContainer]);

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        sx={{
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          sx={{ alignItems: { xs: "stretch", sm: "center" } }}
        >
          <Typography sx={detailLabelSx}>Container</Typography>
          <Select
            onChange={(event) => setSelectedContainer(event.target.value)}
            size="small"
            sx={{ minWidth: 180 }}
            value={selectedContainer}
          >
            {(containers.length ? containers : [container]).map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </Select>
        </Stack>

        <Stack
          direction="row"
          spacing={1.25}
          sx={{ alignItems: "center", justifyContent: "flex-end" }}
        >
          <Typography
            sx={{
              color: connected ? "success.main" : "text.secondary",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {connected ? "Connected" : "Connecting"}
          </Typography>
          <Button onClick={() => termRef.current?.clear()} variant="outlined">
            Clear
          </Button>
        </Stack>
      </Stack>

      <Box
        ref={terminalRef}
        sx={{
          ...terminalSx,
          minHeight: 620,
          p: 1.5,
          "& .xterm": {
            height: "100%",
          },
          "& .xterm-screen": {
            height: "100%",
          },
        }}
      />
    </Box>
  );
};

export default PodTerminalPanel;
