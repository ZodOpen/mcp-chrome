/**
 * Remote Connection Manager - WebSocket client for remote browser control
 *
 * This module enables the browser extension to connect to a remote MCP server
 * and receive tool call commands over WebSocket.
 *
 * Architecture:
 * Remote MCP Server (WebSocket) ←→ This Module ←→ Local Browser Tools
 */

import { handleCallTool } from './tools';

// ============================================================
// Types
// ============================================================

interface RemoteConfig {
  serverUrl: string; // wss://your-server.com/browser-ws
  autoReconnect: boolean;
  reconnectInterval: number;
  enabled: boolean;
}

interface RemoteCommand {
  requestId: string;
  type: 'tool_call';
  tool: string;
  args: any;
}

interface RemoteResponse {
  type: 'response';
  requestId: string;
  success: boolean;
  result?: any;
  error?: string;
}

interface RemoteStatus {
  connected: boolean;
  serverUrl: string;
  clientId: string | null;
  connectedAt: number | null;
  lastPing: number | null;
}

// ============================================================
// Remote Connection Manager
// ============================================================

class RemoteConnectionManager {
  private ws: WebSocket | null = null;
  private config: RemoteConfig = {
    serverUrl: '',
    autoReconnect: true,
    reconnectInterval: 5000,
    enabled: false,
  };
  private clientId: string | null = null;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private status: RemoteStatus = {
    connected: false,
    serverUrl: '',
    clientId: null,
    connectedAt: null,
    lastPing: null,
  };

  constructor() {
    // Load config from storage on initialization
    this.loadConfig();
  }

  /**
   * Load configuration from Chrome storage
   */
  private async loadConfig(): Promise<void> {
    try {
      const result = await chrome.storage.local.get([
        'remoteServerUrl',
        'remoteEnabled',
        'remoteAutoReconnect',
      ]);

      if (result.remoteServerUrl) {
        this.config.serverUrl = result.remoteServerUrl;
      }
      if (result.remoteEnabled !== undefined) {
        this.config.enabled = result.remoteEnabled;
      }
      if (result.remoteAutoReconnect !== undefined) {
        this.config.autoReconnect = result.remoteAutoReconnect;
      }

      console.log('[RemoteConnection] Config loaded:', this.config);

      // Auto-connect if enabled
      if (this.config.enabled && this.config.serverUrl) {
        await this.connect(this.config.serverUrl);
      }
    } catch (error) {
      console.error('[RemoteConnection] Failed to load config:', error);
    }
  }

  /**
   * Connect to remote server
   */
  public async connect(serverUrl: string): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[RemoteConnection] Already connected');
      return;
    }

    this.config.serverUrl = serverUrl;

    return new Promise((resolve, reject) => {
      try {
        console.log('[RemoteConnection] Connecting to:', serverUrl);

        this.ws = new WebSocket(serverUrl);

        this.ws.onopen = () => {
          console.log('[RemoteConnection] ✅ Connected to remote server');

          // Generate client ID
          this.clientId = `browser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Send registration message
          this.send({
            type: 'register',
            clientId: this.clientId,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
          });

          // Update status
          this.status = {
            connected: true,
            serverUrl,
            clientId: this.clientId,
            connectedAt: Date.now(),
            lastPing: Date.now(),
          };

          // Start heartbeat
          this.startHeartbeat();

          // Save config
          chrome.storage.local.set({ remoteEnabled: true, remoteServerUrl: serverUrl });

          // Notify listeners
          this.notifyStatusChange();

          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = () => {
          console.log('[RemoteConnection] ❌ Connection closed');
          this.status.connected = false;
          this.stopHeartbeat();
          this.notifyStatusChange();

          // Auto-reconnect if enabled
          if (this.config.autoReconnect && this.config.enabled) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('[RemoteConnection] WebSocket error:', error);
          this.status.connected = false;
          this.notifyStatusChange();
          reject(error);
        };
      } catch (error) {
        console.error('[RemoteConnection] Connection failed:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from remote server
   */
  public disconnect(): void {
    console.log('[RemoteConnection] Disconnecting...');

    this.config.autoReconnect = false;
    this.config.enabled = false;

    // Save disconnected state to storage to prevent auto-reconnect on extension reload
    chrome.storage.local.set({ remoteEnabled: false }).catch((error) => {
      console.error('[RemoteConnection] Failed to save disconnect state:', error);
    });

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.status.connected = false;
    this.clientId = null;

    chrome.storage.local.set({ remoteEnabled: false });
    this.notifyStatusChange();
  }

  /**
   * Handle incoming WebSocket message
   */
  private async handleMessage(data: string): Promise<void> {
    try {
      const message = JSON.parse(data);

      // Registration confirmation
      if (message.type === 'registered') {
        console.log('[RemoteConnection] ✅ Registered with server:', message.clientId);
        this.clientId = message.clientId;
      }

      // Heartbeat response
      else if (message.type === 'pong') {
        this.status.lastPing = Date.now();
      }

      // Tool call command
      else if (message.type === 'tool_call') {
        await this.executeToolCommand(message as RemoteCommand);
      }
    } catch (error) {
      console.error('[RemoteConnection] Error handling message:', error);
    }
  }

  /**
   * Execute a tool call command from remote server
   */
  private async executeToolCommand(command: RemoteCommand): Promise<void> {
    const { requestId, tool, args } = command;

    console.log(`[RemoteConnection] 📥 Received tool call: ${tool}`, args);

    try {
      // Call local tool handler
      const result = await this.callLocalTool(tool, args);

      // Send success response
      this.send({
        type: 'response',
        requestId,
        success: true,
        result,
      });

      console.log(`[RemoteConnection] ✅ Tool executed successfully: ${tool}`);
    } catch (error: any) {
      // Send error response
      this.send({
        type: 'response',
        requestId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });

      console.error(`[RemoteConnection] ❌ Tool execution failed: ${tool}`, error);
    }
  }

  /**
   * Call a local tool (delegate to existing tool handler)
   */
  private async callLocalTool(tool: string, args: any): Promise<any> {
    try {
      // Directly call the tool handler (same one used by Native Messaging)
      const result = await handleCallTool({ name: tool, args });
      return result;
    } catch (error: any) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Send a message to remote server
   */
  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[RemoteConnection] Cannot send message: not connected');
    }
  }

  /**
   * Start heartbeat timer
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000) as unknown as number; // 30 seconds
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return; // Already scheduled
    }

    console.log('[RemoteConnection] Scheduling reconnect in 5 seconds...');

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;

      if (this.config.enabled && this.config.serverUrl) {
        this.connect(this.config.serverUrl).catch((error) => {
          console.error('[RemoteConnection] Reconnect failed:', error);
        });
      }
    }, this.config.reconnectInterval) as unknown as number;
  }

  /**
   * Get current status
   */
  public getStatus(): RemoteStatus {
    return { ...this.status };
  }

  /**
   * Notify listeners of status change
   */
  private notifyStatusChange(): void {
    // Broadcast status to all listeners
    chrome.runtime
      .sendMessage({
        type: 'REMOTE_STATUS_CHANGED',
        payload: this.status,
      })
      .catch(() => {
        // Ignore errors (no listeners)
      });
  }
}

// ============================================================
// Singleton Instance
// ============================================================

export const remoteConnectionManager = new RemoteConnectionManager();

// ============================================================
// Message Listener
// ============================================================

/**
 * Initialize remote connection message listener
 */
export function initRemoteConnection(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const msgType = typeof message === 'object' ? message.type : message;

    // Connect to remote server
    if (msgType === 'REMOTE_CONNECT') {
      const { serverUrl } = message;

      remoteConnectionManager
        .connect(serverUrl)
        .then(() => {
          sendResponse({ success: true, status: remoteConnectionManager.getStatus() });
        })
        .catch((error) => {
          sendResponse({ success: false, error: String(error) });
        });

      return true; // Async response
    }

    // Disconnect from remote server
    if (msgType === 'REMOTE_DISCONNECT') {
      remoteConnectionManager.disconnect();
      sendResponse({ success: true, status: remoteConnectionManager.getStatus() });
      return true;
    }

    // Get remote connection status
    if (msgType === 'REMOTE_GET_STATUS') {
      sendResponse({ success: true, status: remoteConnectionManager.getStatus() });
      return true;
    }

    return false;
  });

  console.log('[RemoteConnection] Message listener initialized');
}

// ============================================================
// Storage Change Listener
// ============================================================

/**
 * Listen for storage changes (e.g., from popup UI)
 */
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  // Remote enabled/disabled
  if (changes.remoteEnabled) {
    const enabled = changes.remoteEnabled.newValue;

    if (enabled) {
      // Try to connect
      chrome.storage.local.get(['remoteServerUrl'], (result) => {
        if (result.remoteServerUrl) {
          remoteConnectionManager.connect(result.remoteServerUrl).catch((error) => {
            console.error('[RemoteConnection] Auto-connect failed:', error);
          });
        }
      });
    } else {
      // Disconnect
      remoteConnectionManager.disconnect();
    }
  }
});
