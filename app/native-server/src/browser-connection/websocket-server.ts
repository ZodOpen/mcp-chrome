/**
 * WebSocket Server - Handle browser extension connections
 *
 * Responsibilities:
 * - Accept WebSocket connections from browser extensions
 * - Handle client registration and authentication
 * - Manage WebSocket lifecycle (ping/pong, reconnection)
 * - Delegate message handling to ConnectionManager
 */

import WebSocket, { WebSocketServer } from 'ws';
import type { Server as HTTPServer } from 'node:http';
import type { IncomingMessage } from 'node:http';
import {
  BrowserConnectionManager,
  type RegisterMessage,
  type RemoteToolResponse,
} from './connection-manager';
import { randomUUID } from 'node:crypto';

// ============================================================
// Types
// ============================================================

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

// ============================================================
// WebSocket Server Handler
// ============================================================

export class BrowserWebSocketServer {
  private wss: WebSocket.Server | null = null;
  private connectionManager: BrowserConnectionManager;

  constructor(private readonly httpServer: any) {
    this.connectionManager = new BrowserConnectionManager();
  }

  /**
   * Get the connection manager instance
   */
  public getConnectionManager(): BrowserConnectionManager {
    return this.connectionManager;
  }

  /**
   * Start WebSocket server
   */
  public start(): void {
    const WebSocketServer = require('ws').WebSocketServer;

    const wss = new WebSocket.Server({
      noServer: true, // We'll upgrade existing HTTP server
      path: '/browser-ws',
    });

    console.log('[BrowserConnection] WebSocket server initialized');

    wss.on('connection', this.handleConnection.bind(this));

    this.wss = wss;
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    let clientId: string | null = null;

    console.log('[BrowserConnection] New WebSocket connection attempt');

    // Handle incoming messages
    ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());

        // Client registration
        if (message.type === 'register') {
          const registerMsg = message as RegisterMessage;
          clientId = registerMsg.clientId || randomUUID();

          this.connectionManager.addClient(clientId, ws, registerMsg.userAgent || 'Unknown');

          // Send registration confirmation
          ws.send(
            JSON.stringify({
              type: 'registered',
              clientId,
              timestamp: Date.now(),
            }),
          );
        }

        // Heartbeat
        else if (message.type === 'ping') {
          if (clientId) {
            this.connectionManager.updateClientPing(clientId);
          }
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }

        // Tool execution response
        else if (message.type === 'response') {
          this.connectionManager.handleToolResponse(message as RemoteToolResponse);
        }
      } catch (error) {
        console.error('[BrowserConnection] Error handling message:', error);
      }
    });

    ws.on('close', () => {
      if (clientId) {
        this.connectionManager.removeClient(clientId);
      }
    });

    ws.on('error', (error) => {
      console.error('[BrowserConnection] WebSocket error:', error);
    });
  }

  /**
   * Get WebSocket server instance
   */
  public getWebSocketServer(): WebSocket.Server | null {
    return this.wss;
  }

  /**
   * Shutdown WebSocket server
   */
  public shutdown(): void {
    this.connectionManager.shutdown();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}
