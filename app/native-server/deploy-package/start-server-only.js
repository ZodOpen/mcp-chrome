#!/usr/bin/env node
/**
 * 独立启动 HTTP Server（不依赖 Native Messaging）
 * 用于远程服务器部署
 *
 * 使用方法：
 *   node start-server-only.js [port]
 *   node start-server-only.js 12306
 */

const Server = require('./dist/server').Server;

const port = parseInt(process.argv[2]) || 12306;
const host = process.env.HOST || '0.0.0.0'; // 监听所有网络接口

console.log('🚀 Starting Chrome MCP HTTP Server (standalone mode)...');
console.log(`📡 Port: ${port}`);
console.log(`🌍 Host: ${host}`);

const server = new Server();

// 创建一个模拟的 Native Host（用于满足 Server 的依赖）
const mockNativeHost = {
  sendRequestToExtensionAndWait: async () => {
    throw new Error('Native Messaging not available in standalone mode');
  },
};

server.setNativeHost(mockNativeHost);

// 启动服务器
server
  .start(port, null)
  .then(() => {
    console.log('✅ Server started successfully!');
    console.log(`🔗 MCP Endpoint: http://${host}:${port}/mcp`);
    console.log(`💓 Health Check: http://${host}:${port}/ping`);
    console.log('\n📝 Press Ctrl+C to stop the server');
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n⏹️  Stopping server...');
  try {
    await server.stop();
    console.log('✅ Server stopped gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error stopping server:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Received SIGTERM, stopping server...');
  try {
    await server.stop();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
});
