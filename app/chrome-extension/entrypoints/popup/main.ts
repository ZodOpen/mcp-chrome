import { createApp } from 'vue';
import { NativeMessageType } from 'chrome-mcp-shared';
import './style.css';
// 引入AgentChat主题样式
import '../sidepanel/styles/agent-chat.css';
import { preloadAgentTheme } from '../sidepanel/composables/useAgentTheme';
import App from './App.vue';

// 在Vue挂载前预加载主题，防止主题闪烁
preloadAgentTheme().then(async () => {
  // Only trigger native connection if in native mode
  try {
    const result = await chrome.storage.local.get(['connectionMode']);
    const isNativeMode = !result.connectionMode || result.connectionMode === 'native';

    if (isNativeMode) {
      // Trigger ensure native connection (fire-and-forget, don't block UI mounting)
      void chrome.runtime.sendMessage({ type: NativeMessageType.ENSURE_NATIVE }).catch(() => {
        // Silent failure - background will handle reconnection
      });
    }
  } catch (error) {
    console.error('[Popup] Failed to check connection mode:', error);
  }

  createApp(App).mount('#app');
});
