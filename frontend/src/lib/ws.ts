type EventHandler = (payload: unknown) => void;

interface WsEvent {
  type: string;
  payload: unknown;
}

const HEARTBEAT_MS = 20_000;
const MAX_BACKOFF_MS = 30_000;
const INITIAL_BACKOFF_MS = 1_000;

class SangatiWsClient {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners = new Map<string, Set<EventHandler>>();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private backoff = INITIAL_BACKOFF_MS;
  private intentionalClose = false;

  constructor() {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    this.url = `${proto}://${window.location.host}/ws`;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.intentionalClose = false;

    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.backoff = INITIAL_BACKOFF_MS;
      this.startHeartbeat();
      this.emit('_connected', null);
    };

    this.ws.onmessage = (ev: MessageEvent) => {
      if (ev.data === 'pong') return;
      try {
        const msg = JSON.parse(ev.data as string) as WsEvent;
        this.emit(msg.type, msg.payload);
      } catch {
        /* ignore malformed messages */
      }
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.emit('_disconnected', null);
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  private emit(event: string, payload: unknown): void {
    this.listeners.get(event)?.forEach((fn) => {
      try {
        fn(payload);
      } catch {
        /* subscriber errors don't crash the client */
      }
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, HEARTBEAT_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.backoff);
    this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF_MS);
  }
}

export const wsClient = new SangatiWsClient();
