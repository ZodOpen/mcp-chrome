/**
 * HTTP Connection Manager - 用于直接通过 HTTP 连接远程服务器
 * 替代 Native Messaging，支持远程部署
 */

import { BACKGROUND_MESSAGE_TYPES } from '@/common/message-types';

interface ServerStatus {
  isRunning: boolean;
  port?: number;
  lastUpdated: number;
}

interface HttpConnectionConfig {
  url: string; // 完整的服务器 URL，如 http://192.168.1.100:12306
}

// 连接状态
let httpConnectionStatus: 'unknown' | 'connected' | 'disconnected' = 'unknown';
let serverUrl: string = '';
let pingInterval: number | null = null;
let serverStatus: ServerStatus = {
  isRunning: false,
  lastUpdated: Date.now(),
};

// 存储键
const STORAGE_KEYS = {
  HTTP_MODE_ENABLED: 'httpModeEnabled',
  SERVER_URL: 'httpServerUrl',
  HTTP_SERVER_STATUS: 'httpServerStatus',
};

/**
 * 初始化 HTTP 连接配置
 */
export async function initHttpConnection(): Promise<void> {
  try {
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.HTTP_MODE_ENABLED,
      STORAGE_KEYS.SERVER_URL,
      STORAGE_KEYS.HTTP_SERVER_STATUS,
    ]);

    if (result[STORAGE_KEYS.SERVER_URL]) {
      serverUrl = result[STORAGE_KEYS.SERVER_URL];
    }

    if (result[STORAGE_KEYS.HTTP_SERVER_STATUS]) {
      serverStatus = result[STORAGE_KEYS.HTTP_SERVER_STATUS];
    }
  } catch (error) {
    console.error('Failed to load HTTP connection config:', error);
  }
}

/**
 * 检查服务器连接状态
 */
export async function checkHttpConnection(url: string): Promise<boolean> {
  if (!url) {
    return false;
  }

  try {
    const pingUrl = `${url}/ping`;
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000), // 5秒超时
    });

    if (response.ok) {
      const data = await response.json();
      httpConnectionStatus = 'connected';
      serverStatus = {
        isRunning: true,
        port: extractPort(url),
        lastUpdated: Date.now(),
      };

      // 保存状态
      await saveHttpServerStatus(serverStatus);
      broadcastServerStatusChange(serverStatus);

      return true;
    } else {
      httpConnectionStatus = 'disconnected';
      return false;
    }
  } catch (error) {
    console.error('HTTP connection check failed:', error);
    httpConnectionStatus = 'disconnected';
    serverStatus = {
      isRunning: false,
      port: extractPort(url),
      lastUpdated: Date.now(),
    };
    await saveHttpServerStatus(serverStatus);
    broadcastServerStatusChange(serverStatus);
    return false;
  }
}

/**
 * 连接到远程服务器
 */
export async function connectHttpServer(url: string): Promise<boolean> {
  serverUrl = url;

  // 保存 URL
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.SERVER_URL]: url,
      [STORAGE_KEYS.HTTP_MODE_ENABLED]: true,
    });
  } catch (error) {
    console.error('Failed to save server URL:', error);
  }

  // 检查连接
  const connected = await checkHttpConnection(url);

  if (connected) {
    // 启动心跳检测
    startPingInterval();
  }

  return connected;
}

/**
 * 断开连接
 */
export async function disconnectHttpServer(): Promise<void> {
  stopPingInterval();
  httpConnectionStatus = 'disconnected';
  serverStatus = {
    isRunning: false,
    port: serverStatus.port,
    lastUpdated: Date.now(),
  };

  await saveHttpServerStatus(serverStatus);
  broadcastServerStatusChange(serverStatus);

  // 禁用 HTTP 模式
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.HTTP_MODE_ENABLED]: false,
    });
  } catch (error) {
    console.error('Failed to disable HTTP mode:', error);
  }
}

/**
 * 启动心跳检测
 */
function startPingInterval(): void {
  stopPingInterval(); // 先清除旧的

  // Service Worker 中使用全局的 setInterval，不是 window.setInterval
  pingInterval = setInterval(async () => {
    if (serverUrl) {
      await checkHttpConnection(serverUrl);
    }
  }, 10000) as unknown as number; // 每10秒检测一次
}

/**
 * 停止心跳检测
 */
function stopPingInterval(): void {
  if (pingInterval !== null) {
    // Service Worker 中使用全局的 clearInterval，不是 window.clearInterval
    clearInterval(pingInterval);
    pingInterval = null;
  }
}

/**
 * 发送请求到远程服务器
 */
export async function sendHttpRequest(
  endpoint: string,
  method: string = 'POST',
  body?: any,
): Promise<any> {
  if (!serverUrl) {
    throw new Error('Server URL not configured');
  }

  const url = `${serverUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000), // 30秒超时
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`HTTP request failed: ${method} ${url}`, error);
    throw error;
  }
}

/**
 * 获取服务器状态
 */
export function getHttpServerStatus(): ServerStatus {
  return { ...serverStatus };
}

/**
 * 获取连接状态
 */
export function getHttpConnectionStatus(): 'unknown' | 'connected' | 'disconnected' {
  return httpConnectionStatus;
}

/**
 * 检查是否启用了 HTTP 模式
 */
export async function isHttpModeEnabled(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.HTTP_MODE_ENABLED);
    return result[STORAGE_KEYS.HTTP_MODE_ENABLED] === true;
  } catch (error) {
    return false;
  }
}

// ============ 辅助函数 ============

function extractPort(url: string): number | undefined {
  try {
    const urlObj = new URL(url);
    return urlObj.port ? parseInt(urlObj.port) : undefined;
  } catch {
    return undefined;
  }
}

async function saveHttpServerStatus(status: ServerStatus): Promise<void> {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.HTTP_SERVER_STATUS]: status,
    });
  } catch (error) {
    console.error('Failed to save HTTP server status:', error);
  }
}

function broadcastServerStatusChange(status: ServerStatus): void {
  chrome.runtime
    .sendMessage({
      type: BACKGROUND_MESSAGE_TYPES.SERVER_STATUS_CHANGED,
      payload: status,
    })
    .catch(() => {
      // Ignore if no listeners
    });
}

/**
 * 初始化消息监听器
 */
export function initHttpConnectionListener(): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const msgType = typeof message === 'object' ? message.type : message;

    if (msgType === 'HTTP_CONNECT') {
      const url = message.url;
      connectHttpServer(url)
        .then((connected) => {
          console.log('[HTTP Connection] Connect result:', {
            connected,
            status: httpConnectionStatus,
            serverStatus,
          });
          sendResponse({
            success: true,
            connected,
            serverStatus: getHttpServerStatus(),
            connectionStatus: httpConnectionStatus,
          });
        })
        .catch((error) => {
          console.error('[HTTP Connection] Connect failed:', error);
          sendResponse({ success: false, connected: false, error: String(error) });
        });
      return true;
    }

    if (msgType === 'HTTP_DISCONNECT') {
      disconnectHttpServer()
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          sendResponse({ success: false, error: String(error) });
        });
      return true;
    }

    if (msgType === 'HTTP_CHECK_STATUS') {
      sendResponse({
        status: httpConnectionStatus,
        serverStatus: serverStatus,
        serverUrl: serverUrl,
      });
      return false;
    }

    return false;
  });
}
