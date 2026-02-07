/**
 * Remote Browser Tools - Bridge for MCP tool calls to remote browsers
 *
 * This module provides a bridge between MCP tool calls and remote browser connections.
 * When a tool is called, it will:
 * 1. Try to use a connected remote browser client (via WebSocket)
 * 2. Fall back to local Native Messaging if no remote client is available
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { BrowserWebSocketServer } from '../browser-connection/websocket-server';

// Global reference to the WebSocket server (will be set by the Server instance)
let browserWebSocketServer: BrowserWebSocketServer | null = null;

/**
 * Set the browser WebSocket server instance
 */
export function setBrowserWebSocketServer(server: BrowserWebSocketServer | null): void {
  browserWebSocketServer = server;
}

/**
 * Get the browser WebSocket server instance
 */
export function getBrowserWebSocketServer(): BrowserWebSocketServer | null {
  return browserWebSocketServer;
}

/**
 * Call a tool on a remote browser (if available)
 * Returns null if no remote browser is available, indicating caller should use fallback
 */
export async function callRemoteBrowserTool(
  name: string,
  args: any,
): Promise<CallToolResult | null> {
  if (!browserWebSocketServer) {
    return null; // No WebSocket server available
  }

  const connectionManager = browserWebSocketServer.getConnectionManager();
  const client = connectionManager.getFirstAvailableClient();

  if (!client) {
    return null; // No connected clients
  }

  console.log(`[RemoteBrowserTools] Calling tool on remote browser: ${name}`);

  try {
    const result = await connectionManager.sendToolCall(client.id, name, args, 120000); // 2 minute timeout

    // The result from browser is already in MCP CallToolResult format
    // Just return it directly
    console.log(`[RemoteBrowserTools] Tool call succeeded: ${name}`);
    return result as CallToolResult;
  } catch (error: any) {
    console.error(`[RemoteBrowserTools] Error calling remote tool:`, error);

    // Return error result
    return {
      content: [
        {
          type: 'text',
          text: `Remote browser tool call failed: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Check if remote browser is available
 */
export function hasRemoteBrowser(): boolean {
  if (!browserWebSocketServer) {
    return false;
  }

  const connectionManager = browserWebSocketServer.getConnectionManager();
  return connectionManager.getAllClients().length > 0;
}
