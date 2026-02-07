/**
 * Browser Connection Manager - WebSocket-based remote browser control
 *
 * Responsibilities:
 * - Manage WebSocket connections from browser extensions
 * - Route tool call requests to appropriate browser clients
 * - Handle client registration, heartbeat, and disconnection
 * - Maintain request-response mapping with timeout handling
 */

import WebSocket from 'ws';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

// ============================================================
// Types
// ============================================================

export interface BrowserClient {
  id: string;
  ws: WebSocket;
  userAgent: string;
  connectedAt: number;
  lastPing: number;
}

export interface RemoteToolRequest {
  requestId: string;
  type: 'tool_call';
  tool: string;
  args: any;
}

export interface RemoteToolResponse {
  type: 'response';
  requestId: string;
  success: boolean;
  result?: any;
  error?: string;
}

export interface RegisterMessage {
  type: 'register';
  clientId?: string;
  userAgent: string;
  timestamp: number;
}

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  timeoutId: NodeJS.Timeout;
  tool: string;
  startTime: number;
}

// ============================================================
// Browser Connection Manager
// ============================================================

export class BrowserConnectionManager {
  private clients: Map<string, BrowserClient> = new Map();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly defaultTimeout = 30000; // 30 seconds

  constructor() {
    // Start cleanup interval for stale connections
    setInterval(() => this.cleanupStaleConnections(), 60000); // Every minute
  }

  /**
   * Add a new browser client
   */
  public addClient(clientId: string, ws: WebSocket, userAgent: string): void {
    const client: BrowserClient = {
      id: clientId,
      ws,
      userAgent,
      connectedAt: Date.now(),
      lastPing: Date.now(),
    };

    this.clients.set(clientId, client);
    console.log(`[BrowserConnection] ✅ Client connected: ${clientId}`);
    console.log(`[BrowserConnection] Total clients: ${this.clients.size}`);
  }

  /**
   * Remove a browser client
   */
  public removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      // Reject all pending requests for this client
      this.rejectPendingRequestsForClient(clientId);

      this.clients.delete(clientId);
      console.log(`[BrowserConnection] ❌ Client disconnected: ${clientId}`);
      console.log(`[BrowserConnection] Total clients: ${this.clients.size}`);
    }
  }

  /**
   * Update client's last ping time
   */
  public updateClientPing(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastPing = Date.now();
    }
  }

  /**
   * Get a client by ID
   */
  public getClient(clientId: string): BrowserClient | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Get all connected clients
   */
  public getAllClients(): BrowserClient[] {
    return Array.from(this.clients.values());
  }

  /**
   * Get the first available client (for simple use cases)
   */
  public getFirstAvailableClient(): BrowserClient | null {
    const clients = Array.from(this.clients.values());
    return clients.length > 0 ? clients[0] : null;
  }

  /**
   * Send a tool call request to a specific browser client and wait for response
   */
  public async sendToolCall(
    clientId: string,
    tool: string,
    args: any,
    timeout: number = this.defaultTimeout,
  ): Promise<any> {
    const client = this.clients.get(clientId);

    if (!client) {
      throw new Error(`Browser client not found: ${clientId}`);
    }

    if (client.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`Browser client ${clientId} is not connected`);
    }

    const requestId = randomUUID();
    const startTime = Date.now();

    console.log(`[BrowserConnection] 📤 Sending tool call to ${clientId}: ${tool}`, args);

    return new Promise((resolve, reject) => {
      // Set timeout
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        const elapsed = Date.now() - startTime;
        reject(new Error(`Tool call timeout after ${elapsed}ms: ${tool}`));
      }, timeout);

      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeoutId,
        tool,
        startTime,
      });

      // Send request to browser
      const request: RemoteToolRequest = {
        requestId,
        type: 'tool_call',
        tool,
        args,
      };

      try {
        client.ws.send(JSON.stringify(request));
      } catch (error) {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(requestId);
        reject(error);
      }
    });
  }

  /**
   * Handle response from browser client
   */
  public handleToolResponse(response: RemoteToolResponse): void {
    const { requestId, success, result, error } = response;
    const pending = this.pendingRequests.get(requestId);

    if (!pending) {
      console.warn(`[BrowserConnection] ⚠️ Received response for unknown request: ${requestId}`);
      return;
    }

    const elapsed = Date.now() - pending.startTime;

    // Clear timeout
    clearTimeout(pending.timeoutId);
    this.pendingRequests.delete(requestId);

    if (success) {
      console.log(`[BrowserConnection] ✅ Tool call succeeded (${elapsed}ms): ${pending.tool}`);
      pending.resolve(result);
    } else {
      console.error(
        `[BrowserConnection] ❌ Tool call failed (${elapsed}ms): ${pending.tool}`,
        error,
      );
      pending.reject(new Error(error || 'Unknown error'));
    }
  }

  /**
   * Send a message to a client
   */
  public sendToClient(clientId: string, message: any): boolean {
    const client = this.clients.get(clientId);

    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`[BrowserConnection] Failed to send message to ${clientId}:`, error);
      return false;
    }
  }

  /**
   * Broadcast a message to all connected clients
   */
  public broadcast(message: any): void {
    const messageStr = JSON.stringify(message);

    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(messageStr);
        } catch (error) {
          console.error(`[BrowserConnection] Failed to broadcast to ${client.id}:`, error);
        }
      }
    }
  }

  /**
   * Clean up stale connections (no ping for more than 2 minutes)
   */
  private cleanupStaleConnections(): void {
    const now = Date.now();
    const staleThreshold = 2 * 60 * 1000; // 2 minutes

    for (const [clientId, client] of this.clients.entries()) {
      if (now - client.lastPing > staleThreshold) {
        console.log(`[BrowserConnection] 🧹 Cleaning up stale connection: ${clientId}`);
        client.ws.close();
        this.removeClient(clientId);
      }
    }
  }

  /**
   * Reject all pending requests for a disconnected client
   */
  private rejectPendingRequestsForClient(clientId: string): void {
    for (const [requestId, pending] of this.pendingRequests.entries()) {
      // We don't have client ID in pending requests, so we reject all
      // This could be improved by storing clientId in PendingRequest
      clearTimeout(pending.timeoutId);
      pending.reject(new Error(`Client disconnected: ${clientId}`));
    }
    // Note: This is a simple implementation. For production, you'd want to
    // track which requests belong to which client.
  }

  /**
   * Get connection statistics
   */
  public getStats() {
    return {
      totalClients: this.clients.size,
      pendingRequests: this.pendingRequests.size,
      clients: Array.from(this.clients.values()).map((client) => ({
        id: client.id,
        userAgent: client.userAgent,
        connectedAt: client.connectedAt,
        lastPing: client.lastPing,
        uptime: Date.now() - client.connectedAt,
      })),
    };
  }

  /**
   * Shutdown - close all connections
   */
  public shutdown(): void {
    console.log('[BrowserConnection] Shutting down connection manager...');

    // Close all client connections
    for (const client of this.clients.values()) {
      try {
        client.ws.close();
      } catch (error) {
        console.error(`[BrowserConnection] Error closing client ${client.id}:`, error);
      }
    }

    // Clear all pending requests
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('Server shutting down'));
    }

    this.clients.clear();
    this.pendingRequests.clear();

    console.log('[BrowserConnection] Connection manager shutdown complete');
  }
}
