# Chrome MCP Server 🚀

> ⚠️ **This project is based on the original project**: [https://github.com/hangwin/mcp-chrome.git](https://github.com/hangwin/mcp-chrome.git)
>
> This project adds remote HTTP connection and WebSocket connection capabilities on top of the original project, supporting both local and remote operation modes.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://developer.chrome.com/docs/extensions/)

> 🌟 **Turn your Chrome browser into your intelligent assistant** - Let AI take control of your browser, transforming it into a powerful AI-controlled automation tool.

**📖 Documentation**: [English](README.md) | [中文](README_zh.md)

> The project is still in its early stages and is under intensive development. More features, stability improvements, and other enhancements will follow.

---

## 🎯 What is Chrome MCP Server?

Chrome MCP Server is a Chrome extension-based **Model Context Protocol (MCP) server** that exposes your Chrome browser functionality to AI assistants like Claude, enabling complex browser automation, content analysis, and semantic search. Unlike traditional browser automation tools (like Playwright), **Chrome MCP Server** directly uses your daily Chrome browser, leveraging existing user habits, configurations, and login states, allowing various large models or chatbots to take control of your browser and truly become your everyday assistant.

## ✨ Core Features

- 😁 **Chatbot/Model Agnostic**: Let any LLM or chatbot client or agent you prefer automate your browser
- ⭐️ **Use Your Original Browser**: Seamlessly integrate with your existing browser environment (your configurations, login states, etc.)
- 💻 **Local and Remote Modes**: Support both fully local operation (privacy-first) and remote server deployment (flexible scaling)
- 🚄 **Multiple Connection Methods**:
  - **Streamable HTTP**: HTTP connection method supported for both local and remote (recommended)
  - **WebSocket Remote Connection**: Browser extension connects to remote server via WebSocket for remote control
  - **STDIO**: Traditional standard input/output connection method
- 🌐 **Remote Control Capabilities**:
  - **HTTP Remote Connection**: Extension can directly connect to remote MCP server via HTTP
  - **WebSocket Bidirectional Communication**: Real-time bidirectional communication between browser extension and remote server
  - **Multi-Client Management**: Remote server can manage multiple browser client connections simultaneously
- 🏎 **Cross-Tab**: Cross-tab context
- 🧠 **Semantic Search**: Built-in vector database for intelligent browser tab content discovery
- 🔍 **Smart Content Analysis**: AI-powered text extraction and similarity matching
- 🌐 **20+ Tools**: Support for screenshots, network monitoring, interactive operations, bookmark management, browsing history, and 20+ other tools
- 🚀 **SIMD-Accelerated AI**: Custom WebAssembly SIMD optimization for 4-8x faster vector operations

## 🆚 Comparison with Similar Projects

| Comparison Dimension    | Playwright-based MCP Server                                                                                               | Chrome Extension-based MCP Server                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Resource Usage**      | ❌ Requires launching independent browser process, installing Playwright dependencies, downloading browser binaries, etc. | ✅ No need to launch independent browser process, directly utilizes user's already open Chrome browser |
| **User Session Reuse**  | ❌ Requires re-login                                                                                                      | ✅ Automatically uses existing login state                                                             |
| **Browser Environment** | ❌ Clean environment lacks user settings                                                                                  | ✅ Fully preserves user environment                                                                    |
| **API Access**          | ⚠️ Limited to Playwright API                                                                                              | ✅ Full access to Chrome native APIs                                                                   |
| **Startup Speed**       | ❌ Requires launching browser process                                                                                     | ✅ Only needs to activate extension                                                                    |
| **Response Speed**      | 50-200ms inter-process communication                                                                                      | ✅ Faster                                                                                              |

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0 and pnpm/npm
- Chrome/Chromium browser

### Method 1: Using Pre-built Version (Recommended for Beginners, Easiest)

#### Quick Installation Steps

1. **Download Pre-built Packages from GitHub Releases**

Visit: https://github.com/ZodOpen/mcp-chrome/releases

Download the following files:

- **Chrome Extension Package**: `chrome-mcp-server-latest.zip` (or the latest version extension package)
- **Native Server Deployment Package**: `native-server-deploy.tar.gz` (or the latest version server package)

2. **Install Chrome Extension**
   - Extract the downloaded extension package (e.g., `chrome-mcp-server-latest.zip`)
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the extracted extension folder (the directory containing `manifest.json`)
   - Extension installed successfully!

3. **Start Local MCP Server**

   ```bash
   # Extract server deployment package
   tar -xzf native-server-deploy.tar.gz
   cd native-server-deploy

   # Install dependencies
   npm install --production

   # Start server
   node start-server-only.js 12306
   ```

   After successful startup, you'll see output similar to:

   ```
   🚀 Starting Chrome MCP HTTP Server (standalone mode)...
   📡 Port: 12306
   🌍 Host: 0.0.0.0
   ✅ Server started successfully!
   🔗 MCP Endpoint: http://0.0.0.0:12306/mcp
   💓 Health Check: http://0.0.0.0:12306/ping
   ```

4. **Configure Extension Connection**
   - Click the extension icon in the browser toolbar
   - Select "HTTP Connection" mode
   - Enter server address: `http://127.0.0.1:12306`
   - Click "Connect"
   - After successful connection, status will show "✅ Connected"

5. **Configure MCP Client**

   Add the following configuration to your MCP client (such as CherryStudio, Dify, etc.):

   ```json
   {
     "mcpServers": {
       "chrome-mcp-server": {
         "type": "streamableHttp",
         "url": "http://127.0.0.1:12306/mcp"
       }
     }
   }
   ```

   <img width="475" alt="Screenshot 2025-06-09 15 52 06" src="https://github.com/user-attachments/assets/241e57b8-c55f-41a4-9188-0367293dc5bc" />

#### Using PM2 to Manage Server (Optional, Recommended for Production)

If you want the server to run in the background, you can use PM2:

```bash
# Install PM2 (if not installed)
npm install -g pm2

# Start server
cd native-server-deploy
pm2 start start-server-only.js --name mcp-chrome -- 12306

# Check status
pm2 status

# View logs
pm2 logs mcp-chrome

# Set auto-start on boot
pm2 save
pm2 startup
```

#### Alternative Method: Using npm Global Install (Traditional Method)

If you prefer using npm global installation:

```bash
# Using npm
npm install -g mcp-chrome-bridge

# Using pnpm
pnpm config set enable-pre-post-scripts true
pnpm install -g mcp-chrome-bridge

# If automatic registration fails, register manually
mcp-chrome-bridge register
```

> Note: pnpm v7+ disables postinstall scripts by default for security. The `enable-pre-post-scripts` setting controls whether pre/post install scripts run. If automatic registration fails, use the manual registration command above.

### Method 2: Build from Source (For Developers)

> 💡 **Tip**: If you just want to use this tool, we recommend **Method 1** (pre-built version), which is simpler and faster. Method 2 is suitable for developers who need to modify code, contribute code, or understand the project's internal structure.

#### 1. Clone Repository

```bash
git clone https://github.com/ZodOpen/mcp-chrome.git
cd mcp-chrome
```

#### 2. Install Dependencies

```bash
pnpm install
```

#### 3. Build Project

```bash
# Build all modules
pnpm build

# Or build step by step
pnpm build:shared    # Build shared package
pnpm build:native    # Build native-server
pnpm build:extension # Build Chrome extension
```

#### 4. Local Development

**Develop Native Server (Local MCP Server)**

```bash
# Method 1: Development mode (auto-restart)
cd app/native-server
pnpm dev

# Method 2: Manual start (HTTP server only, no Native Messaging dependency)
node start-server-only.js 12306
```

**Develop Chrome Extension**

```bash
cd app/chrome-extension
pnpm dev
```

In development mode, the extension will auto-reload. After modifying code, refresh the browser to see changes.

#### 5. Load Development Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select directory: `app/chrome-extension/.output/chrome-mv3/`

#### 6. Build for Deployment

**Build Chrome Extension**

```bash
cd app/chrome-extension
pnpm build
```

Build output location: `app/chrome-extension/.output/chrome-mv3/`

**Build Native Server Deployment Package**

```bash
cd app/native-server

# Ensure build is complete
pnpm build

# Prepare deployment package
chmod +x prepare-deploy.sh
./prepare-deploy.sh
```

Deployment package location: `app/native-server/native-server-deploy.tar.gz`

For detailed deployment instructions, see: [Build and Deploy Documentation](docs/BUILD_AND_DEPLOY.md)

### Usage with MCP Protocol Clients

#### Method 1: Local Connection (Local MCP Server)

##### 1.1 Using Streamable HTTP Connection (👍🏻 Recommended)

Add the following configuration to your MCP client configuration (using CherryStudio as an example):

```json
{
  "mcpServers": {
    "chrome-mcp-server": {
      "type": "streamableHttp",
      "url": "http://127.0.0.1:12306/mcp"
    }
  }
}
```

##### 1.2 Using STDIO Connection (Alternative)

If your client only supports STDIO connection method, please use the following approach:

1. First, check the installation location of the npm package you just installed

```sh
# npm check method
npm list -g mcp-chrome-bridge
# pnpm check method
pnpm list -g mcp-chrome-bridge
```

Assuming the command above outputs the path: `/Users/xxx/Library/pnpm/global/5`
Then your final path would be: `/Users/xxx/Library/pnpm/global/5/node_modules/mcp-chrome-bridge/dist/mcp/mcp-server-stdio.js`

2. Replace the configuration below with the final path you just obtained

```json
{
  "mcpServers": {
    "chrome-mcp-stdio": {
      "command": "npx",
      "args": [
        "node",
        "/Users/xxx/Library/pnpm/global/5/node_modules/mcp-chrome-bridge/dist/mcp/mcp-server-stdio.js"
      ]
    }
  }
}
```

#### Method 2: Remote Connection (Remote Server + Browser Extension)

##### 2.1 Deploy Remote MCP Server

1. **Build Server Deployment Package**

```bash
# In project root directory
cd app/native-server

# Build shared package (if not already built)
cd ../../packages/shared
pnpm build

# Build native-server
cd ../../app/native-server
pnpm build

# Prepare deployment package
chmod +x prepare-deploy.sh
./prepare-deploy.sh
```

Deployment package location: `app/native-server/native-server-deploy.tar.gz`

2. **Upload and Deploy to Remote Server**

```bash
# Upload to server
scp app/native-server/native-server-deploy.tar.gz root@your-server:/root/

# SSH to server
ssh root@your-server

# Extract and install
cd /root
mkdir -p mcp-server
tar -xzf native-server-deploy.tar.gz -C mcp-server/
cd mcp-server
npm install --production

# Start server (using PM2)
pm2 start start-server-only.js --name mcp-chrome -- 12306
pm2 save
pm2 startup
```

3. **Configure Client to Connect to Remote Server**

Add the following to your MCP client configuration:

```json
{
  "mcpServers": {
    "chrome-mcp-server-remote": {
      "type": "streamableHttp",
      "url": "http://your-server-ip:12306/mcp"
    }
  }
}
```

##### 2.2 Configure Browser Extension to Connect to Remote Server

1. **Load Chrome Extension** (refer to "Load Chrome Extension" section below)

2. **Configure Remote Connection in Extension**
   - Open extension popup
   - Select "Remote WebSocket" connection mode
   - Enter remote server address: `ws://your-server-ip:12306/browser-ws`
   - Click "Connect"

   Or use HTTP connection mode:
   - Select "HTTP Connection" mode
   - Enter remote server address: `http://your-server-ip:12306`
   - Click "Connect"

3. **Verify Connection**

   After successful connection, the extension status should show "✅ Connected", and the remote server can now control your browser.

> 💡 **Tip**: In remote connection mode, the browser extension connects to the remote server via WebSocket or HTTP. The server receives MCP requests from AI clients and forwards them to connected browser extensions for execution.

## 🛠️ Available Tools

Complete tool list: [Complete Tool List](docs/TOOLS.md)

<details>
<summary><strong>📊 Browser Management (6 tools)</strong></summary>

- `get_windows_and_tabs` - List all browser windows and tabs
- `chrome_navigate` - Navigate to URLs and control viewport
- `chrome_switch_tab` - Switch the current active tab
- `chrome_close_tabs` - Close specific tabs or windows
- `chrome_go_back_or_forward` - Browser navigation control
- `chrome_inject_script` - Inject content scripts into web pages
- `chrome_send_command_to_inject_script` - Send commands to injected content scripts
</details>

<details>
<summary><strong>📸 Screenshots & Visual (1 tool)</strong></summary>

- `chrome_screenshot` - Advanced screenshot capture with element targeting, full-page support, and custom dimensions
</details>

<details>
<summary><strong>🌐 Network Monitoring (4 tools)</strong></summary>

- `chrome_network_capture_start/stop` - webRequest API network capture
- `chrome_network_debugger_start/stop` - Debugger API with response bodies
- `chrome_network_request` - Send custom HTTP requests
</details>

<details>
<summary><strong>🔍 Content Analysis (4 tools)</strong></summary>

- `search_tabs_content` - AI-powered semantic search across browser tabs
- `chrome_get_web_content` - Extract HTML/text content from pages
- `chrome_get_interactive_elements` - Find clickable elements
- `chrome_console` - Capture and retrieve console output from browser tabs
</details>

<details>
<summary><strong>🎯 Interaction (3 tools)</strong></summary>

- `chrome_click_element` - Click elements using CSS selectors
- `chrome_fill_or_select` - Fill forms and select options
- `chrome_keyboard` - Simulate keyboard input and shortcuts
</details>

<details>
<summary><strong>📚 Data Management (5 tools)</strong></summary>

- `chrome_history` - Search browser history with time filters
- `chrome_bookmark_search` - Find bookmarks by keywords
- `chrome_bookmark_add` - Add new bookmarks with folder support
- `chrome_bookmark_delete` - Delete bookmarks
</details>

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📚 More Documentation

- [Architecture Design](docs/ARCHITECTURE.md) - Detailed technical architecture documentation
- [TOOLS API](docs/TOOLS.md) - Complete tool API documentation
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issue solutions
- [Build and Deploy](docs/BUILD_AND_DEPLOY.md) - Detailed build and deployment process
- [Remote Control Architecture](docs/REMOTE_CONTROL_ARCHITECTURE.md) - Remote connection architecture design
