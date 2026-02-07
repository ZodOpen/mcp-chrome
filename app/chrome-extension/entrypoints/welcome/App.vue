<script setup lang="ts">
import { ref } from 'vue';
import { LINKS, NATIVE_HOST } from '@/common/constants';

import '../sidepanel/styles/agent-chat.css';

const COMMANDS = {
  npmInstall: 'npm install -g mcp-chrome-bridge',
  pnpmInstall: 'pnpm add -g mcp-chrome-bridge',
  yarnInstall: 'yarn global add mcp-chrome-bridge',
  mcpUrl: 'http://127.0.0.1:' + NATIVE_HOST.DEFAULT_PORT + '/mcp',
  wsUrl: 'ws://your-server:' + NATIVE_HOST.DEFAULT_PORT + '/browser-ws',
  doctor: 'mcp-chrome-bridge doctor',
  fix: 'mcp-chrome-bridge doctor --fix',
  report: 'mcp-chrome-bridge report --copy',
} as const;

type CommandKey = keyof typeof COMMANDS;

const copiedKey = ref<CommandKey | null>(null);

const ALT_INSTALL = [
  { label: 'pnpm', key: 'pnpmInstall' },
  { label: 'yarn', key: 'yarnInstall' },
] as const satisfies ReadonlyArray<{ label: string; key: CommandKey }>;

const DIAGNOSTICS = [
  { label: 'Doctor', key: 'doctor' },
  { label: 'Auto-fix', key: 'fix' },
] as const satisfies ReadonlyArray<{ label: string; key: CommandKey }>;

function copyLabel(key: CommandKey): string {
  return copiedKey.value === key ? '已复制' : '复制';
}

function copyColor(key: CommandKey): string {
  return copiedKey.value === key ? 'var(--ac-success)' : 'var(--ac-text-muted)';
}

async function copyCommand(key: CommandKey): Promise<void> {
  try {
    await navigator.clipboard.writeText(COMMANDS[key]);
    copiedKey.value = key;
    window.setTimeout(() => {
      if (copiedKey.value === key) copiedKey.value = null;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
    copiedKey.value = null;
  }
}

async function openDocs(): Promise<void> {
  try {
    await chrome.tabs.create({ url: LINKS.TROUBLESHOOTING });
  } catch {
    window.open(LINKS.TROUBLESHOOTING, '_blank', 'noopener,noreferrer');
  }
}
</script>

<template>
  <div class="agent-theme welcome-root">
    <div class="min-h-screen flex flex-col">
      <header class="welcome-header flex-none px-6 py-5">
        <div class="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="welcome-icon w-10 h-10 flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              <svg
                class="w-6 h-6"
                :style="{ color: 'var(--ac-accent)' }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div class="min-w-0">
              <h1 class="welcome-title text-lg font-medium tracking-tight truncate">
                chrome-mcp
              </h1>
              <p class="welcome-muted text-sm truncate"> 安装插件后，完成以下配置即可开始使用 </p>
            </div>
          </div>

          <button
            class="welcome-button px-3 py-2 text-xs font-medium ac-btn flex-shrink-0"
            @click="openDocs"
          >
            故障排查文档
          </button>
        </div>
      </header>

      <main class="flex-1 px-6 py-8">
        <div class="max-w-3xl mx-auto space-y-6">
          <section class="welcome-card welcome-card--primary p-6">
            <h2 class="welcome-title text-xl font-medium">
              方式一：本地模式（安装 <code class="welcome-code">mcp-chrome-bridge</code>）
            </h2>
            <p class="welcome-muted text-sm mt-2">
              适合本地开发使用，Chrome 插件通过本地桥接程序暴露 MCP 工具给您的客户端。
            </p>

            <div class="mt-4 space-y-3">
              <div class="welcome-command-row flex items-center justify-between gap-3 px-4 py-3">
                <code class="welcome-code text-sm break-all">{{ COMMANDS.npmInstall }}</code>
                <button
                  class="welcome-mono px-2 py-1 text-xs font-medium ac-btn flex-shrink-0"
                  :style="{ color: copyColor('npmInstall') }"
                  @click="copyCommand('npmInstall')"
                >
                  {{ copyLabel('npmInstall') }}
                </button>
              </div>

              <div class="grid sm:grid-cols-2 gap-3">
                <div
                  v-for="item in ALT_INSTALL"
                  :key="item.key"
                  class="welcome-alt-row flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div class="min-w-0">
                    <div
                      class="welcome-mono welcome-subtle text-[10px] uppercase tracking-widest font-medium"
                    >
                      {{ item.label }}
                    </div>
                    <code class="welcome-code text-xs break-all">{{ COMMANDS[item.key] }}</code>
                  </div>
                  <button
                    class="welcome-mono px-2 py-1 text-xs font-medium ac-btn flex-shrink-0"
                    :style="{ color: copyColor(item.key) }"
                    @click="copyCommand(item.key)"
                  >
                    {{ copyLabel(item.key) }}
                  </button>
                </div>
              </div>

              <div class="welcome-alt-row welcome-muted px-4 py-3 text-xs">
                需要 Node.js 20+。使用
                <code class="welcome-code welcome-code-inline px-1 py-0.5">node -v</code>
                检查版本。
              </div>
            </div>

            <div
              class="mt-6 pt-5"
              :style="{ borderTop: 'var(--ac-border-width) solid var(--ac-border)' }"
            >
              <h3 class="welcome-title text-sm font-medium">MCP 客户端 URL（Streamable HTTP）</h3>
              <p class="welcome-muted text-sm mt-1">
                在您的 MCP 客户端（如 Claude Desktop、CherryStudio、Dify）中使用此 URL。
              </p>

              <div
                class="welcome-command-row mt-3 flex items-center justify-between gap-3 px-4 py-3"
              >
                <code class="welcome-code text-sm break-all">{{ COMMANDS.mcpUrl }}</code>
                <button
                  class="welcome-mono px-2 py-1 text-xs font-medium ac-btn flex-shrink-0"
                  :style="{ color: copyColor('mcpUrl') }"
                  @click="copyCommand('mcpUrl')"
                >
                  {{ copyLabel('mcpUrl') }}
                </button>
              </div>

              <p class="welcome-subtle text-xs mt-3">
                提示：您也可以打开插件弹窗，点击"连接"按钮复制完整的客户端配置代码片段。
              </p>
            </div>
          </section>

          <section class="welcome-card p-6">
            <h2 class="welcome-title text-xl font-medium"> 方式二：远程 HTTP 模式 </h2>
            <p class="welcome-muted text-sm mt-2">
              使用 HTTP 协议连接远程 MCP 服务器，适合简单的远程控制场景。
            </p>

            <div class="mt-4 space-y-4">
              <div class="welcome-alt-row p-4">
                <div class="text-sm font-medium mb-2">插件配置</div>
                <p class="welcome-muted text-xs mb-3">
                  打开插件弹窗，选择"远程 HTTP 服务器"模式，输入服务器地址：
                </p>
                <div class="welcome-command-row flex items-center justify-between gap-3 px-3 py-2">
                  <code class="welcome-code text-xs break-all">http://your-server:12306</code>
                  <button
                    class="welcome-mono px-2 py-1 text-xs font-medium ac-btn flex-shrink-0"
                    :style="{ color: copyColor('mcpUrl') }"
                    @click="copyCommand('mcpUrl')"
                  >
                    {{ copyLabel('mcpUrl') }}
                  </button>
                </div>
                <p class="welcome-subtle text-[10px] mt-2"> 💡 点击"连接"按钮测试连接 </p>
              </div>
            </div>
          </section>

          <section class="welcome-card p-6">
            <h2 class="welcome-title text-xl font-medium"> 方式三：远程 WebSocket 模式 </h2>
            <p class="welcome-muted text-sm mt-2">
              将 MCP 服务器部署到远程，本地只需浏览器插件，适合团队协作和生产环境。
            </p>

            <div class="mt-4 space-y-4">
              <div class="welcome-alt-row p-4">
                <div class="text-sm font-medium mb-2">插件配置</div>
                <p class="welcome-muted text-xs mb-3">
                  打开插件弹窗，选择"远程 WebSocket"模式，输入服务器地址：
                </p>
                <div class="welcome-command-row flex items-center justify-between gap-3 px-3 py-2">
                  <code class="welcome-code text-xs break-all">{{ COMMANDS.wsUrl }}</code>
                  <button
                    class="welcome-mono px-2 py-1 text-xs font-medium ac-btn flex-shrink-0"
                    :style="{ color: copyColor('wsUrl') }"
                    @click="copyCommand('wsUrl')"
                  >
                    {{ copyLabel('wsUrl') }}
                  </button>
                </div>
                <p class="welcome-subtle text-[10px] mt-2">
                  💡 生产环境建议使用 wss://（SSL 加密）
                </p>
              </div>
            </div>
          </section>

          <details class="welcome-card overflow-hidden">
            <summary
              class="px-6 py-4 cursor-pointer select-none flex items-center justify-between gap-4"
            >
              <div class="min-w-0">
                <div class="welcome-title text-sm font-medium">故障排查</div>
                <div class="welcome-muted text-xs truncate">
                  仅当桥接程序无法注册或连接时使用这些工具
                </div>
              </div>
              <span class="welcome-mono welcome-subtle text-xs flex-shrink-0">诊断 · 报告</span>
            </summary>

            <div class="px-6 pb-6 space-y-4">
              <div class="welcome-alt-row p-4">
                <div class="text-sm font-medium">诊断工具</div>
                <p class="welcome-muted text-sm mt-1">
                  运行
                  <code class="welcome-code">doctor</code>
                  检查安装状态。如果报告错误，运行自动修复命令。
                </p>

                <div class="mt-3 space-y-2">
                  <div
                    v-for="item in DIAGNOSTICS"
                    :key="item.key"
                    class="welcome-command-row flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <div class="min-w-0">
                      <div
                        class="welcome-mono welcome-subtle text-[10px] uppercase tracking-widest font-medium"
                      >
                        {{
                          item.label === 'Doctor'
                            ? '诊断'
                            : item.label === 'Auto-fix'
                              ? '自动修复'
                              : item.label
                        }}
                      </div>
                      <code class="welcome-code text-xs break-all">{{ COMMANDS[item.key] }}</code>
                    </div>
                    <button
                      class="welcome-mono px-2 py-1 text-xs font-medium ac-btn flex-shrink-0"
                      :style="{ color: copyColor(item.key) }"
                      @click="copyCommand(item.key)"
                    >
                      {{ copyLabel(item.key) }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.welcome-root {
  min-height: 100%;
  background: var(--ac-bg);
  background-image: var(--ac-bg-pattern);
  background-size: var(--ac-bg-pattern-size);
  color: var(--ac-text);
  font-family: var(--ac-font-body);
}

.welcome-header {
  background: var(--ac-header-bg);
  border-bottom: var(--ac-border-width) solid var(--ac-header-border);
  backdrop-filter: blur(8px);
}

.welcome-card {
  background: var(--ac-surface);
  border: var(--ac-border-width) solid var(--ac-border);
  border-radius: var(--ac-radius-card);
  box-shadow: var(--ac-shadow-card);
}

.welcome-card--primary {
  box-shadow: var(--ac-shadow-float);
}

.welcome-icon {
  background: var(--ac-surface);
  border: var(--ac-border-width) solid var(--ac-border);
  border-radius: var(--ac-radius-card);
  box-shadow: var(--ac-shadow-card);
}

.welcome-title {
  font-family: var(--ac-font-heading);
  color: var(--ac-text);
}

.welcome-muted {
  color: var(--ac-text-muted);
}

.welcome-subtle {
  color: var(--ac-text-subtle);
}

.welcome-mono {
  font-family: var(--ac-font-mono);
}

.welcome-code {
  font-family: var(--ac-font-code);
}

.welcome-button {
  font-family: var(--ac-font-mono);
  color: var(--ac-text-muted);
  background: var(--ac-surface);
  border: var(--ac-border-width) solid var(--ac-border);
  border-radius: var(--ac-radius-button);
  cursor: pointer;
  transition: all 0.2s ease;
}

.welcome-button:hover {
  background: var(--ac-hover-bg-subtle);
}

.welcome-command-row {
  background: var(--ac-code-bg);
  border: var(--ac-border-width) solid var(--ac-code-border);
  border-radius: var(--ac-radius-inner);
}

.welcome-alt-row {
  background: var(--ac-surface-muted);
  border: var(--ac-border-width) solid var(--ac-border);
  border-radius: var(--ac-radius-inner);
}

.welcome-report-card {
  background: var(--ac-diff-del-bg);
  border: var(--ac-border-width) solid var(--ac-diff-del-border);
  border-radius: var(--ac-radius-inner);
}

.welcome-code-inline {
  background: var(--ac-hover-bg-subtle);
  border: var(--ac-border-width) solid var(--ac-border);
  border-radius: 6px;
}

.ac-btn {
  cursor: pointer;
  transition: all 0.2s ease;
}

.ac-btn:hover {
  opacity: 0.8;
}

summary {
  list-style: none;
}

summary::-webkit-details-marker {
  display: none;
}
</style>
