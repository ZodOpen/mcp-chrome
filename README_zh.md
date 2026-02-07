# Chrome MCP Server 🚀

> ⚠️ **本项目基于原项目开发**：[https://github.com/hangwin/mcp-chrome.git](https://github.com/hangwin/mcp-chrome.git)
>
> 本项目在原项目基础上新增了远程 HTTP 连接和 WebSocket 连接功能，支持本地和远程双模式运行。

[![许可证: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Chrome 扩展](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://developer.chrome.com/docs/extensions/)

> 🌟 **让chrome浏览器变成你的智能助手** - 让AI接管你的浏览器，将您的浏览器转变为强大的 AI 控制自动化工具。

**📖 文档**: [English](README.md) | [中文](README_zh.md)

---

## 🎯 什么是 Chrome MCP Server？

Chrome MCP Server 是一个基于chrome插件的 **模型上下文协议 (MCP) 服务器**，它将您的 Chrome 浏览器功能暴露给 Claude 等 AI 助手，实现复杂的浏览器自动化、内容分析和语义搜索等。与传统的浏览器自动化工具（如playwright）不同，**Chrome MCP server**直接使用您日常使用的chrome浏览器，基于现有的用户习惯和配置、登录态，让各种大模型或者各种chatbot都可以接管你的浏览器，真正成为你的日常助手

## ✨ 核心特性

- 😁 **chatbot/模型无关**：让任意你喜欢的llm或chatbot客户端或agent来自动化操作你的浏览器
- ⭐️ **使用你原本的浏览器**：无缝集成用户本身的浏览器环境（你的配置、登录态等）
- 💻 **本地和远程双模式**：支持完全本地运行（保证隐私）和远程服务器部署（灵活扩展）
- 🚄 **多种连接方式**：
  - **Streamable HTTP**：本地和远程都支持的 HTTP 连接方式（推荐）
  - **WebSocket 远程连接**：浏览器插件通过 WebSocket 连接到远程服务器，实现远程控制
  - **STDIO**：传统的标准输入输出连接方式
- 🌐 **远程控制能力**：
  - **HTTP 远程连接**：插件可直接通过 HTTP 连接到远程 MCP 服务器
  - **WebSocket 双向通信**：支持浏览器插件与远程服务器的实时双向通信
  - **多客户端管理**：远程服务器可同时管理多个浏览器客户端连接
- 🏎 **跨标签页** 跨标签页的上下文
- 🧠 **语义搜索**：内置向量数据库和本地小模型，智能发现浏览器标签页内容
- 🔍 **智能内容分析**：AI 驱动的文本提取和相似度匹配
- 🌐 **20+ 工具**：支持截图、网络监控、交互操作、书签管理、浏览历史等20多种工具
- 🚀 **SIMD 加速 AI**：自定义 WebAssembly SIMD 优化，向量运算速度提升 4-8 倍

## 🆚 与同类项目对比

| 对比维度           | 基于Playwright的MCP Server                                          | 基于Chrome插件的MCP Server                                    |
| ------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| **资源占用**       | ❌ 需启动独立浏览器进程，需要安装Playwright依赖，下载浏览器二进制等 | ✅ 无需启动独立的浏览器进程，直接利用用户已打开的Chrome浏览器 |
| **用户会话复用**   | ❌ 需重新登录                                                       | ✅ 自动使用已登录状态                                         |
| **浏览器环境保持** | ❌ 干净环境缺少用户设置                                             | ✅ 完整保留用户环境                                           |
| **API访问权限**    | ⚠️ 受限于Playwright API                                             | ✅ Chrome原生API全访问                                        |
| **启动速度**       | ❌ 需启动浏览器进程                                                 | ✅ 只需激活插件                                               |
| **响应速度**       | 50-200ms进程间通信                                                  | ✅ 更快                                                       |

## 🚀 快速开始

### 环境要求

- Node.js >= 20.0.0 和 （npm 或 pnpm）
- Chrome/Chromium 浏览器

### 方式一：使用预构建版本

#### 快速安装步骤

1. **从 GitHub Releases 下载预构建包**

访问：https://github.com/ZodOpen/mcp-chrome/releases

下载以下文件：

- **Chrome 插件包**：`chrome-mcp-server-latest.zip`（或最新版本的插件压缩包）
- **Native Server 部署包**：`native-server-deploy.tar.gz`（或最新版本的服务器部署包）

2. **安装 Chrome 插件**
   - 解压下载的插件压缩包（例如：`chrome-mcp-server-latest.zip`）
   - 打开 Chrome 并访问 `chrome://extensions/`
   - 启用右上角的"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择解压后的插件文件夹（通常包含 `manifest.json` 的目录）
   - 插件安装成功！

3. **启动本地 MCP 服务器**

   ```bash
   # 解压服务器部署包
   tar -xzf native-server-deploy.tar.gz
   cd native-server-deploy

   # 安装依赖
   npm install --production

   # 启动服务
   node start-server-only.js 12306
   ```

   启动成功后，您会看到类似以下输出：

   ```
   🚀 Starting Chrome MCP HTTP Server (standalone mode)...
   📡 Port: 12306
   🌍 Host: 0.0.0.0
   ✅ Server started successfully!
   🔗 MCP Endpoint: http://0.0.0.0:12306/mcp
   💓 Health Check: http://0.0.0.0:12306/ping
   ```

4. **配置插件连接**
   - 点击浏览器工具栏的插件图标
   - 选择"HTTP 连接"模式
   - 输入服务器地址：`http://127.0.0.1:12306`
   - 点击"连接"
   - 连接成功后，状态显示"✅ 已连接"

5. **配置 MCP 客户端**

   在您的 MCP 客户端（如 CherryStudio、Dify 等）中添加以下配置：

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

#### 使用 PM2 管理服务器（可选，推荐生产环境）

如果您希望服务器在后台运行，可以使用 PM2：

```bash
# 安装 PM2（如果未安装）
npm install -g pm2

# 启动服务器
cd native-server-deploy
pm2 start start-server-only.js --name mcp-chrome -- 12306

# 查看状态
pm2 status

# 查看日志
pm2 logs mcp-chrome

# 设置开机自启
pm2 save
pm2 startup
```

### 方式二：从源码构建和开发（适合开发者）

> 💡 **提示**：如果您只是想使用本工具，建议使用**方式一**（预构建版本），更简单快捷。方式二适合需要修改代码、贡献代码或了解项目内部结构的开发者。

#### 1. 克隆项目

```bash
git clone https://github.com/ZodOpen/mcp-chrome.git
cd mcp-chrome
```

#### 2. 安装依赖

```bash
pnpm install
```

#### 3. 构建项目

```bash
# 构建所有模块
pnpm build

# 或者分步构建
pnpm build:shared    # 构建 shared 包
pnpm build:native    # 构建 native-server
pnpm build:extension # 构建 Chrome 插件
```

#### 4. 本地开发

**开发 Native Server（本地 MCP 服务器）**

```bash
# 方式1：使用开发模式（自动重启）
cd app/native-server
pnpm dev

# 方式2：手动启动（仅启动 HTTP 服务器，不依赖 Native Messaging）
node start-server-only.js 12306
```

**开发 Chrome 插件**

```bash
cd app/chrome-extension
pnpm dev
```

开发模式下，插件会自动重新加载，修改代码后刷新浏览器即可看到效果。

#### 5. 加载开发版插件

1. 打开 Chrome 并访问 `chrome://extensions/`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择目录：`app/chrome-extension/.output/chrome-mv3/`

#### 6. 打包部署

**打包 Chrome 插件**

```bash
cd app/chrome-extension
pnpm build
```

构建产物位于：`app/chrome-extension/.output/chrome-mv3/`

**打包 Native Server 部署包**

```bash
cd app/native-server

# 确保已构建
pnpm build

# 准备部署包
chmod +x prepare-deploy.sh
./prepare-deploy.sh
```

部署包位置：`app/native-server/native-server-deploy.tar.gz`

详细部署说明请参考：[构建和部署文档](docs/BUILD_AND_DEPLOY.md)

### 在支持MCP协议的客户端中使用

#### 方式一：本地连接（本地运行 MCP 服务器）

##### 1.1 使用 Streamable HTTP 连接

将以下配置添加到客户端的 MCP 配置中（以 CherryStudio 为例）：

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

##### 1.2 使用 STDIO 连接（备选）

如果您的客户端仅支持 STDIO 连接方式，请使用以下方法：

1. 先查看您刚刚安装的 npm 包的安装位置

```sh
# npm 查看方式
npm list -g mcp-chrome-bridge
# pnpm 查看方式
pnpm list -g mcp-chrome-bridge
```

假设上面的命令输出的路径是：`/Users/xxx/Library/pnpm/global/5`
那么您的最终路径就是：`/Users/xxx/Library/pnpm/global/5/node_modules/mcp-chrome-bridge/dist/mcp/mcp-server-stdio.js`

2. 把下面的配置替换成您刚刚得到的最终路径

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

#### 方式二：远程连接（远程服务器 + 浏览器插件）

##### 2.1 部署远程 MCP 服务器

1. **构建服务器部署包**

```bash
# 在项目根目录
cd app/native-server

# 构建 shared 包（如果还没构建）
cd ../../packages/shared
pnpm build

# 构建 native-server
cd ../../app/native-server
pnpm build

# 准备部署包
chmod +x prepare-deploy.sh
./prepare-deploy.sh
```

部署包位置：`app/native-server/native-server-deploy.tar.gz`

2. **上传并部署到远程服务器**

```bash
# 上传到服务器
scp app/native-server/native-server-deploy.tar.gz root@your-server:/root/

# SSH 到服务器
ssh root@your-server

# 解压并安装
cd /root
mkdir -p mcp-server
tar -xzf native-server-deploy.tar.gz -C mcp-server/
cd mcp-server
npm install --production

# 启动服务器（使用 PM2 管理）
pm2 start start-server-only.js --name mcp-chrome -- 12306
pm2 save
pm2 startup
```

3. **配置客户端连接远程服务器**

在您的 MCP 客户端配置中添加：

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

##### 2.2 配置浏览器插件连接远程服务器

1. **加载 Chrome 插件**（参考下方"加载 Chrome 扩展"部分）

2. **在插件中配置远程连接**
   - 打开插件弹窗
   - 选择"远程 WebSocket"连接模式
   - 输入远程服务器地址：`ws://your-server-ip:12306/browser-ws`
   - 点击"连接"

   或者使用 HTTP 连接模式：
   - 选择"HTTP 连接"模式
   - 输入远程服务器地址：`http://your-server-ip:12306`
   - 点击"连接"

3. **验证连接**

   连接成功后，插件状态应显示"✅ 已连接"，此时远程服务器即可控制您的浏览器。

> 💡 **提示**：远程连接模式下，浏览器插件会通过 WebSocket 或 HTTP 连接到远程服务器，服务器接收来自 AI 客户端的 MCP 请求后，会转发给已连接的浏览器插件执行。

## 🛠️ 可用工具

完整工具列表：[完整工具列表](docs/TOOLS_zh.md)

<details>
<summary><strong>📊 浏览器管理 (6个工具)</strong></summary>

- `get_windows_and_tabs` - 列出所有浏览器窗口和标签页
- `chrome_navigate` - 导航到 URL 并控制视口
- `chrome_switch_tab` - 切换当前显示的标签页
- `chrome_close_tabs` - 关闭特定标签页或窗口
- `chrome_go_back_or_forward` - 浏览器导航控制
- `chrome_inject_script` - 向网页注入内容脚本
- `chrome_send_command_to_inject_script` - 向已注入的内容脚本发送指令
</details>

<details>
<summary><strong>📸 截图和视觉 (1个工具)</strong></summary>

- `chrome_screenshot` - 高级截图捕获，支持元素定位、全页面和自定义尺寸
</details>

<details>
<summary><strong>🌐 网络监控 (4个工具)</strong></summary>

- `chrome_network_capture_start/stop` - webRequest API 网络捕获
- `chrome_network_debugger_start/stop` - Debugger API 包含响应体
- `chrome_network_request` - 发送自定义 HTTP 请求
</details>

<details>
<summary><strong>🔍 内容分析 (4个工具)</strong></summary>

- `search_tabs_content` - AI 驱动的浏览器标签页语义搜索
- `chrome_get_web_content` - 从页面提取 HTML/文本内容
- `chrome_get_interactive_elements` - 查找可点击元素
- `chrome_console` - 捕获和获取浏览器标签页的控制台输出
</details>

<details>
<summary><strong>🎯 交互操作 (3个工具)</strong></summary>

- `chrome_click_element` - 使用 CSS 选择器点击元素
- `chrome_fill_or_select` - 填充表单和选择选项
- `chrome_keyboard` - 模拟键盘输入和快捷键
</details>

<details>
<summary><strong>📚 数据管理 (5个工具)</strong></summary>

- `chrome_history` - 搜索浏览器历史记录，支持时间过滤
- `chrome_bookmark_search` - 按关键词查找书签
- `chrome_bookmark_add` - 添加新书签，支持文件夹
- `chrome_bookmark_delete` - 删除书签
</details>

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 📚 更多文档

- [架构设计](docs/ARCHITECTURE_zh.md) - 详细的技术架构说明
- [工具列表](docs/TOOLS_zh.md) - 完整的工具 API 文档
- [故障排除](docs/TROUBLESHOOTING_zh.md) - 常见问题解决方案
- [构建和部署](docs/BUILD_AND_DEPLOY.md) - 详细的构建和部署流程
