export type TerminalSessionEvent =
  | { type: "open" }
  | { data: string; type: "message" }
  | { event: CloseEvent; type: "close"; wasConnected: boolean }
  | { event: Event; type: "error" };

export type TerminalSession = {
  buffer: string[];
  closeTimer: number | null;
  connected: boolean;
  listeners: Set<(event: TerminalSessionEvent) => void>;
  socket: WebSocket;
};

const terminalSessions = new Map<string, TerminalSession>();

export const getTerminalSession = (key, url): TerminalSession => {
  const existing = terminalSessions.get(key);
  if (existing) {
    if (existing.closeTimer) {
      window.clearTimeout(existing.closeTimer);
      existing.closeTimer = null;
    }
    return existing;
  }

  const session = {
    buffer: [],
    closeTimer: null,
    connected: false,
    listeners: new Set<(event: TerminalSessionEvent) => void>(),
    socket: new WebSocket(url),
  };

  const emit = (event) => {
    session.listeners.forEach((listener) => listener(event));
  };

  session.socket.addEventListener("open", () => {
    emit({ type: "open" });
  });

  session.socket.addEventListener("message", (event) => {
    const data =
      typeof event.data === "string" ? event.data : String(event.data);
    if (data.startsWith("Connected to ")) {
      session.connected = true;
    }
    session.buffer.push(data);
    emit({ data, type: "message" });
  });

  session.socket.addEventListener("close", (event) => {
    const wasConnected = session.connected;
    session.connected = false;
    terminalSessions.delete(key);
    emit({ event, type: "close", wasConnected });
  });

  session.socket.addEventListener("error", (event) => {
    emit({ event, type: "error" });
  });

  terminalSessions.set(key, session);
  return session;
};

export const releaseTerminalSession = (key) => {
  const session = terminalSessions.get(key);
  if (!session || session.closeTimer) {
    return;
  }

  session.closeTimer = window.setTimeout(() => {
    if (session.socket.readyState === WebSocket.OPEN) {
      session.socket.close(1000, "terminal panel detached");
    } else if (session.socket.readyState === WebSocket.CONNECTING) {
      session.socket.close();
    }
    terminalSessions.delete(key);
  }, 5000);
};
