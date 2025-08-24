<template>
  <div>
    <h3 style="margin:0 0 8px 0;">Quick Translate</h3>
    <div class="row">
      <button @click="toggle">啟用/停用翻譯</button>
      <button @click="openWords">單字本</button>
    </div>
    <p class="muted" id="state">{{ stateLabel }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const stateLabel = ref('狀態讀取中…');

function setStateLabel(st) {
  stateLabel.value = st?.enabled ? '目前：啟用' : '目前：停用';
}

function toggle() {
  chrome.runtime.sendMessage({ type: 'QTX_TOGGLE' }, (st) => setStateLabel(st));
}

function openWords() {
  const url = chrome.runtime.getURL('words.html');
  chrome.tabs.create({ url });
}

onMounted(() => {
  chrome.runtime.sendMessage({ type: 'QTX_GET_STATE' }, (st) => setStateLabel(st));
});
</script>

<style scoped>
:root {
  --bg: #0f172a;
  --panel: #1e293b;
  --text: #ffffff;
  --muted: #94a3b8;
  --primary: #3b82f6;
  --primary2: #1d4ed8;
  --border: #334155;
  --radius: 10px;
  --shadow: 0 6px 16px rgba(0, 0, 0, .35);
}
@media (prefers-color-scheme: light) {
  :root {
    --bg: #ffffff;
    --panel: #f8fafc;
    --text: #1e293b;
    --muted: #475569;
    --primary: #2563eb;
    --primary2: #1e40af;
    --border: #cbd5e1;
    --shadow: 0 4px 10px rgba(15, 23, 42, .08);
  }
}
html, body {
  margin: 0;
  background: var(--bg);
}
body {
  width: 320px;
  padding: 14px;
  font: 14px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans TC", Arial, sans-serif;
  color: var(--text);
}
h3 {
  margin: 0 0 8px 0;
  color: var(--primary);
  font-weight: 600;
}
.row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px;
  box-shadow: var(--shadow);
}
button {
  border: 1px solid var(--border);
  background: var(--panel);
  padding: 6px 10px;
  font-size: 14px;
}
.muted {
  color: #666;
  font-size: 12px;
}
</style>

